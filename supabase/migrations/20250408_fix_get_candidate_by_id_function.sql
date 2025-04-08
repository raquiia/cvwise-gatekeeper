
-- First, drop the existing get_candidate_by_id function if it exists
DROP FUNCTION IF EXISTS public.get_candidate_by_id;

-- Create a version of the function that doesn't depend on RLS
CREATE OR REPLACE FUNCTION public.get_candidate_by_id_secure(candidate_id_param uuid)
RETURNS SETOF candidates
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.candidates WHERE id = candidate_id_param;
$$;

-- Create a policy to allow users to view candidates associated with their resumes
DROP POLICY IF EXISTS "Users can view candidates by id" ON public.candidates;
CREATE POLICY "Users can view candidates by id" 
ON public.candidates FOR SELECT 
USING (auth.uid() = user_id);
