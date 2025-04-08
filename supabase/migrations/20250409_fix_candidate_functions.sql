
-- Supprimer les fonctions existantes si elles existent
DROP FUNCTION IF EXISTS public.get_candidate_by_id_secure;
DROP FUNCTION IF EXISTS public.get_candidate_by_id;

-- Créer une nouvelle fonction sécurisée pour récupérer un candidat par ID
CREATE OR REPLACE FUNCTION public.get_candidate_by_id(candidate_id_param uuid)
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
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.candidates
  WHERE id = candidate_id_param;
END;
$$;

-- Ajuster les politiques RLS pour les candidats
DROP POLICY IF EXISTS "Users can view candidates by id" ON public.candidates;
DROP POLICY IF EXISTS "Users can view candidates by id via secure function" ON public.candidates;

CREATE POLICY "Users can view their own candidates" 
ON public.candidates FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own candidates" 
ON public.candidates FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own candidates" 
ON public.candidates FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own candidates" 
ON public.candidates FOR DELETE 
USING (auth.uid() = user_id);
