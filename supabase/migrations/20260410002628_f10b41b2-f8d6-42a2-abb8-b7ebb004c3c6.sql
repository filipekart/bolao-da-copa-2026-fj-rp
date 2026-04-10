CREATE OR REPLACE FUNCTION public.get_extras_completion()
RETURNS TABLE(user_id uuid, category text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT user_id, category
  FROM public.extra_predictions
  WHERE category IN ('top_scorer', 'mvp')

  UNION ALL

  SELECT user_id, 'champion'::text AS category
  FROM public.knockout_predictions
  WHERE stage = 'CHAMPION'
$$;