
-- Table for extra predictions (top scorer, MVP)
CREATE TABLE public.extra_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('top_scorer', 'mvp')),
  player_name TEXT NOT NULL,
  team_id UUID REFERENCES public.teams(id),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, category)
);

ALTER TABLE public.extra_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own extra predictions"
  ON public.extra_predictions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own extra predictions"
  ON public.extra_predictions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own extra predictions"
  ON public.extra_predictions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own extra predictions"
  ON public.extra_predictions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
