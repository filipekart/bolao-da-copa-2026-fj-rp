CREATE OR REPLACE FUNCTION public.get_general_ranking()
RETURNS TABLE (
  user_id uuid,
  display_name text,
  points_matches integer,
  points_knockout integer,
  points_total integer,
  exact_hits integer,
  updated_at timestamptz,
  champion_team_name text,
  champion_flag_url text,
  top_scorer_name text,
  top_scorer_flag_url text,
  mvp_name text,
  mvp_flag_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.display_name,
    COALESCE(l.points_matches, 0),
    COALESCE(l.points_knockout, 0),
    COALESCE(l.points_total, 0),
    COALESCE(l.exact_hits, 0),
    COALESCE(l.updated_at, p.created_at),
    t_champ.name,
    t_champ.flag_url,
    ep_ts.player_name,
    t_ts.flag_url,
    ep_mvp.player_name,
    t_mvp.flag_url
  FROM public.profiles p
  LEFT JOIN public.leaderboard l ON l.user_id = p.id
  LEFT JOIN public.knockout_predictions kp ON kp.user_id = p.id AND kp.stage = 'CHAMPION'
  LEFT JOIN public.teams t_champ ON t_champ.id = kp.team_id
  LEFT JOIN public.extra_predictions ep_ts ON ep_ts.user_id = p.id AND ep_ts.category = 'top_scorer'
  LEFT JOIN public.teams t_ts ON t_ts.id = ep_ts.team_id
  LEFT JOIN public.extra_predictions ep_mvp ON ep_mvp.user_id = p.id AND ep_mvp.category = 'mvp'
  LEFT JOIN public.teams t_mvp ON t_mvp.id = ep_mvp.team_id
  WHERE p.approved = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_general_ranking() TO authenticated;