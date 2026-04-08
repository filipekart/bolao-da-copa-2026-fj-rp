
-- Drop the recursive policies
DROP POLICY IF EXISTS "members can view ranking" ON public.custom_rankings;
DROP POLICY IF EXISTS "members can view own membership" ON public.custom_ranking_members;

-- Create a SECURITY DEFINER function to check ranking ownership without triggering RLS
CREATE OR REPLACE FUNCTION public.is_ranking_owner(_ranking_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.custom_rankings
    WHERE id = _ranking_id AND owner_id = _user_id
  )
$$;

-- Create a SECURITY DEFINER function to check ranking membership without triggering RLS
CREATE OR REPLACE FUNCTION public.is_ranking_member(_ranking_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.custom_ranking_members
    WHERE ranking_id = _ranking_id AND user_id = _user_id
  )
$$;

-- Re-create the member view policy on custom_rankings using the SECURITY DEFINER function
CREATE POLICY "members can view ranking"
ON public.custom_rankings
FOR SELECT
TO authenticated
USING (public.is_ranking_member(id, auth.uid()));

-- Re-create the member view policy on custom_ranking_members using the SECURITY DEFINER function
CREATE POLICY "members can view own membership"
ON public.custom_ranking_members
FOR SELECT
TO authenticated
USING (public.is_ranking_owner(ranking_id, auth.uid()) OR user_id = auth.uid());
