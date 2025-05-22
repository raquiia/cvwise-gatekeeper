
-- Fix for infinite recursion issues in update_candidate_status function
CREATE OR REPLACE FUNCTION public.update_candidate_status(p_candidate_id uuid, p_detailed_status text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_candidate_exists BOOLEAN;
BEGIN
  -- Using a simpler check to avoid recursion issues
  SELECT EXISTS(
    SELECT 1 FROM candidates c 
    WHERE c.id = p_candidate_id
  ) INTO v_candidate_exists;
  
  IF NOT v_candidate_exists THEN
    RETURN FALSE;
  END IF;

  -- Update the candidate status directly
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
  v_candidate_exists BOOLEAN;
BEGIN
  -- Using a simpler check to avoid recursion issues
  SELECT EXISTS(
    SELECT 1 FROM candidates c 
    WHERE c.id = p_candidate_id
  ) INTO v_candidate_exists;
  
  IF NOT v_candidate_exists THEN
    RETURN NULL;
  END IF;

  -- Get the candidate status directly
  SELECT detailed_status INTO v_status
  FROM candidates
  WHERE id = p_candidate_id;
  
  RETURN v_status;
END;
$$;
