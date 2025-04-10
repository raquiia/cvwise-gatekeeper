
-- Create or replace the function to get all matches for a job offer with candidate details
-- This improved version ensures we properly return candidates and their match data
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
  
  -- Debug log
  RAISE LOG 'Fetching matches for job offer ID: %', p_job_offer_id;
  
  -- Get all the user's candidates (these are the ones we want to match against)
  RETURN QUERY
  WITH user_candidates AS (
    SELECT c.*
    FROM public.candidates c
    WHERE c.user_id = v_user_id
  ),
  -- Get existing matches
  existing_matches AS (
    SELECT m.*
    FROM public.candidate_job_matches m
    JOIN user_candidates c ON m.candidate_id = c.id
    WHERE m.job_offer_id = p_job_offer_id
  )
  SELECT jsonb_build_object(
    'candidate', row_to_json(c)::jsonb,
    'match', COALESCE(row_to_json(m)::jsonb, '{}'::jsonb)
  )
  FROM user_candidates c
  LEFT JOIN existing_matches m ON c.id = m.candidate_id;
  
  -- Log the completion
  RAISE LOG 'Completed fetching matches for job offer ID: %', p_job_offer_id;
END;
$$;

-- Ensure execution permission is granted
GRANT EXECUTE ON FUNCTION public.get_matches_for_job_offer(UUID) TO authenticated;
