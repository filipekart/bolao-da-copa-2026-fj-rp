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
  p.display_name
FROM public.leaderboard l
JOIN public.profiles p ON p.id = l.user_id
WHERE p.approved = true;