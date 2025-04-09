
-- Create a new SQL function to get candidates by IDs without causing recursion
CREATE OR REPLACE FUNCTION get_candidates_by_ids(candidate_ids UUID[])
RETURNS SETOF candidates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- This function is marked as SECURITY DEFINER, meaning it runs with the permissions
    -- of the user who created it (usually the DB admin), bypassing RLS
    RETURN QUERY
    SELECT *
    FROM candidates
    WHERE id = ANY(candidate_ids)
    AND auth.uid() = user_id; -- Still apply the user_id check for security
END;
$$;

-- Grant permission to execute this function to authenticated users
GRANT EXECUTE ON FUNCTION get_candidates_by_ids(UUID[]) TO authenticated;
