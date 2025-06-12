
-- Créer une nouvelle fonction pour sauvegarder les données AI directement dans candidates
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
RETURNS TABLE(
  id UUID,
  ai_score INTEGER,
  ai_explanation TEXT,
  ai_breakdown JSONB,
  ai_strengths JSONB,
  ai_weaknesses JSONB,
  ai_recommendations JSONB,
  ai_analyzed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Vérifier que le candidat appartient à l'utilisateur
  IF NOT EXISTS (
    SELECT 1 FROM candidates c
    WHERE c.id = p_candidate_id AND c.user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Candidate not found or access denied';
  END IF;
  
  -- Log pour debug
  RAISE LOG 'Saving AI score in candidates table: candidate_id=%, score=%, strengths_count=%, weaknesses_count=%, recommendations_count=%', 
    p_candidate_id, p_score, 
    jsonb_array_length(p_strengths), 
    jsonb_array_length(p_weaknesses), 
    jsonb_array_length(p_recommendations);
  
  -- Mettre à jour directement dans la table candidates
  UPDATE candidates SET
    ai_score = p_score,
    ai_explanation = p_explanation,
    ai_breakdown = p_breakdown,
    ai_strengths = p_strengths,
    ai_weaknesses = p_weaknesses,
    ai_recommendations = p_recommendations,
    ai_analyzed_at = now(),
    updated_at = now()
  WHERE id = p_candidate_id AND user_id = v_user_id;
  
  -- Retourner les données sauvegardées
  RETURN QUERY
  SELECT 
    c.id,
    c.ai_score,
    c.ai_explanation,
    c.ai_breakdown,
    c.ai_strengths,
    c.ai_weaknesses,
    c.ai_recommendations,
    c.ai_analyzed_at
  FROM candidates c
  WHERE c.id = p_candidate_id AND c.user_id = v_user_id;
    
  RAISE LOG 'AI score saved successfully in candidates table for candidate %', p_candidate_id;
END;
$function$
