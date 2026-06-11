CREATE OR REPLACE VIEW public.v_extra_predictions_stats AS
WITH approved AS (
  SELECT id FROM public.profiles WHERE approved = true
),
champion AS (
  SELECT
    'champion'::text   AS categoria,
    kp.team_id::text   AS opcao_id,
    t.name             AS opcao_nome,
    t.flag_url         AS flag_url,
    NULL::text         AS team_name,
    COUNT(*)::int      AS total_apostas
  FROM public.knockout_predictions kp
  JOIN approved a ON a.id = kp.user_id
  LEFT JOIN public.teams t ON t.id = kp.team_id
  WHERE kp.stage = 'CHAMPION'
  GROUP BY kp.team_id, t.name, t.flag_url
),
players_agg AS (
  SELECT
    ep.category                                                          AS categoria,
    (lower(trim(ep.player_name)) || '|' || COALESCE(ep.team_id::text,'')) AS opcao_id,
    (array_agg(ep.player_name ORDER BY ep.submitted_at DESC))[1]         AS opcao_nome,
    t.flag_url                                                           AS flag_url,
    t.name                                                               AS team_name,
    COUNT(*)::int                                                        AS total_apostas
  FROM public.extra_predictions ep
  JOIN approved a ON a.id = ep.user_id
  LEFT JOIN public.teams t ON t.id = ep.team_id
  WHERE ep.category IN ('top_scorer','mvp')
  GROUP BY ep.category, lower(trim(ep.player_name)), ep.team_id, t.flag_url, t.name
),
unified AS (
  SELECT * FROM champion
  UNION ALL
  SELECT * FROM players_agg
)
SELECT
  categoria,
  opcao_id,
  opcao_nome,
  flag_url,
  team_name,
  total_apostas,
  (SUM(total_apostas) OVER (PARTITION BY categoria))::int AS total_categoria
FROM unified;

GRANT SELECT ON public.v_extra_predictions_stats TO authenticated;