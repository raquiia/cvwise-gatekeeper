
-- Create a secure function to get a candidate by ID without RLS recursion issues
CREATE OR REPLACE FUNCTION public.get_candidate_by_id_secure(candidate_id_param uuid)
RETURNS SETOF candidates
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.candidates WHERE id = candidate_id_param;
$$;

-- Create a policy to allow users to view candidates through the secure function
DROP POLICY IF EXISTS "Users can view candidates by id via secure function" ON public.candidates;
CREATE POLICY "Users can view candidates by id via secure function" 
ON public.candidates FOR SELECT 
USING (auth.uid() = user_id);
