
CREATE POLICY "admins can delete profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins can delete match_predictions"
ON public.match_predictions FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins can delete leaderboard"
ON public.leaderboard FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins can delete knockout_predictions"
ON public.knockout_predictions FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
