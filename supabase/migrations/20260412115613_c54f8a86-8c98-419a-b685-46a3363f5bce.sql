DROP POLICY "users read own match predictions" ON public.match_predictions;

CREATE POLICY "users read predictions after kickoff"
ON public.match_predictions FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
      AND now() >= m.kickoff_at
      AND now() <= m.kickoff_at + interval '5 hours'
    )
  )
);