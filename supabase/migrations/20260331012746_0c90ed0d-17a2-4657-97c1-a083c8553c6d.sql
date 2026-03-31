
-- Update refresh_leaderboard: remove knockout points, add champion bonus
CREATE OR REPLACE FUNCTION public.refresh_leaderboard()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.leaderboard (user_id, points_matches, points_knockout, points_total, exact_hits, updated_at)
  SELECT
    p.id AS user_id,
    COALESCE(mp.points_matches, 0) AS points_matches,
    COALESCE(ch.champion_points, 0) AS points_knockout,
    COALESCE(mp.points_matches, 0) + COALESCE(ch.champion_points, 0) AS points_total,
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
    -- Champion prediction: 50 points if user picked the actual champion
    SELECT
      kp.user_id,
      50 AS champion_points
    FROM public.knockout_predictions kp
    INNER JOIN public.knockout_results kr
      ON kr.stage = 'CHAMPION'
     AND kr.team_id = kp.team_id
    WHERE kp.stage = 'CHAMPION'
  ) ch ON ch.user_id = p.id
  ON CONFLICT (user_id)
  DO UPDATE SET
    points_matches = excluded.points_matches,
    points_knockout = excluded.points_knockout,
    points_total = excluded.points_total,
    exact_hits = excluded.exact_hits,
    updated_at = now();
END;
$$;
