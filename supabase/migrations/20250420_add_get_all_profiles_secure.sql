
-- Function to get all profiles securely without recursion
CREATE OR REPLACE FUNCTION public.get_all_profiles_secure()
RETURNS SETOF profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT * FROM public.profiles;
$$;
