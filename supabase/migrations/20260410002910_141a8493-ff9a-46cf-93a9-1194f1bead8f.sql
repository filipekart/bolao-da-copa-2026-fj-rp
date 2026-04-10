CREATE OR REPLACE FUNCTION public.is_match_open(p_match_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT now() < kickoff_at FROM public.matches WHERE id = p_match_id;
$$;

DROP POLICY "users insert own match predictions" ON public.match_predictions;
CREATE POLICY "users insert own match predictions" ON public.match_predictions
  FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id AND public.is_match_open(match_id));

DROP POLICY "users update own match predictions" ON public.match_predictions;
CREATE POLICY "users update own match predictions" ON public.match_predictions
  FOR UPDATE TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND public.is_match_open(match_id));