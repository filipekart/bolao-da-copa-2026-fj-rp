-- Ensure the set_updated_at trigger is active on matches
-- so that m.updated_at changes whenever a score is edited,
-- enabling the existing scored_at filter in score_finished_matches()
CREATE TRIGGER set_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();