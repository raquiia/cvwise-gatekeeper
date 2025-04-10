
-- Supprimer les fonctions et politiques existantes problématiques
DROP FUNCTION IF EXISTS public.get_candidate_by_id_secure;
DROP FUNCTION IF EXISTS public.get_user_candidates_secure;

-- Créer une nouvelle fonction pour supprimer un candidat de manière sécurisée
CREATE OR REPLACE FUNCTION public.delete_candidate_secure(candidate_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_resume_id UUID;
  v_candidate_exists BOOLEAN;
BEGIN
  -- Vérifier que le candidat existe et appartient à l'utilisateur actuel
  SELECT 
    EXISTS(SELECT 1 FROM candidates WHERE id = candidate_id_param AND user_id = auth.uid()),
    (SELECT resume_id FROM candidates WHERE id = candidate_id_param)
  INTO v_candidate_exists, v_resume_id;
  
  IF NOT v_candidate_exists THEN
    RETURN false;
  END IF;
  
  -- Supprimer directement le candidat sans utiliser les politiques RLS
  DELETE FROM candidates WHERE id = candidate_id_param;
  
  RETURN true;
END;
$$;
