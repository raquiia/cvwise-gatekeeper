
-- Vérifier et corriger la fonction save_ai_candidate_score pour s'assurer qu'elle gère bien tous les nouveaux paramètres
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
  ON CONFLICT (candidate_id, job_offer_id) DO UPDATE SET
    score = EXCLUDED.score,
    explanation = EXCLUDED.explanation,
    breakdown = EXCLUDED.breakdown,
    strengths = EXCLUDED.strengths,
    weaknesses = EXCLUDED.weaknesses,
    recommendations = EXCLUDED.recommendations,
    calculated_at = now(),
    updated_at = now();
  
  -- Return the saved score with all fields
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

-- Vérifier que la table ai_candidate_scores a bien toutes les colonnes nécessaires
-- et ajouter un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_ai_candidate_scores_lookup 
ON ai_candidate_scores (candidate_id, job_offer_id, user_id);
