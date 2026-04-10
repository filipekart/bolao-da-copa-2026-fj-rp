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