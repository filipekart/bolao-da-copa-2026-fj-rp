
CREATE OR REPLACE FUNCTION public.get_user_exact_hits(p_user_id uuid)
RETURNS TABLE (
  match_id uuid,
  match_number integer,
  stage match_stage,
  kickoff_at timestamptz,
  home_team_name text,
  home_flag_url text,
  away_team_name text,
  away_flag_url text,
  official_home_score integer,
  official_away_score integer,
  predicted_home_score integer,
  predicted_away_score integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.id,
    m.match_number,
    m.stage,
    m.kickoff_at,
    ht.name,
    ht.flag_url,
    at.name,
    at.flag_url,
    m.official_home_score,
    m.official_away_score,
    mp.predicted_home_score,
    mp.predicted_away_score
  FROM public.match_predictions mp
  JOIN public.matches m ON m.id = mp.match_id
  LEFT JOIN public.teams ht ON ht.id = m.home_team_id
  LEFT JOIN public.teams at ON at.id = m.away_team_id
  WHERE mp.user_id = p_user_id
    AND mp.rule_applied = 'EXACT_SCORE'
    AND m.status = 'FINISHED'
  ORDER BY m.match_number;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_exact_hits(uuid) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.get_general_ranking()
 RETURNS TABLE(user_id uuid, display_name text, points_matches integer, points_knockout integer, points_total integer, exact_hits integer, updated_at timestamptz, champion_team_name text, champion_flag_url text, top_scorer_name text, top_scorer_flag_url text, mvp_name text, mvp_flag_url text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH revealed AS (SELECT NOT public.is_tournament_open() AS is_revealed)
  SELECT
    p.id,
    p.display_name,
    COALESCE(l.points_matches, 0),
    COALESCE(l.points_knockout, 0),
    COALESCE(l.points_total, 0),
    COALESCE(l.exact_hits, 0),
    COALESCE(l.updated_at, p.created_at),
    CASE WHEN r.is_revealed OR p.id = auth.uid() THEN t_champ.name END,
    CASE WHEN r.is_revealed OR p.id = auth.uid() THEN t_champ.flag_url END,
    CASE WHEN r.is_revealed OR p.id = auth.uid() THEN ep_ts.player_name END,
    CASE WHEN r.is_revealed OR p.id = auth.uid() THEN t_ts.flag_url END,
    CASE WHEN r.is_revealed OR p.id = auth.uid() THEN ep_mvp.player_name END,
    CASE WHEN r.is_revealed OR p.id = auth.uid() THEN t_mvp.flag_url END
  FROM public.profiles p
  CROSS JOIN revealed r
  LEFT JOIN public.leaderboard l ON l.user_id = p.id
  LEFT JOIN public.knockout_predictions kp ON kp.user_id = p.id AND kp.stage = 'CHAMPION'
  LEFT JOIN public.teams t_champ ON t_champ.id = kp.team_id
  LEFT JOIN public.extra_predictions ep_ts ON ep_ts.user_id = p.id AND ep_ts.category = 'top_scorer'
  LEFT JOIN public.teams t_ts ON t_ts.id = ep_ts.team_id
  LEFT JOIN public.extra_predictions ep_mvp ON ep_mvp.user_id = p.id AND ep_mvp.category = 'mvp'
  LEFT JOIN public.teams t_mvp ON t_mvp.id = ep_mvp.team_id
  WHERE p.approved = true;
$function$;
