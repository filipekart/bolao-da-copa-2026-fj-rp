

## Otimizar v_ranking: 3 queries → 1

### Problema
O hook `useRanking` faz 3 queries paralelas (v_ranking + knockout_predictions + extra_predictions) e junta tudo em JavaScript. Com 300 usuários isso são 3 roundtrips + centenas de linhas trafegadas desnecessariamente.

### Solução
Mover os JOINs para dentro da view `v_ranking` no Postgres e simplificar o hook para uma única query.

### Mudanças

**1. Migration SQL — Recriar `v_ranking` com JOINs extras**

```sql
DROP VIEW IF EXISTS public.v_ranking;
CREATE VIEW public.v_ranking
WITH (security_invoker=on) AS
SELECT
  l.user_id,
  l.points_matches,
  l.points_knockout,
  l.points_total,
  l.exact_hits,
  l.updated_at,
  p.display_name,
  t_champ.name   AS champion_team_name,
  t_champ.flag_url AS champion_flag_url,
  ep_ts.player_name AS top_scorer_name,
  t_ts.flag_url     AS top_scorer_flag_url,
  ep_mvp.player_name AS mvp_name,
  t_mvp.flag_url     AS mvp_flag_url
FROM public.leaderboard l
JOIN public.profiles p ON p.id = l.user_id
LEFT JOIN public.knockout_predictions kp
  ON kp.user_id = l.user_id AND kp.stage = 'CHAMPION'
LEFT JOIN public.teams t_champ ON t_champ.id = kp.team_id
LEFT JOIN public.extra_predictions ep_ts
  ON ep_ts.user_id = l.user_id AND ep_ts.category = 'top_scorer'
LEFT JOIN public.teams t_ts ON t_ts.id = ep_ts.team_id
LEFT JOIN public.extra_predictions ep_mvp
  ON ep_mvp.user_id = l.user_id AND ep_mvp.category = 'mvp'
LEFT JOIN public.teams t_mvp ON t_mvp.id = ep_mvp.team_id
WHERE p.approved = true;
```

**2. `src/hooks/useRanking.ts` — Simplificar para 1 query**

Remover o `Promise.all` com 3 queries, os Maps de champion/extra, e todo o merge em JS. Substituir por:

```typescript
const { data, error } = await supabase.from('v_ranking').select('*');
if (error) throw error;
return data as RankingEntry[];
```

### Impacto
- 3 roundtrips → 1
- Zero processamento JS para joins
- Menos dados trafegados (só colunas necessárias, já filtradas)
- Interface `RankingEntry` permanece igual — nenhuma mudança nos componentes consumidores

