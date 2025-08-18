-- Ajouter la colonne source (provenance) à la table candidates
ALTER TABLE public.candidates 
ADD COLUMN source text DEFAULT 'autre';

-- Ajouter un commentaire pour documenter les valeurs possibles
COMMENT ON COLUMN public.candidates.source IS 'Source de provenance du candidat: offre_emploi, site_internet, cooptation, jobboard, linkedin, autre';

-- Créer un index pour optimiser les requêtes de filtrage par source
CREATE INDEX idx_candidates_source ON public.candidates(source);

-- Mettre à jour les candidats existants avec une valeur par défaut intelligente
UPDATE public.candidates 
SET source = 'linkedin' 
WHERE resume_id IN (
  SELECT id FROM public.resumes 
  WHERE file_name ILIKE '%linkedin%' OR file_path ILIKE '%linkedin%'
);

UPDATE public.candidates 
SET source = 'autre' 
WHERE source IS NULL;