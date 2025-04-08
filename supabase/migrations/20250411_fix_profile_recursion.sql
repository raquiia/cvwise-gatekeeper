
-- Supprimer les politiques problématiques sur les tables qui utilisent des références circulaires
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles by id" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile only" ON public.profiles;

-- S'assurer que RLS est activé sur la table profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Créer une fonction sécurisée pour obtenir un profil par ID sans récursion RLS
CREATE OR REPLACE FUNCTION public.get_profile_by_id_no_rls(profile_id_param uuid)
RETURNS SETOF profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles WHERE id = profile_id_param;
$$;

-- Créer des politiques simples et directes (non-circulaires) pour la table profiles
CREATE POLICY "Allow users to view own profile" 
ON public.profiles 
FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "Allow users to update own profile" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid());

CREATE POLICY "Allow users to insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (id = auth.uid());

-- Corriger les politiques pour la table candidates pour éviter la récursion
DROP POLICY IF EXISTS "Users can view candidates by id" ON public.candidates;
DROP POLICY IF EXISTS "Users can view candidates by id via secure function" ON public.candidates;
DROP POLICY IF EXISTS "Users can view their own candidates only" ON public.candidates;
DROP POLICY IF EXISTS "Users can update their own candidates only" ON public.candidates;
DROP POLICY IF EXISTS "Users can delete their own candidates only" ON public.candidates;

-- Créer des politiques propres et non-récursives pour les candidats
CREATE POLICY "Allow users to view own candidates" 
ON public.candidates 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Allow users to update own candidates" 
ON public.candidates 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Allow users to insert own candidates" 
ON public.candidates 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow users to delete own candidates" 
ON public.candidates 
FOR DELETE 
USING (user_id = auth.uid());
