-- Fix the function search path issue
CREATE OR REPLACE FUNCTION public.assign_candidate_to_recruiter_hub()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If no hub_id is specified, assign the recruiter's hub
  IF NEW.hub_id IS NULL THEN
    NEW.hub_id := (
      SELECT hub_id 
      FROM public.profiles 
      WHERE id = NEW.user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;