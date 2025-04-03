
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own candidates" ON public.candidates;
DROP POLICY IF EXISTS "Users can insert their own candidates" ON public.candidates;
DROP POLICY IF EXISTS "Users can update their own candidates" ON public.candidates;
DROP POLICY IF EXISTS "Users can delete their own candidates" ON public.candidates;

-- Make sure RLS is enabled
ALTER TABLE IF EXISTS public.candidates ENABLE ROW LEVEL SECURITY;

-- Add policies with correct definitions
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
