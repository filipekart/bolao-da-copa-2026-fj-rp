
-- Add ROUND_OF_32 to knockout_stage enum
ALTER TYPE public.knockout_stage ADD VALUE IF NOT EXISTS 'ROUND_OF_32';

-- Update refresh_leaderboard with correct point values including R32
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
    COALESCE(kp.points_knockout, 0) AS points_knockout,
    COALESCE(mp.points_matches, 0) + COALESCE(kp.points_knockout, 0) AS points_total,
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
    SELECT
      u.id AS user_id,
      COALESCE(SUM(CASE
        WHEN kp.stage = 'ROUND_OF_32' THEN 8
        WHEN kp.stage = 'ROUND_OF_16' THEN 10
        WHEN kp.stage = 'QUARTER_FINAL' THEN 10
        WHEN kp.stage = 'SEMI_FINAL' THEN 12
        WHEN kp.stage = 'FINAL' THEN 25
        WHEN kp.stage = 'CHAMPION' THEN 50
        ELSE 0
      END), 0)::integer AS points_knockout
    FROM public.profiles u
    LEFT JOIN public.knockout_predictions kp ON kp.user_id = u.id
    LEFT JOIN public.knockout_results kr
      ON kr.stage = kp.stage
     AND kr.team_id = kp.team_id
    WHERE kr.id IS NOT NULL
    GROUP BY u.id
  ) kp ON kp.user_id = p.id
  ON CONFLICT (user_id)
  DO UPDATE SET
    points_matches = excluded.points_matches,
    points_knockout = excluded.points_knockout,
    points_total = excluded.points_total,
    exact_hits = excluded.exact_hits,
    updated_at = now();
END;
$$;
