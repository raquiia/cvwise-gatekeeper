
-- Fix get_user_candidates function to include detailed_status
CREATE OR REPLACE FUNCTION public.get_user_candidates(user_id_param uuid)
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
  skills jsonb, 
  score integer, 
  status text, 
  detailed_status text,
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
  last_updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
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
    c.skills,
    c.score,
    c.status,
    c.detailed_status,
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
    c.last_updated_at
  FROM candidates c
  WHERE c.user_id = user_id_param
  ORDER BY c.created_at DESC;
END;
$function$
