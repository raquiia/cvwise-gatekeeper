-- Ajouter une politique pour permettre la lecture de toutes les offres d'emploi
-- (similaire à ce qui existe déjà pour les candidats)
CREATE POLICY "Users can view all job offers for matching purposes" 
ON public.job_offers 
FOR SELECT 
USING (true);