
-- Create both tables first
CREATE TABLE public.custom_rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.custom_ranking_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ranking_id uuid NOT NULL REFERENCES public.custom_rankings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ranking_id, user_id)
);

-- Enable RLS
ALTER TABLE public.custom_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_ranking_members ENABLE ROW LEVEL SECURITY;

-- Policies for custom_rankings
CREATE POLICY "owners crud own rankings" ON public.custom_rankings
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "members can view ranking" ON public.custom_rankings
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.custom_ranking_members
    WHERE custom_ranking_members.ranking_id = custom_rankings.id
      AND custom_ranking_members.user_id = auth.uid()
  ));

-- Policies for custom_ranking_members
CREATE POLICY "owners crud own ranking members" ON public.custom_ranking_members
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.custom_rankings
    WHERE custom_rankings.id = custom_ranking_members.ranking_id
      AND custom_rankings.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.custom_rankings
    WHERE custom_rankings.id = custom_ranking_members.ranking_id
      AND custom_rankings.owner_id = auth.uid()
  ));

CREATE POLICY "members can view own membership" ON public.custom_ranking_members
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
