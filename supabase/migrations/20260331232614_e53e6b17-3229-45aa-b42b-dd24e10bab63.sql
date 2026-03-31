
-- Allow all authenticated users to read extra predictions (for ranking)
CREATE POLICY "authenticated can read all extra predictions"
  ON public.extra_predictions FOR SELECT TO authenticated
  USING (true);

-- Drop the old restrictive select policy
DROP POLICY IF EXISTS "Users can view own extra predictions" ON public.extra_predictions;

-- Update refresh_leaderboard to include 100pts champion, 50pts top_scorer, 50pts mvp
CREATE OR REPLACE FUNCTION public.refresh_leaderboard()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.leaderboard (user_id, points_matches, points_knockout, points_total, exact_hits, updated_at)
  SELECT
    p.id AS user_id,
    COALESCE(mp.points_matches, 0) AS points_matches,
    COALESCE(ch.champion_points, 0) + COALESCE(ts.scorer_points, 0) + COALESCE(mv.mvp_points, 0) AS points_knockout,
    COALESCE(mp.points_matches, 0) + COALESCE(ch.champion_points, 0) + COALESCE(ts.scorer_points, 0) + COALESCE(mv.mvp_points, 0) AS points_total,
    COALESCE(mp.exact_hits, 0) AS exact_hits,
    now()
  FROM public.profiles p
  LEFT JOIN (
    SELECT
      user_id,
      SUM(points_awarded)::integer AS points_matches,
      COUNT(*) FILTER (WHERE rule_applied = 'EXACT_SCORE')::integer AS exact_hits
    FROM public.match_predictions
    GROUP BY user_id
  ) mp ON mp.user_id = p.id
  LEFT JOIN (
    -- Champion: 100 points
    SELECT kp.user_id, 100 AS champion_points
    FROM public.knockout_predictions kp
    INNER JOIN public.knockout_results kr ON kr.stage = 'CHAMPION' AND kr.team_id = kp.team_id
    WHERE kp.stage = 'CHAMPION'
  ) ch ON ch.user_id = p.id
  LEFT JOIN (
    -- Top scorer: 50 points (match by player_name case-insensitive)
    SELECT ep.user_id, 50 AS scorer_points
    FROM public.extra_predictions ep
    INNER JOIN public.extra_predictions admin_result
      ON admin_result.category = 'top_scorer_result'
      AND lower(trim(ep.player_name)) = lower(trim(admin_result.player_name))
    WHERE ep.category = 'top_scorer'
  ) ts ON ts.user_id = p.id
  LEFT JOIN (
    -- MVP: 50 points (match by player_name case-insensitive)
    SELECT ep.user_id, 50 AS mvp_points
    FROM public.extra_predictions ep
    INNER JOIN public.extra_predictions admin_result
      ON admin_result.category = 'mvp_result'
      AND lower(trim(ep.player_name)) = lower(trim(admin_result.player_name))
    WHERE ep.category = 'mvp'
  ) mv ON mv.user_id = p.id
  ON CONFLICT (user_id)
  DO UPDATE SET
    points_matches = excluded.points_matches,
    points_knockout = excluded.points_knockout,
    points_total = excluded.points_total,
    exact_hits = excluded.exact_hits,
    updated_at = now();
END;
$$;
