
-- Drop the view, use a function instead
DROP VIEW IF EXISTS public.public_profiles;

-- Create a security definer function to return public profile data
CREATE OR REPLACE FUNCTION public.get_public_profiles()
RETURNS TABLE(id uuid, display_name text, approved boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, display_name, approved FROM public.profiles;
$$;
