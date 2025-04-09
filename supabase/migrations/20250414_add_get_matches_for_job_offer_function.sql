
-- Function to get all matches for a job offer with candidate details in a way that avoids recursion issues
CREATE OR REPLACE FUNCTION public.get_matches_for_job_offer(
  p_job_offer_id UUID
) RETURNS SETOF jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Check if the job offer belongs to the user
  IF NOT EXISTS (
    SELECT 1 FROM public.job_offers
    WHERE id = p_job_offer_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Job offer not found or not authorized';
  END IF;
  
  RETURN QUERY
  SELECT jsonb_build_object(
    'candidate', row_to_json(c)::jsonb,
    'match', row_to_json(m)::jsonb
  )
  FROM public.candidate_job_matches m
  JOIN public.candidates c ON m.candidate_id = c.id AND c.user_id = v_user_id
  WHERE m.job_offer_id = p_job_offer_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_matches_for_job_offer(UUID) TO authenticated;
