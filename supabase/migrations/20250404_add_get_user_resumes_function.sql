
-- Create function to get user resumes without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_resumes(user_id_param UUID)
RETURNS SETOF JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT jsonb_build_object(
    'id', r.id,
    'user_id', r.user_id,
    'file_name', r.file_name,
    'file_path', r.file_path,
    'file_type', r.file_type,
    'file_size', r.file_size,
    'parsed', r.parsed,
    'created_at', r.created_at,
    'updated_at', r.updated_at,
    'candidates', (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', c.id,
            'resume_id', c.resume_id,
            'user_id', c.user_id,
            'first_name', c.first_name,
            'last_name', c.last_name,
            'email', c.email,
            'phone', c.phone,
            'position', c.position,
            'years_experience', c.years_experience,
            'location', c.location,
            'skills', c.skills,
            'score', c.score,
            'status', c.status
          )
        ),
        '[]'::jsonb
      )
      FROM candidates c
      WHERE c.resume_id = r.id
    )
  )
  FROM resumes r
  WHERE r.user_id = user_id_param
  ORDER BY r.created_at DESC;
END;
$$;

-- Create Row Level Security policies for resumes table
ALTER TABLE IF EXISTS public.resumes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can insert their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can update their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can delete their own resumes" ON public.resumes;

-- Add new policies
CREATE POLICY "Users can view their own resumes" 
ON public.resumes FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own resumes" 
ON public.resumes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resumes" 
ON public.resumes FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resumes" 
ON public.resumes FOR DELETE 
USING (auth.uid() = user_id);
