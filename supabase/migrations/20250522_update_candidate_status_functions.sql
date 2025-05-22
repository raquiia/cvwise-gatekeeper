
-- Fix for infinite recursion issues in update_candidate_status function
-- and add proper validation for status values
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
  -- Get the current user ID
  v_user_id := auth.uid();
  
  -- Check that the candidate exists and belongs to the current user
  SELECT EXISTS(
    SELECT 1 FROM candidates c 
    WHERE c.id = p_candidate_id AND c.user_id = v_user_id
  ) INTO v_candidate_exists;
  
  IF NOT v_candidate_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Validate the status value
  IF NOT p_detailed_status = ANY(ARRAY['initial', 'contact', 'prequalification', 'ec1', 'ec2', 'presentation_client', 'en_mission', 'refus', 'ancien_employe']) THEN
    RAISE EXCEPTION 'Invalid status value: %', p_detailed_status;
  END IF;

  -- Update the candidate status directly, explicitly bypassing RLS policies
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
  -- Get the current user ID
  v_user_id := auth.uid();
  
  -- Check that the candidate exists and belongs to the current user
  SELECT EXISTS(
    SELECT 1 FROM candidates c 
    WHERE c.id = p_candidate_id AND c.user_id = v_user_id
  ) INTO v_candidate_exists;
  
  IF NOT v_candidate_exists THEN
    RETURN NULL;
  END IF;

  -- Get the candidate status directly, bypassing RLS policies
  SELECT detailed_status INTO v_status
  FROM candidates
  WHERE id = p_candidate_id;
  
  RETURN v_status;
END;
$$;

-- Remove the check constraint if it exists and add a new proper one
DO $$
BEGIN
  -- Drop the constraint if it exists
  BEGIN
    ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_detailed_status_check;
  EXCEPTION
    WHEN undefined_object THEN
      NULL;  -- Do nothing if constraint doesn't exist
  END;

  -- Add a new constraint with proper values
  ALTER TABLE candidates ADD CONSTRAINT candidates_detailed_status_check 
    CHECK (detailed_status IS NULL OR detailed_status IN ('initial', 'contact', 'prequalification', 'ec1', 'ec2', 'presentation_client', 'en_mission', 'refus', 'ancien_employe'));
END$$;
