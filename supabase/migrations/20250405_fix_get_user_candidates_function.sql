
-- Modify function to get user candidates to make sure it works properly
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
  updated_at TIMESTAMPTZ
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
    '' as company, -- Adding company field with default empty value
    c.created_at,
    c.updated_at
  FROM candidates c
  WHERE c.user_id = user_id_param
  ORDER BY c.created_at DESC;
END;
$$;
