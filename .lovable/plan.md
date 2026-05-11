## Objetivo

Garantir que o bloqueio das apostas de Extras (Campeão, Artilheiro, MVP) seja consistente entre UI, RPCs e RLS — e deixar a regra documentada para evitar regressões futuras.

## Diagnóstico atual

Trava acontece em três camadas. Todas usam o mesmo gatilho: `MIN(matches.kickoff_at)` (1º jogo da Copa = México x África do Sul, 11/06/2026 19:00 UTC).

| Camada | Onde | Regra efetiva |
|---|---|---|
| UI Campeão | `ChampionTab.tsx` → `useFirstMatchKickoff` | `now() >= MIN(kickoff_at)` esconde formulário |
| UI Artilheiro/MVP | `PlayerPredictionTab.tsx` → `useFirstMatchKickoff` | mesma regra |
| RPC Campeão | `submit_champion_prediction` | **não valida prazo** — depende de RLS |
| RPC Extras | `submit_extra_prediction` | **não valida prazo** — depende de RLS |
| RLS `knockout_predictions` INSERT | `is_knockout_stage_open('CHAMPION')` | `now() < MIN(kickoff_at)` |
| RLS `extra_predictions` INSERT/UPDATE | `is_tournament_open()` | `now() < MIN(kickoff_at)` |

### Inconsistências encontradas

1. **`extra_predictions` aceita UPSERT mas RLS UPDATE também exige `is_tournament_open()`.** OK em termos de bloqueio, mas o `ON CONFLICT DO UPDATE` dentro de `submit_extra_prediction` (SECURITY DEFINER) **bypassa RLS**. Hoje qualquer chamada autenticada via RPC poderia atualizar após o início da Copa.
2. **`submit_champion_prediction` faz DELETE+INSERT em SECURITY DEFINER**, também bypassando a checagem `is_knockout_stage_open`. Mesmo problema.
3. **`knockout_predictions` não tem policy UPDATE** (só INSERT/DELETE). O fluxo de troca de campeão depende de DELETE+INSERT — frágil se a RPC mudar.
4. **`useFirstMatchKickoff` usa `.single()`** sem tratamento se a tabela estiver vazia (cenário de seed). Risco baixo, mas vale `maybeSingle()`.
5. **Documentação ausente**: a regra "trava = 1º kickoff" não está registrada em memória do projeto nem em comentário das funções.

## Plano de ação

### 1. Endurecer as RPCs (migration)

Adicionar guard explícito de prazo dentro das duas RPCs, espelhando a RLS:

- `submit_champion_prediction`: `IF NOT public.is_knockout_stage_open('CHAMPION') THEN RAISE EXCEPTION 'A Copa já começou — palpite de campeão encerrado'; END IF;`
- `submit_extra_prediction`: `IF NOT public.is_tournament_open() THEN RAISE EXCEPTION 'A Copa já começou — palpites de Artilheiro/MVP encerrados'; END IF;`

Resultado: defesa em profundidade — mesmo com SECURITY DEFINER, a RPC respeita o prazo.

### 2. Pequenos ajustes de frontend

- Em `ChampionTab.tsx` e `PlayerPredictionTab.tsx`, trocar `.single()` por `.maybeSingle()` em `useFirstMatchKickoff` e tratar `null` como "trava desconhecida → desabilitar botão por segurança" (em vez de liberar).
- Extrair o hook `useFirstMatchKickoff` para `src/hooks/useFirstMatchKickoff.ts` (atualmente duplicado nos dois arquivos).

### 3. Documentação

- Criar `mem://features/extras-lockdown` com:
  - Gatilho único: `MIN(matches.kickoff_at)`.
  - Camadas de defesa: UI (hook compartilhado) → RPC (guard explícito) → RLS (`is_tournament_open` / `is_knockout_stage_open`).
  - Cenário de regressão a evitar: alterar SECURITY DEFINER sem reinstalar o guard.
- Atualizar `mem://index.md` adicionando referência ao novo arquivo.
- Comentários `COMMENT ON FUNCTION` em `submit_champion_prediction` e `submit_extra_prediction` apontando para a regra.

### 4. Validação

- Query manual: simular `now() = MIN(kickoff_at) + 1s` localmente (via `set_config`) e confirmar que RPCs rejeitam com mensagem clara.
- Smoke test no preview com usuário comum: tentar salvar campeão e artilheiro hoje (deve passar) — não há como testar pós-kickoff sem mock de tempo, então a validação principal é via SQL.

## Detalhes técnicos

Arquivos afetados:
- `supabase/migrations/<timestamp>_harden_extras_lockdown.sql` (novo)
- `src/hooks/useFirstMatchKickoff.ts` (novo)
- `src/components/extras/ChampionTab.tsx` (import + maybeSingle)
- `src/components/extras/PlayerPredictionTab.tsx` (import + maybeSingle)
- `mem://features/extras-lockdown` (novo)
- `mem://index.md` (atualização)

Nenhuma mudança em RLS, schema de tabela ou contratos públicos das RPCs (assinaturas permanecem iguais). Risco baixo.
