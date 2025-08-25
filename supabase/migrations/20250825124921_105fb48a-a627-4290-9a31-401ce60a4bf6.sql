-- Update the update_candidate_status function to use new status values
CREATE OR REPLACE FUNCTION public.update_candidate_status(p_candidate_id uuid, p_detailed_status text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  
  -- Validate the status value with new pipeline steps
  IF NOT p_detailed_status = ANY(ARRAY[
    'prise_contact', 'ps', 'ci1', 'ci2', 'ci3', 'pipeline',
    'formal_offer', 'contingent_offer', 'offer_declined', 
    'offer_accepted', 'contract_signed', 'hired'
  ]) THEN
    RAISE EXCEPTION 'Invalid status value: %', p_detailed_status;
  END IF;

  -- Update the candidate status directly
  UPDATE candidates 
  SET 
    detailed_status = p_detailed_status,
    updated_at = now()
  WHERE id = p_candidate_id AND user_id = v_user_id;
  
  RETURN TRUE;
END;
$function$;