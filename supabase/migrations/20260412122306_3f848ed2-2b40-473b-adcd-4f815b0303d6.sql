DROP POLICY "users read predictions after kickoff" ON public.match_predictions;

CREATE POLICY "users read predictions after kickoff"
ON public.match_predictions FOR SELECT TO public
USING (
  auth.role() = 'authenticated'
  AND (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_predictions.match_id
      AND now() >= m.kickoff_at
    )
  )
);