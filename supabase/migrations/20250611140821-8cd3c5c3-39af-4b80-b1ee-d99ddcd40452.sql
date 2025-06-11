
-- Fix ambiguous column reference in save_ai_candidate_score function
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
  
  -- Insert or update the score with explicit table aliases to avoid ambiguity
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
    score = EXCLUDED.score,
    explanation = EXCLUDED.explanation,
    breakdown = EXCLUDED.breakdown,
    calculated_at = now(),
    updated_at = now();
  
  -- Return the saved score with explicit table alias
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
