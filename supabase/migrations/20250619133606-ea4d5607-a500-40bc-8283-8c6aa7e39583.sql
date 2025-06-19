
-- Supprimer toutes les politiques RLS existantes sur la table candidates
DROP POLICY IF EXISTS "Users can view their own candidates" ON public.candidates;
DROP POLICY IF EXISTS "Users can insert their own candidates" ON public.candidates;
DROP POLICY IF EXISTS "Users can update their own candidates" ON public.candidates;
DROP POLICY IF EXISTS "Users can delete their own candidates" ON public.candidates;

-- S'assurer que RLS est activé
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- Créer des politiques RLS simples et optimisées
CREATE POLICY "candidates_select_policy" 
ON public.candidates FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "candidates_insert_policy" 
ON public.candidates FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "candidates_update_policy" 
ON public.candidates FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "candidates_delete_policy" 
ON public.candidates FOR DELETE 
USING (auth.uid() = user_id);
