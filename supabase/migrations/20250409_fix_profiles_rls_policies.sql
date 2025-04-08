
-- Drop existing policies for profiles table
DROP POLICY IF EXISTS "Users can view their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;

-- Make sure RLS is enabled for profiles
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- Create a secure policy for viewing profiles
CREATE POLICY "Users can view their own profiles" 
ON public.profiles FOR SELECT 
USING (id = auth.uid());

-- Create a secure policy for updating profiles
CREATE POLICY "Users can update their own profiles" 
ON public.profiles FOR UPDATE 
USING (id = auth.uid());

-- Create a secure function to get a profile that avoids recursion
CREATE OR REPLACE FUNCTION public.get_profile_by_id_secure(profile_id_param UUID)
RETURNS SETOF profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles WHERE id = profile_id_param;
$$;
