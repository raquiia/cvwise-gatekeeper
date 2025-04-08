
-- Drop any existing policy on profiles that might cause recursion
DROP POLICY IF EXISTS "Users can view profiles by id" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a secure function to get a profile by ID
CREATE OR REPLACE FUNCTION public.get_profile_by_id_secure(profile_id_param uuid)
RETURNS SETOF profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles WHERE id = profile_id_param;
$$;

-- Make sure RLS is enabled on profiles
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- Add a simple policy that allows users to view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Create policies for other operations
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);
