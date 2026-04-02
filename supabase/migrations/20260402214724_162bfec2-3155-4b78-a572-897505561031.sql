CREATE POLICY "admins can read all match_predictions"
  ON public.match_predictions
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));