
-- Create function to get user candidates without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_candidates(user_id_param UUID)
RETURNS SETOF jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT jsonb_build_object(
    'id', c.id,
    'user_id', c.user_id,
    'resume_id', c.resume_id,
    'first_name', c.first_name,
    'last_name', c.last_name,
    'email', c.email,
    'phone', c.phone,
    'position', c.position,
    'years_experience', c.years_experience,
    'location', c.location,
    'skills', c.skills,
    'score', c.score,
    'status', c.status,
    'created_at', c.created_at,
    'updated_at', c.updated_at
  )
  FROM candidates c
  WHERE c.user_id = user_id_param
  ORDER BY c.created_at DESC;
END;
$$;

-- Create Row Level Security policies for candidates table if they don't exist
ALTER TABLE IF EXISTS public.candidates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own candidates" ON public.candidates;
DROP POLICY IF EXISTS "Users can insert their own candidates" ON public.candidates;
DROP POLICY IF EXISTS "Users can update their own candidates" ON public.candidates;
DROP POLICY IF EXISTS "Users can delete their own candidates" ON public.candidates;

-- Add new policies
CREATE POLICY "Users can view their own candidates" 
ON public.candidates FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own candidates" 
ON public.candidates FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own candidates" 
ON public.candidates FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own candidates" 
ON public.candidates FOR DELETE 
USING (auth.uid() = user_id);
