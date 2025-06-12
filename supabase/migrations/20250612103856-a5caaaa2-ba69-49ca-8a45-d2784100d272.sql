
-- Ajouter les colonnes d'analyse IA directement dans la table candidates
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
