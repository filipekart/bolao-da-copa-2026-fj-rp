CREATE OR REPLACE FUNCTION public.is_tournament_open()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT now() < MIN(kickoff_at) FROM public.matches;
$$;

-- extra_predictions: INSERT
DROP POLICY "Users can insert own extra predictions" ON public.extra_predictions;
CREATE POLICY "Users can insert own extra predictions" ON public.extra_predictions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_tournament_open());

-- extra_predictions: UPDATE
DROP POLICY "Users can update own extra predictions" ON public.extra_predictions;
CREATE POLICY "Users can update own extra predictions" ON public.extra_predictions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND public.is_tournament_open());

-- knockout_predictions: INSERT
DROP POLICY "users insert own knockout predictions" ON public.knockout_predictions;
CREATE POLICY "users insert own knockout predictions" ON public.knockout_predictions
  FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id AND public.is_tournament_open());