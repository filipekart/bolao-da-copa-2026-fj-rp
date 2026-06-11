
# Plano de testes — Pontuação (A, B, D)

Objetivo: validar que a pontuação está correta **sem alterar nada** no banco nem no código. Tudo via `SELECT` / `EXPLAIN` / inspeção de cron. Nenhum `UPDATE`, `INSERT`, `DELETE` ou migration.

---

## A. Função `calculate_match_prediction_points` — 6 cenários

Roda a função com pares fabricados e confere o resultado esperado. Como é `IMMUTABLE` e não lê tabela, é 100% seguro chamar via `SELECT`.

Casos a validar (resultado real 2×1, salvo indicado):

| # | Palpite | Resultado | Esperado |
|---|---------|-----------|----------|
| 1 | 2×1 | 2×1 | 25, EXACT_SCORE |
| 2 | 2×0 | 2×1 | 18, WINNER_AND_WINNER_GOALS (acertou gols do vencedor) |
| 3 | 3×1 | 2×1 | 12, WINNER_AND_LOSER_GOALS (acertou gols do perdedor) |
| 4 | 4×2 | 2×1 | 10, RESULT_ONLY |
| 5 | 1×1 | 2×2 | 16, DRAW_RESULT_ONLY |
| 6 | 1×2 | 2×1 | 0, MISS |

Extras importantes para cobrir casos de borda já levantados:
- 7. 0×0 vs 0×0 → 25 EXACT_SCORE (empate exato)
- 8. 0×0 vs 1×1 → 16 DRAW_RESULT_ONLY
- 9. Vitória visitante: palpite 0×2, real 1×3 → 12 (acertou gols do perdedor mandante)
- 10. Vitória visitante: palpite 1×3, real 0×3 → 18 (acertou gols do vencedor)

Query única que devolve todos:
```sql
SELECT
  t.label,
  (public.calculate_match_prediction_points(t.ph, t.pa, t.rh, t.ra)).*
FROM (VALUES
  ('1 exact',        2,1, 2,1),
  ('2 winner+wgoals',2,0, 2,1),
  ('3 winner+lgoals',3,1, 2,1),
  ('4 result only',  4,2, 2,1),
  ('5 draw only',    1,1, 2,2),
  ('6 miss',         1,2, 2,1),
  ('7 exact 0-0',    0,0, 0,0),
  ('8 draw 0-0',     0,0, 1,1),
  ('9 away lgoals',  0,2, 1,3),
  ('10 away wgoals', 1,3, 0,3)
) AS t(label,ph,pa,rh,ra);
```
Critério de aceite: todos os 10 retornam exatamente o esperado da tabela.

---

## B. Pipeline `score_finished_matches` end-to-end (auditoria)

Não vamos disparar a função; vamos **comparar o estado atual** do banco com o que ela *deveria* ter produzido. Se houver divergência, é bug.

### B1. Toda predição em jogo FINISHED deve ter `scored_at` preenchido e bater com o cálculo
```sql
SELECT mp.id, m.match_number, m.home_team_id, m.away_team_id,
       mp.predicted_home_score, mp.predicted_away_score,
       m.official_home_score, m.official_away_score,
       mp.points_awarded, mp.rule_applied,
       calc.points AS expected_points, calc.rule_applied AS expected_rule
FROM match_predictions mp
JOIN matches m ON m.id = mp.match_id
CROSS JOIN LATERAL public.calculate_match_prediction_points(
  mp.predicted_home_score, mp.predicted_away_score,
  m.official_home_score,   m.official_away_score
) calc
WHERE m.status = 'FINISHED'
  AND m.official_home_score IS NOT NULL
  AND m.official_away_score IS NOT NULL
  AND (mp.points_awarded <> calc.points
       OR mp.rule_applied <> calc.rule_applied
       OR mp.scored_at IS NULL);
```
Critério de aceite: **0 linhas**. Qualquer linha = predição desatualizada (jogo editado e re-scoring não rodou) ou ponto errado.

### B2. Predição em jogo NÃO finalizado não pode estar pontuada
```sql
SELECT mp.id, m.status, mp.points_awarded, mp.rule_applied, mp.scored_at
FROM match_predictions mp JOIN matches m ON m.id = mp.match_id
WHERE (m.status <> 'FINISHED'
       OR m.official_home_score IS NULL
       OR m.official_away_score IS NULL)
  AND (mp.points_awarded <> 0 OR mp.rule_applied <> 'PENDING' OR mp.scored_at IS NOT NULL);
```
Critério: **0 linhas**.

### B3. Re-scoring após edição (`updated_at > scored_at`)
```sql
SELECT mp.id, m.match_number, m.updated_at, mp.scored_at
FROM match_predictions mp JOIN matches m ON m.id = mp.match_id
WHERE m.status = 'FINISHED' AND mp.scored_at IS NOT NULL
  AND m.updated_at > mp.scored_at;
```
Critério: **0 linhas**. Linhas aqui indicam que jogos foram editados mas o scoring não foi reexecutado.

### B4. `leaderboard.points_matches` bate com a soma das predições
```sql
SELECT l.user_id, l.points_matches,
       COALESCE(SUM(mp.points_awarded),0) AS recalculated
FROM leaderboard l
LEFT JOIN match_predictions mp ON mp.user_id = l.user_id
GROUP BY l.user_id, l.points_matches
HAVING l.points_matches <> COALESCE(SUM(mp.points_awarded),0);
```
Critério: **0 linhas**.

### B5. `exact_hits` bate
```sql
SELECT l.user_id, l.exact_hits,
       COUNT(*) FILTER (WHERE mp.rule_applied = 'EXACT_SCORE') AS recalculated
FROM leaderboard l
LEFT JOIN match_predictions mp ON mp.user_id = l.user_id
GROUP BY l.user_id, l.exact_hits
HAVING l.exact_hits <> COUNT(*) FILTER (WHERE mp.rule_applied = 'EXACT_SCORE');
```
Critério: **0 linhas**.

### B6. `points_total = points_matches + points_knockout`
```sql
SELECT user_id, points_matches, points_knockout, points_total
FROM leaderboard
WHERE points_total <> points_matches + points_knockout;
```
Critério: **0 linhas**.

---

## D. Verificar o cron de scoring

Hoje **não existe trigger automático**: o re-scoring depende ou do `useUpdateMatchResult` (admin editando manualmente) ou de algum job. Vamos confirmar o que de fato está agendado.

### D1. Listar todos os crons ativos
```sql
SELECT jobid, schedule, jobname, command, active
FROM cron.job
ORDER BY jobname;
```
O que procurar:
- Existe job que chama `score_finished_matches()` periodicamente? (ex.: a cada 5–10 min)
- Existe job que chama o edge function `fetch-fifa-results` (que internamente atualiza matches)?
- Algum job usando `extensions.http_post` (função inexistente — mesmo bug do push que acabamos de corrigir)?

### D2. Histórico de execuções dos últimos 2 dias
```sql
SELECT j.jobname, r.status, r.return_message,
       r.start_time, r.end_time
FROM cron.job_run_details r
JOIN cron.job j ON j.jobid = r.jobid
WHERE r.start_time > now() - interval '2 days'
ORDER BY r.start_time DESC
LIMIT 100;
```
Critério: jobs de scoring com `status = 'succeeded'` e sem `return_message` de erro. Qualquer `failed` é bug.

### D3. Sanidade: quanto tempo faz desde o último re-scoring?
```sql
SELECT MAX(scored_at) AS last_scoring,
       now() - MAX(scored_at) AS age
FROM match_predictions;
```
Esperado: idade < (intervalo do cron + folga) se houve jogo finalizado recentemente.

### D4. Edge functions relacionadas
- Conferir logs recentes de `fetch-fifa-results` e qualquer função de scoring para garantir que estão rodando sem erro 401/500.

---

## Entregável após rodar

Para cada bloco acima, vou reportar:
- ✅ Passou (0 linhas / valores corretos) ou
- ❌ Falhou (lista das linhas divergentes + diagnóstico)

E no final um resumo: "pontuação confiável" vs. "achei X bugs, sugiro corrigir Y".

**Importante:** este plano é só leitura. Nenhuma migration, nenhuma alteração em código ou cron. Se algum teste falhar, eu paro e te mostro o que achei antes de propor correção.
