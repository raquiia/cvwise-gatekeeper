
-- Modify function to get user candidates to make sure it works properly with all fields
CREATE OR REPLACE FUNCTION public.get_user_candidates(user_id_param UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  resume_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  position TEXT,
  years_experience INTEGER,
  location TEXT,
  skills JSONB,
  score INTEGER,
  status TEXT,
  company TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  experiences JSONB,
  education JSONB,
  certifications JSONB,
  languages JSONB,
  publications JSONB, 
  interests TEXT,
  professional_references JSONB,
  availability TEXT,
  salary_expectations TEXT,
  mobility TEXT,
  contract_type TEXT,
  remote_preference TEXT,
  travel_willingness TEXT,
  professional_networks JSONB,
  continuous_training JSONB,
  career_objectives TEXT,
  professional_values TEXT,
  work_authorization TEXT,
  special_permits JSONB,
  industries JSONB,
  projects JSONB,
  profile_completeness INTEGER,
  last_updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    c.position,
    c.years_experience,
    c.location,
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
    c.last_updated_at
  FROM candidates c
  WHERE c.user_id = user_id_param
  ORDER BY c.created_at DESC;
END;
$$;
