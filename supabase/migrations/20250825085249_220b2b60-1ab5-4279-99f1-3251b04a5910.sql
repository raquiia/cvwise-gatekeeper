-- Add references fields to candidates table
ALTER TABLE public.candidates 
ADD COLUMN references_contact_info TEXT,
ADD COLUMN references_conclusion TEXT, 
ADD COLUMN references_taken BOOLEAN DEFAULT NULL,
ADD COLUMN references_verified_at TIMESTAMP WITH TIME ZONE;