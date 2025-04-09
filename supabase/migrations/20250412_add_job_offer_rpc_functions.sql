
-- Function to create a job offer
CREATE OR REPLACE FUNCTION public.create_job_offer(
  p_job_offer jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_job_offer_id UUID;
  v_result jsonb;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Insert the job offer
  INSERT INTO public.job_offers (
    user_id,
    title,
    company,
    location,
    description,
    contract_type,
    remote_preference,
    experience_years_min,
    experience_years_max,
    education_level,
    required_degrees,
    required_schools,
    required_skills,
    preferred_skills,
    industry_sectors,
    preferred_companies,
    required_languages,
    mobility,
    salary_min,
    salary_max,
    salary_currency,
    benefits,
    status
  )
  VALUES (
    v_user_id,
    p_job_offer->>'title',
    p_job_offer->>'company',
    p_job_offer->>'location',
    p_job_offer->>'description',
    p_job_offer->>'contract_type',
    p_job_offer->>'remote_preference',
    (p_job_offer->>'experience_years_min')::integer,
    (p_job_offer->>'experience_years_max')::integer,
    p_job_offer->>'education_level',
    (p_job_offer->'required_degrees')::text[],
    (p_job_offer->'required_schools')::text[],
    COALESCE(p_job_offer->'required_skills', '[]'::jsonb),
    COALESCE(p_job_offer->'preferred_skills', '[]'::jsonb),
    (p_job_offer->'industry_sectors')::text[],
    (p_job_offer->'preferred_companies')::text[],
    COALESCE(p_job_offer->'required_languages', '[]'::jsonb),
    p_job_offer->>'mobility',
    (p_job_offer->>'salary_min')::integer,
    (p_job_offer->>'salary_max')::integer,
    COALESCE(p_job_offer->>'salary_currency', 'EUR'),
    (p_job_offer->'benefits')::text[],
    COALESCE(p_job_offer->>'status', 'active')
  )
  RETURNING id INTO v_job_offer_id;
  
  -- Get the complete job offer
  SELECT row_to_json(jo)::jsonb INTO v_result
  FROM public.job_offers jo
  WHERE jo.id = v_job_offer_id;
  
  RETURN v_result;
END;
$$;

-- Function to update a job offer
CREATE OR REPLACE FUNCTION public.update_job_offer(
  p_job_offer_id UUID,
  p_updates jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_result jsonb;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Check if the job offer exists and belongs to the user
  IF NOT EXISTS (
    SELECT 1 FROM public.job_offers
    WHERE id = p_job_offer_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Job offer not found or not authorized';
  END IF;
  
  -- Update the job offer with dynamic fields from p_updates
  UPDATE public.job_offers
  SET
    title = COALESCE(p_updates->>'title', title),
    company = COALESCE(p_updates->>'company', company),
    location = COALESCE(p_updates->>'location', location),
    description = COALESCE(p_updates->>'description', description),
    contract_type = COALESCE(p_updates->>'contract_type', contract_type),
    remote_preference = COALESCE(p_updates->>'remote_preference', remote_preference),
    experience_years_min = COALESCE((p_updates->>'experience_years_min')::integer, experience_years_min),
    experience_years_max = COALESCE((p_updates->>'experience_years_max')::integer, experience_years_max),
    education_level = COALESCE(p_updates->>'education_level', education_level),
    required_degrees = COALESCE((p_updates->'required_degrees')::text[], required_degrees),
    required_schools = COALESCE((p_updates->'required_schools')::text[], required_schools),
    required_skills = COALESCE(p_updates->'required_skills', required_skills),
    preferred_skills = COALESCE(p_updates->'preferred_skills', preferred_skills),
    industry_sectors = COALESCE((p_updates->'industry_sectors')::text[], industry_sectors),
    preferred_companies = COALESCE((p_updates->'preferred_companies')::text[], preferred_companies),
    required_languages = COALESCE(p_updates->'required_languages', required_languages),
    mobility = COALESCE(p_updates->>'mobility', mobility),
    salary_min = COALESCE((p_updates->>'salary_min')::integer, salary_min),
    salary_max = COALESCE((p_updates->>'salary_max')::integer, salary_max),
    salary_currency = COALESCE(p_updates->>'salary_currency', salary_currency),
    benefits = COALESCE((p_updates->'benefits')::text[], benefits),
    status = COALESCE(p_updates->>'status', status),
    updated_at = now()
  WHERE id = p_job_offer_id;
  
  -- Get the updated job offer
  SELECT row_to_json(jo)::jsonb INTO v_result
  FROM public.job_offers jo
  WHERE jo.id = p_job_offer_id;
  
  RETURN v_result;
END;
$$;

-- Function to delete a job offer
CREATE OR REPLACE FUNCTION public.delete_job_offer(
  p_job_offer_id UUID
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Check if the job offer exists and belongs to the user
  IF NOT EXISTS (
    SELECT 1 FROM public.job_offers
    WHERE id = p_job_offer_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Job offer not found or not authorized';
  END IF;
  
  -- Delete the job offer (matches will be deleted automatically due to ON DELETE CASCADE)
  DELETE FROM public.job_offers
  WHERE id = p_job_offer_id;
  
  RETURN true;
END;
$$;

-- Function to get all job offers for the current user
CREATE OR REPLACE FUNCTION public.get_user_job_offers()
RETURNS SETOF jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  RETURN QUERY
  SELECT row_to_json(jo)::jsonb
  FROM public.job_offers jo
  WHERE jo.user_id = v_user_id
  ORDER BY jo.created_at DESC;
END;
$$;

-- Function to get a job offer by ID
CREATE OR REPLACE FUNCTION public.get_job_offer_by_id(
  p_job_offer_id UUID
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_result jsonb;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Get the job offer
  SELECT row_to_json(jo)::jsonb INTO v_result
  FROM public.job_offers jo
  WHERE jo.id = p_job_offer_id AND jo.user_id = v_user_id;
  
  RETURN v_result;
END;
$$;

-- Function to get a candidate-job match
CREATE OR REPLACE FUNCTION public.get_candidate_job_match(
  p_candidate_id UUID,
  p_job_offer_id UUID
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_result jsonb;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Check if the candidate belongs to the user
  IF NOT EXISTS (
    SELECT 1 FROM public.candidates
    WHERE id = p_candidate_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Candidate not found or not authorized';
  END IF;
  
  -- Check if the job offer belongs to the user
  IF NOT EXISTS (
    SELECT 1 FROM public.job_offers
    WHERE id = p_job_offer_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Job offer not found or not authorized';
  END IF;
  
  -- Get the match
  SELECT row_to_json(m)::jsonb INTO v_result
  FROM public.candidate_job_matches m
  WHERE m.candidate_id = p_candidate_id AND m.job_offer_id = p_job_offer_id;
  
  RETURN v_result;
END;
$$;

-- Function to get all matches for a job offer with candidate details
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
  JOIN public.candidates c ON m.candidate_id = c.id
  WHERE m.job_offer_id = p_job_offer_id
  ORDER BY m.match_score DESC;
END;
$$;
