-- Allow recruiters to update candidates in active recruitment processes
CREATE POLICY "Recruiters can update candidates in active processes" 
ON public.candidates 
FOR UPDATE 
USING (
  user_id = auth.uid() OR 
  (current_process_id IS NOT NULL AND 
   EXISTS (
     SELECT 1 FROM candidate_recruitment_processes crp 
     WHERE crp.id = current_process_id 
     AND crp.recruiter_id = auth.uid()
     AND crp.status != 'completed'
     AND crp.ended_at IS NULL
   ))
);

-- Create function to update candidate by recruiter with limited fields
CREATE OR REPLACE FUNCTION public.update_candidate_by_recruiter(
  p_candidate_id UUID,
  p_updates JSONB
) 
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_recruiter_id UUID;
  v_candidate_owner UUID;
  v_process_active BOOLEAN;
  v_result JSONB;
  v_allowed_fields TEXT[] := ARRAY[
    'email', 'phone', 'address', 'postal_code', 'city', 'country',
    'position', 'company', 'salary_expectations', 'availability',
    'mobility', 'contract_type', 'remote_preference'
  ];
  v_field TEXT;
  v_update_data JSONB := '{}'::JSONB;
BEGIN
  -- Get current user
  v_recruiter_id := auth.uid();
  
  IF v_recruiter_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Get candidate owner and check if recruiter has active process
  SELECT 
    c.user_id,
    EXISTS(
      SELECT 1 FROM candidate_recruitment_processes crp 
      WHERE crp.candidate_id = p_candidate_id 
      AND crp.recruiter_id = v_recruiter_id
      AND crp.status != 'completed'
      AND crp.ended_at IS NULL
      AND crp.id = c.current_process_id
    )
  INTO v_candidate_owner, v_process_active
  FROM candidates c
  WHERE c.id = p_candidate_id;

  -- Check permissions: either owner or recruiter with active process
  IF v_candidate_owner != v_recruiter_id AND NOT v_process_active THEN
    RAISE EXCEPTION 'Insufficient permissions to update this candidate';
  END IF;

  -- Filter updates to only allowed fields
  FOR v_field in SELECT jsonb_object_keys(p_updates)
  LOOP
    IF v_field = ANY(v_allowed_fields) THEN
      v_update_data := v_update_data || jsonb_build_object(v_field, p_updates->v_field);
    END IF;
  END LOOP;

  -- Add metadata
  v_update_data := v_update_data || jsonb_build_object(
    'updated_at', now(),
    'last_updated_at', now()
  );

  -- Perform the update
  UPDATE candidates
  SET 
    email = COALESCE(v_update_data->>'email', email),
    phone = COALESCE(v_update_data->>'phone', phone),
    address = COALESCE(v_update_data->>'address', address),
    postal_code = COALESCE(v_update_data->>'postal_code', postal_code),
    city = COALESCE(v_update_data->>'city', city),
    country = COALESCE(v_update_data->>'country', country),
    position = COALESCE(v_update_data->>'position', position),
    company = COALESCE(v_update_data->>'company', company),
    salary_expectations = COALESCE(v_update_data->>'salary_expectations', salary_expectations),
    availability = COALESCE(v_update_data->>'availability', availability),
    mobility = COALESCE(v_update_data->>'mobility', mobility),
    contract_type = COALESCE(v_update_data->>'contract_type', contract_type),
    remote_preference = COALESCE(v_update_data->>'remote_preference', remote_preference),
    updated_at = now(),
    last_updated_at = now()
  WHERE id = p_candidate_id
  RETURNING jsonb_build_object(
    'id', id,
    'updated_by_recruiter', CASE WHEN user_id != v_recruiter_id THEN true ELSE false END,
    'updated_fields', array(SELECT jsonb_object_keys(v_update_data))
  ) INTO v_result;

  RETURN v_result;
END;
$$;