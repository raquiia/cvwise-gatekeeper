
-- Fix for infinite recursion issues in update_candidate_status function
CREATE OR REPLACE FUNCTION public.update_candidate_status(p_candidate_id uuid, p_detailed_status text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_candidate_exists BOOLEAN;
  v_user_id UUID;
BEGIN
  -- Récupérer l'ID de l'utilisateur courant
  v_user_id := auth.uid();
  
  -- Vérifier que le candidat existe et appartient à l'utilisateur actuel
  SELECT EXISTS(
    SELECT 1 FROM candidates c 
    WHERE c.id = p_candidate_id AND c.user_id = v_user_id
  ) INTO v_candidate_exists;
  
  IF NOT v_candidate_exists THEN
    RETURN FALSE;
  END IF;

  -- Mettre à jour le statut du candidat directement
  UPDATE candidates 
  SET 
    detailed_status = p_detailed_status,
    updated_at = now()
  WHERE id = p_candidate_id;
  
  RETURN TRUE;
END;
$$;

-- Fix for infinite recursion issues in get_candidate_status function
CREATE OR REPLACE FUNCTION public.get_candidate_status(p_candidate_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
  v_user_id UUID;
  v_candidate_exists BOOLEAN;
BEGIN
  -- Récupérer l'ID de l'utilisateur courant
  v_user_id := auth.uid();
  
  -- Vérifier que le candidat existe et appartient à l'utilisateur actuel
  SELECT EXISTS(
    SELECT 1 FROM candidates c 
    WHERE c.id = p_candidate_id AND c.user_id = v_user_id
  ) INTO v_candidate_exists;
  
  IF NOT v_candidate_exists THEN
    RETURN NULL;
  END IF;

  -- Récupérer le statut du candidat directement
  SELECT detailed_status INTO v_status
  FROM candidates
  WHERE id = p_candidate_id;
  
  RETURN v_status;
END;
$$;
