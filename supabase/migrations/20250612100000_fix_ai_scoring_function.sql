
-- Fix the ambiguous column reference in save_ai_candidate_score function
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
  ON CONFLICT (candidate_id, COALESCE(job_offer_id, '00000000-0000-0000-0000-000000000000'::uuid)) 
  DO UPDATE SET
    score = EXCLUDED.score,
    explanation = EXCLUDED.explanation,
    breakdown = EXCLUDED.breakdown,
    strengths = EXCLUDED.strengths,
    weaknesses = EXCLUDED.weaknesses,
    recommendations = EXCLUDED.recommendations,
    calculated_at = now(),
    updated_at = now();
  
  -- Return the saved score with all fields using explicit table alias
  RETURN QUERY
  SELECT 
    acs.id,
    acs.candidate_id,
    acs.job_offer_id,
    acs.user_id,
    acs.score,
    acs.explanation,
    acs.breakdown,
    acs.strengths,
    acs.weaknesses,
    acs.recommendations,
    acs.calculated_at,
    acs.created_at,
    acs.updated_at
  FROM ai_candidate_scores acs
  WHERE acs.candidate_id = p_candidate_id
    AND acs.job_offer_id IS NOT DISTINCT FROM p_job_offer_id
    AND acs.user_id = v_user_id;
    
  RAISE LOG 'AI score saved successfully for candidate %', p_candidate_id;
END;
$$;

-- Also ensure the unique constraint handles NULL job_offer_id properly
DROP INDEX IF EXISTS idx_ai_candidate_scores_unique;
CREATE UNIQUE INDEX idx_ai_candidate_scores_unique 
ON ai_candidate_scores (candidate_id, COALESCE(job_offer_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Add a debug function to check what's in the table
CREATE OR REPLACE FUNCTION public.debug_ai_candidate_scores(p_candidate_id UUID)
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
  calculated_at TIMESTAMPTZ
) LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE LOG 'Debug: Looking for AI scores for candidate %', p_candidate_id;
  
  RETURN QUERY
  SELECT 
    acs.id,
    acs.candidate_id,
    acs.job_offer_id,
    acs.user_id,
    acs.score,
    acs.explanation,
    acs.breakdown,
    acs.strengths,
    acs.weaknesses,
    acs.recommendations,
    acs.calculated_at
  FROM ai_candidate_scores acs
  WHERE acs.candidate_id = p_candidate_id;
  
  RAISE LOG 'Debug: Found % rows for candidate %', 
    (SELECT COUNT(*) FROM ai_candidate_scores WHERE candidate_id = p_candidate_id),
    p_candidate_id;
END;
$$;
