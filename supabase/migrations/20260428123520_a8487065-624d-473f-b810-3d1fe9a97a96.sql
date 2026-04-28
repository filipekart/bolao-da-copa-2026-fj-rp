CREATE OR REPLACE VIEW public.v_ranking
WITH (security_invoker=on) AS
SELECT 
    p.id AS user_id,
    COALESCE(l.points_matches, 0) AS points_matches,
    COALESCE(l.points_knockout, 0) AS points_knockout,
    COALESCE(l.points_total, 0) AS points_total,
    COALESCE(l.exact_hits, 0) AS exact_hits,
    COALESCE(l.updated_at, p.created_at) AS updated_at,
    p.display_name,
    t_champ.name AS champion_team_name,
    t_champ.flag_url AS champion_flag_url,
    ep_ts.player_name AS top_scorer_name,
    t_ts.flag_url AS top_scorer_flag_url,
    ep_mvp.player_name AS mvp_name,
    t_mvp.flag_url AS mvp_flag_url
FROM profiles p
LEFT JOIN leaderboard l ON l.user_id = p.id
LEFT JOIN knockout_predictions kp ON kp.user_id = p.id AND kp.stage = 'CHAMPION'::knockout_stage
LEFT JOIN teams t_champ ON t_champ.id = kp.team_id
LEFT JOIN extra_predictions ep_ts ON ep_ts.user_id = p.id AND ep_ts.category = 'top_scorer'::text
LEFT JOIN teams t_ts ON t_ts.id = ep_ts.team_id
LEFT JOIN extra_predictions ep_mvp ON ep_mvp.user_id = p.id AND ep_mvp.category = 'mvp'::text
LEFT JOIN teams t_mvp ON t_mvp.id = ep_mvp.team_id
WHERE p.approved = true;