
CREATE OR REPLACE FUNCTION public.get_round_ranking(
  p_min_match integer DEFAULT NULL,
  p_max_match integer DEFAULT NULL,
  p_knockout boolean DEFAULT false
)
RETURNS TABLE(user_id uuid, round_points bigint, exact_hits bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    mp.user_id,
    COALESCE(SUM(mp.points_awarded), 0)::bigint AS round_points,
    COUNT(*) FILTER (WHERE mp.rule_applied = 'EXACT_SCORE')::bigint AS exact_hits
  FROM public.match_predictions mp
  JOIN public.matches m ON m.id = mp.match_id
  WHERE
    CASE
      WHEN p_knockout THEN m.stage <> 'GROUP_STAGE'
      WHEN p_min_match IS NOT NULL AND p_max_match IS NOT NULL THEN
        m.match_number >= p_min_match AND m.match_number <= p_max_match
      ELSE m.stage = 'GROUP_STAGE'
    END
  GROUP BY mp.user_id;
$$;
