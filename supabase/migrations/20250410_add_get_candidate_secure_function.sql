
-- Create a secure function to get candidate by ID that avoids recursion
CREATE OR REPLACE FUNCTION public.get_candidate_by_id_secure(candidate_id_param UUID)
RETURNS SETOF jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT to_jsonb(c) 
  FROM candidates c
  WHERE c.id = candidate_id_param;
END;
$$;
