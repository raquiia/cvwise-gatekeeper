
-- Final fix for the ambiguous column reference in save_ai_candidate_score function
DROP FUNCTION IF EXISTS public.save_ai_candidate_score(UUID, INTEGER, TEXT, UUID, JSONB, JSONB, JSONB, JSONB);

CREATE OR REPLACE FUNCTION public.save_ai_candidate_score(
  p_candidate_id UUID,
  p_score INTEGER,
  p_explanation TEXT,
  p_job_offer_id UUID DEFAULT NULL,
  p_breakdown JSONB DEFAULT '{}'::jsonb,
  p_strengths JSONB DEFAULT '[]'::jsonb,
  p_weaknesses JSONB DEFAULT '[]'::jsonb,
  p_recommendations JSONB DEFAULT '[]'::jsonb
)
RETURNS TABLE (
  id UUID,
  candidate_id UUID,
  job_offer_id UUID,
  user_id UUID,
  score INTEGER,
  explanation TEXT,
  breakdown JSONB,
  strengths JSONB,
  weaknesses JSONB,
  recommendations JSONB,
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
  
  -- Log pour debug
  RAISE LOG 'Saving AI score: candidate_id=%, score=%, strengths_count=%, weaknesses_count=%, recommendations_count=%', 
    p_candidate_id, p_score, 
    jsonb_array_length(p_strengths), 
    jsonb_array_length(p_weaknesses), 
    jsonb_array_length(p_recommendations);
  
  -- Insert or update the score with comprehensive analysis
  -- Use COALESCE to handle NULL job_offer_id properly in the conflict clause
  INSERT INTO ai_candidate_scores (
    candidate_id,
    job_offer_id,
    user_id,
    score,
    explanation,
    breakdown,
    strengths,
    weaknesses,
    recommendations,
    calculated_at,
    updated_at
  ) VALUES (
    p_candidate_id,
    p_job_offer_id,
    v_user_id,
    p_score,
    p_explanation,
    p_breakdown,
    p_strengths,
    p_weaknesses,
    p_recommendations,
    now(),
    now()
  )
  ON CONFLICT (candidate_id, COALESCE(job_offer_id, '00000000-0000-0000-0000-000000000000'::uuid), user_id) 
  DO UPDATE SET
    score = EXCLUDED.score,
    explanation = EXCLUDED.explanation,
    breakdown = EXCLUDED.breakdown,
    strengths = EXCLUDED.strengths,
    weaknesses = EXCLUDED.weaknesses,
    recommendations = EXCLUDED.recommendations,
    calculated_at = now(),
    updated_at = now();
  
  -- Return the saved score with explicit table alias to avoid ambiguity
  RETURN QUERY
  SELECT 
    ai_scores.id,
    ai_scores.candidate_id,
    ai_scores.job_offer_id,
    ai_scores.user_id,
    ai_scores.score,
    ai_scores.explanation,
    ai_scores.breakdown,
    ai_scores.strengths,
    ai_scores.weaknesses,
    ai_scores.recommendations,
    ai_scores.calculated_at,
    ai_scores.created_at,
    ai_scores.updated_at
  FROM ai_candidate_scores ai_scores
  WHERE ai_scores.candidate_id = p_candidate_id
    AND ai_scores.job_offer_id IS NOT DISTINCT FROM p_job_offer_id
    AND ai_scores.user_id = v_user_id
  ORDER BY ai_scores.calculated_at DESC
  LIMIT 1;
    
  RAISE LOG 'AI score saved successfully for candidate %', p_candidate_id;
END;
$$;

-- Update the unique constraint to include user_id
DROP INDEX IF EXISTS idx_ai_candidate_scores_unique;
CREATE UNIQUE INDEX idx_ai_candidate_scores_unique 
ON ai_candidate_scores (candidate_id, COALESCE(job_offer_id, '00000000-0000-0000-0000-000000000000'::uuid), user_id);

-- Also fix the get function to avoid ambiguity
DROP FUNCTION IF EXISTS public.get_ai_candidate_score(UUID, UUID);

CREATE OR REPLACE FUNCTION public.get_ai_candidate_score(
  p_candidate_id UUID, 
  p_job_offer_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  candidate_id UUID,
  job_offer_id UUID,
  user_id UUID,
  score INTEGER,
  explanation TEXT,
  breakdown JSONB,
  strengths JSONB,
  weaknesses JSONB,
  recommendations JSONB,
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
    ai_scores.id,
    ai_scores.candidate_id,
    ai_scores.job_offer_id,
    ai_scores.user_id,
    ai_scores.score,
    ai_scores.explanation,
    ai_scores.breakdown,
    ai_scores.strengths,
    ai_scores.weaknesses,
    ai_scores.recommendations,
    ai_scores.calculated_at,
    ai_scores.created_at,
    ai_scores.updated_at
  FROM ai_candidate_scores ai_scores
  WHERE ai_scores.candidate_id = p_candidate_id
    AND ai_scores.job_offer_id IS NOT DISTINCT FROM p_job_offer_id
    AND ai_scores.user_id = auth.uid()
  ORDER BY ai_scores.calculated_at DESC
  LIMIT 1;
END;
$$;
