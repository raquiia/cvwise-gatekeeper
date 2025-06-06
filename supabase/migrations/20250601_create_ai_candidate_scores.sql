
-- Create a table for storing AI-generated candidate scores (either general or job-specific)
CREATE TABLE IF NOT EXISTS public.ai_candidate_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  job_offer_id UUID REFERENCES public.job_offers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  explanation TEXT NOT NULL,
  breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create a unique constraint to ensure we have one score per candidate per job offer
-- When job_offer_id is NULL, it's the general profile completeness score
ALTER TABLE public.ai_candidate_scores 
ADD CONSTRAINT unique_candidate_job_score UNIQUE (candidate_id, job_offer_id);

-- Create indexes for efficient lookups
CREATE INDEX idx_ai_candidate_scores_candidate_id ON public.ai_candidate_scores(candidate_id);
CREATE INDEX idx_ai_candidate_scores_job_offer_id ON public.ai_candidate_scores(job_offer_id);
CREATE INDEX idx_ai_candidate_scores_user_id ON public.ai_candidate_scores(user_id);
CREATE INDEX idx_ai_candidate_scores_score ON public.ai_candidate_scores(score);

-- Add RLS (Row Level Security) so users can only see their own scores
ALTER TABLE public.ai_candidate_scores ENABLE ROW LEVEL SECURITY;

-- Create policy for selecting data
CREATE POLICY "Users can view their own ai_candidate_scores"
ON public.ai_candidate_scores
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy for inserting data
CREATE POLICY "Users can insert their own ai_candidate_scores"
ON public.ai_candidate_scores
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create policy for updating data
CREATE POLICY "Users can update their own ai_candidate_scores"
ON public.ai_candidate_scores
FOR UPDATE
USING (auth.uid() = user_id);

-- Create policy for deleting data
CREATE POLICY "Users can delete their own ai_candidate_scores"
ON public.ai_candidate_scores
FOR DELETE
USING (auth.uid() = user_id);

-- Create or update stored procedure to get candidate AI score
CREATE OR REPLACE FUNCTION public.get_ai_candidate_score(p_candidate_id UUID, p_job_offer_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  candidate_id UUID,
  job_offer_id UUID,
  user_id UUID,
  score INTEGER,
  explanation TEXT,
  breakdown JSONB,
  calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    acs.id,
    acs.candidate_id,
    acs.job_offer_id,
    acs.user_id,
    acs.score,
    acs.explanation,
    acs.breakdown,
    acs.calculated_at,
    acs.created_at,
    acs.updated_at
  FROM ai_candidate_scores acs
  WHERE acs.candidate_id = p_candidate_id
    AND acs.job_offer_id IS NOT DISTINCT FROM p_job_offer_id
    AND acs.user_id = auth.uid()
  ORDER BY acs.calculated_at DESC
  LIMIT 1;
END;
$$;

-- Create or update stored procedure to save candidate AI score
CREATE OR REPLACE FUNCTION public.save_ai_candidate_score(
  p_candidate_id UUID,
  p_score INTEGER,
  p_explanation TEXT,
  p_job_offer_id UUID DEFAULT NULL,
  p_breakdown JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  id UUID,
  candidate_id UUID,
  job_offer_id UUID,
  user_id UUID,
  score INTEGER,
  explanation TEXT,
  breakdown JSONB,
  calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Insert or update the score
  INSERT INTO ai_candidate_scores (
    candidate_id,
    job_offer_id,
    user_id,
    score,
    explanation,
    breakdown,
    calculated_at,
    updated_at
  ) VALUES (
    p_candidate_id,
    p_job_offer_id,
    v_user_id,
    p_score,
    p_explanation,
    p_breakdown,
    now(),
    now()
  )
  ON CONFLICT (candidate_id, job_offer_id) DO UPDATE SET
    score = p_score,
    explanation = p_explanation,
    breakdown = p_breakdown,
    calculated_at = now(),
    updated_at = now();
  
  -- Return the saved score
  RETURN QUERY
  SELECT 
    acs.id,
    acs.candidate_id,
    acs.job_offer_id,
    acs.user_id,
    acs.score,
    acs.explanation,
    acs.breakdown,
    acs.calculated_at,
    acs.created_at,
    acs.updated_at
  FROM ai_candidate_scores acs
  WHERE acs.candidate_id = p_candidate_id
    AND acs.job_offer_id IS NOT DISTINCT FROM p_job_offer_id
    AND acs.user_id = v_user_id;
END;
$$;

-- Create function to delete candidate AI score
CREATE OR REPLACE FUNCTION public.delete_ai_candidate_score(p_candidate_id UUID, p_job_offer_id UUID DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM ai_candidate_scores
  WHERE candidate_id = p_candidate_id
    AND job_offer_id IS NOT DISTINCT FROM p_job_offer_id
    AND user_id = auth.uid();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count > 0;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_ai_candidate_score TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_ai_candidate_score TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_ai_candidate_score TO authenticated;
