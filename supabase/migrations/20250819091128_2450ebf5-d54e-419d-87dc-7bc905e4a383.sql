-- Add business_manager column to candidate_notes table
ALTER TABLE public.candidate_notes 
ADD COLUMN business_manager TEXT;

-- Add index for better performance when filtering by business manager
CREATE INDEX idx_candidate_notes_business_manager 
ON public.candidate_notes(business_manager) 
WHERE business_manager IS NOT NULL;