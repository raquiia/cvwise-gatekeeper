
-- Mettre à jour la fonction RPC pour inclure les nouvelles colonnes AI
CREATE OR REPLACE FUNCTION public.get_candidate_by_id_bypassing_rls(candidate_id_param uuid)
 RETURNS TABLE(
   id uuid, 
   user_id uuid, 
   resume_id uuid, 
   first_name text, 
   last_name text, 
   email text, 
   phone text, 
   "position" text, 
   years_experience integer, 
   location text, 
   address text, 
   postal_code text, 
   city text, 
   country text, 
   skills jsonb, 
   score integer, 
   status text, 
   company text, 
   created_at timestamp with time zone, 
   updated_at timestamp with time zone, 
   experiences jsonb, 
   education jsonb, 
   certifications jsonb, 
   languages jsonb, 
   publications jsonb, 
   interests text, 
   professional_references jsonb, 
   availability text, 
   salary_expectations text, 
   mobility text, 
   contract_type text, 
   remote_preference text, 
   travel_willingness text, 
   professional_networks jsonb, 
   continuous_training jsonb, 
   career_objectives text, 
   professional_values text, 
   work_authorization text, 
   special_permits jsonb, 
   industries jsonb, 
   projects jsonb, 
   profile_completeness integer, 
   last_updated_at timestamp with time zone,
   -- Nouvelles colonnes AI
   ai_score integer,
   ai_explanation text,
   ai_breakdown jsonb,
   ai_strengths jsonb,
   ai_weaknesses jsonb,
   ai_recommendations jsonb,
   ai_analyzed_at timestamp with time zone
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- First verify that the candidate belongs to the current user
  -- to maintain security while bypassing RLS
  IF NOT EXISTS (
    SELECT 1 FROM candidates c
    WHERE c.id = candidate_id_param 
    AND c.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied or candidate not found';
  END IF;

  -- If authorized, return the candidate data with ALL fields including AI fields
  RETURN QUERY
  SELECT 
    c.id,
    c.user_id,
    c.resume_id,
    c.first_name,
    c.last_name,
    c.email,
    c.phone,
    c."position",
    c.years_experience,
    c.location,
    c.address,
    c.postal_code,
    c.city,
    c.country,
    c.skills,
    c.score,
    c.status,
    c.company,
    c.created_at,
    c.updated_at,
    c.experiences,
    c.education,
    c.certifications,
    c.languages,
    c.publications,
    c.interests,
    c.professional_references,
    c.availability,
    c.salary_expectations,
    c.mobility,
    c.contract_type,
    c.remote_preference,
    c.travel_willingness,
    c.professional_networks,
    c.continuous_training,
    c.career_objectives,
    c.professional_values,
    c.work_authorization,
    c.special_permits,
    c.industries,
    c.projects,
    c.profile_completeness,
    c.last_updated_at,
    -- Nouvelles colonnes AI
    c.ai_score,
    c.ai_explanation,
    c.ai_breakdown,
    c.ai_strengths,
    c.ai_weaknesses,
    c.ai_recommendations,
    c.ai_analyzed_at
  FROM candidates c
  WHERE c.id = candidate_id_param;
END;
$function$
