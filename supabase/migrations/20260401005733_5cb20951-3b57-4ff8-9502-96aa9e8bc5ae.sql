
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "profiles are readable by authenticated users" ON public.profiles;

-- Users can read their own profile (including pix_key)
CREATE POLICY "users read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Admins can read all profiles (including pix_key)
CREATE POLICY "admins can read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create a public view without pix_key for leaderboard/ranking needs
CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT id, display_name, approved
  FROM public.profiles;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;
