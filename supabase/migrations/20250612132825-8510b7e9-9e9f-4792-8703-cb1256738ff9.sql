
-- Supprimer d'abord le trigger spécifique qui cause le problème
DROP TRIGGER IF EXISTS recalculate_score_on_candidate_update ON candidates;

-- Supprimer tous les triggers qui pourraient référencer les fonctions
DROP TRIGGER IF EXISTS trigger_recalculate_candidate_score ON candidates;
DROP TRIGGER IF EXISTS trigger_recalculate_score_on_notes_change ON candidate_notes;
DROP TRIGGER IF EXISTS trigger_calculate_candidate_score ON candidates;

-- Maintenant supprimer les fonctions de trigger avec CASCADE si nécessaire
DROP FUNCTION IF EXISTS public.trigger_recalculate_candidate_score() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_recalculate_score_on_notes_change() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_calculate_candidate_score() CASCADE;

-- Supprimer toutes les fonctions qui référencent la table candidate_scores supprimée
DROP FUNCTION IF EXISTS public.save_ai_candidate_score(UUID, INTEGER, TEXT, UUID, JSONB, JSONB, JSONB, JSONB);
DROP FUNCTION IF EXISTS public.get_ai_candidate_score(UUID, UUID);
DROP FUNCTION IF EXISTS public.delete_ai_candidate_score(UUID, UUID);
DROP FUNCTION IF EXISTS public.debug_ai_candidate_scores(UUID);

-- Supprimer les fonctions liées au scoring qui référencent les tables supprimées
DROP FUNCTION IF EXISTS public.calculate_candidate_completeness_score(UUID);
DROP FUNCTION IF EXISTS public.calculate_and_store_completeness_score(UUID);
DROP FUNCTION IF EXISTS public.calculate_candidate_data_hash(UUID);
DROP FUNCTION IF EXISTS public.calculate_and_store_candidate_score(UUID);
DROP FUNCTION IF EXISTS public.calculate_and_store_job_score(UUID, UUID);

-- S'assurer que les colonnes AI existent dans la table candidates
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS ai_score INTEGER,
ADD COLUMN IF NOT EXISTS ai_explanation TEXT,
ADD COLUMN IF NOT EXISTS ai_breakdown JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS ai_strengths JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ai_weaknesses JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ai_recommendations JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ai_analyzed_at TIMESTAMPTZ;

-- Créer un index pour améliorer les performances des requêtes sur le score IA
CREATE INDEX IF NOT EXISTS idx_candidates_ai_score ON candidates (ai_score) WHERE ai_score IS NOT NULL;
