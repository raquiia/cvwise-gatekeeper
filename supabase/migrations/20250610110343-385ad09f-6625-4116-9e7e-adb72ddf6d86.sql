
-- Créer la fonction pour vérifier les doublons de CV
CREATE OR REPLACE FUNCTION public.check_duplicate_resume(p_file_name text, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM resumes
    WHERE
      user_id = p_user_id AND
      file_name = p_file_name
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$function$;

-- Créer la fonction pour insérer un CV de manière sécurisée
CREATE OR REPLACE FUNCTION public.insert_resume(p_user_id uuid, p_file_name text, p_file_path text, p_file_type text, p_file_size integer)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.resumes(
    user_id, 
    file_name, 
    file_path, 
    file_type, 
    file_size,
    parsed
  )
  VALUES (
    p_user_id,
    p_file_name,
    p_file_path,
    p_file_type,
    p_file_size,
    false
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$function$;
