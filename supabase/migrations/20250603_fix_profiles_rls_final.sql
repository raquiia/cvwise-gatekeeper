
-- Fix the infinite recursion in profiles RLS policies
-- Drop all existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON public.profiles;

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "profiles_select_own" 
ON public.profiles 
FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "profiles_update_own" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid());

CREATE POLICY "profiles_insert_own" 
ON public.profiles 
FOR INSERT 
WITH CHECK (id = auth.uid());

-- Add RLS policies for candidate_job_scores table
ALTER TABLE public.candidate_job_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "candidate_job_scores_select_own" 
ON public.candidate_job_scores 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.candidates c 
    WHERE c.id = candidate_job_scores.candidate_id 
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "candidate_job_scores_insert_own" 
ON public.candidate_job_scores 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.candidates c 
    WHERE c.id = candidate_job_scores.candidate_id 
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "candidate_job_scores_update_own" 
ON public.candidate_job_scores 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.candidates c 
    WHERE c.id = candidate_job_scores.candidate_id 
    AND c.user_id = auth.uid()
  )
);
