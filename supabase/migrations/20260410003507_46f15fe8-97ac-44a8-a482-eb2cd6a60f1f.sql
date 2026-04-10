CREATE OR REPLACE FUNCTION public.is_knockout_stage_open(p_stage knockout_stage)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN p_stage = 'CHAMPION' THEN
      now() < (SELECT MIN(kickoff_at) FROM public.matches)
    ELSE
      now() < COALESCE(
        (SELECT MIN(kickoff_at) FROM public.matches WHERE stage = p_stage::text::match_stage),
        'infinity'::timestamptz
      )
  END;
$$;

DROP POLICY "users insert own knockout predictions" ON public.knockout_predictions;
CREATE POLICY "users insert own knockout predictions" ON public.knockout_predictions
  FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id AND public.is_knockout_stage_open(stage));