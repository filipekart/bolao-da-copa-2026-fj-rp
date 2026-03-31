
CREATE POLICY "authenticated can read champion predictions"
ON public.knockout_predictions FOR SELECT
TO authenticated
USING (stage = 'CHAMPION');
