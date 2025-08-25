-- Add experience_breakdown column to salary_calculations table
ALTER TABLE salary_calculations 
ADD COLUMN experience_breakdown JSONB DEFAULT '[]'::jsonb;