DROP POLICY IF EXISTS "members can view own membership" ON public.custom_ranking_members;

CREATE POLICY "members can view ranking members"
ON public.custom_ranking_members
FOR SELECT
TO authenticated
USING (
  public.is_ranking_owner(ranking_id, auth.uid())
  OR public.is_ranking_member(ranking_id, auth.uid())
);