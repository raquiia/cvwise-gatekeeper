-- Add new refusal statuses and enhance candidate_notes table for feedback workflow

-- First, let's add the new refusal statuses to the candidates table constraint
-- We need to update the detailed_status field to support the new refusal statuses
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_detailed_status_check;

-- Add constraint with all statuses including refusal ones
ALTER TABLE candidates ADD CONSTRAINT candidates_detailed_status_check 
CHECK (detailed_status IN (
  'prise_contact', 'ps', 'ci1', 'ci2', 'ci3', 'pipeline',
  'formal_offer', 'contingent_offer', 'offer_declined', 
  'offer_accepted', 'contract_signed', 'hired',
  -- New refusal statuses
  'ps_refuse', 'ci1_refuse', 'ci2_refuse', 'ci3_refuse', 
  'ec1_refuse', 'ec2_refuse', 'refus'
));

-- Enhance candidate_notes table to support feedback workflow
ALTER TABLE candidate_notes ADD COLUMN IF NOT EXISTS feedback_type text;
ALTER TABLE candidate_notes ADD COLUMN IF NOT EXISTS next_action text;
ALTER TABLE candidate_notes ADD COLUMN IF NOT EXISTS previous_status text;
ALTER TABLE candidate_notes ADD COLUMN IF NOT EXISTS proposed_status text;

-- Add constraints for the new fields
ALTER TABLE candidate_notes ADD CONSTRAINT candidate_notes_feedback_type_check 
CHECK (feedback_type IS NULL OR feedback_type IN ('positif', 'negatif', 'neutre'));

ALTER TABLE candidate_notes ADD CONSTRAINT candidate_notes_next_action_check 
CHECK (next_action IS NULL OR next_action IN ('continue', 'refuse', 'en_attente'));

-- Add indexes for better performance on feedback queries
CREATE INDEX IF NOT EXISTS idx_candidate_notes_feedback_type ON candidate_notes(feedback_type);
CREATE INDEX IF NOT EXISTS idx_candidate_notes_next_action ON candidate_notes(next_action);

-- Update the note_type constraint to include new types
ALTER TABLE candidate_notes DROP CONSTRAINT IF EXISTS candidate_notes_note_type_check;
ALTER TABLE candidate_notes ADD CONSTRAINT candidate_notes_note_type_check 
CHECK (note_type IN ('precal', 'ci1', 'ci2', 'ci3', 'ec1', 'ec2', 'global', 'feedback'));

-- Add a function to automatically update candidate status based on feedback
CREATE OR REPLACE FUNCTION public.process_feedback_note()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process feedback for interview notes with feedback_type
  IF NEW.feedback_type IS NOT NULL AND NEW.next_action IS NOT NULL THEN
    
    -- Store the previous status
    NEW.previous_status := (
      SELECT detailed_status 
      FROM candidates 
      WHERE id = NEW.candidate_id
    );
    
    -- If feedback is negative and action is refuse, update candidate status
    IF NEW.feedback_type = 'negatif' AND NEW.next_action = 'refuse' THEN
      -- Determine refusal status based on note type
      CASE NEW.note_type
        WHEN 'precal' THEN NEW.proposed_status := 'ps_refuse';
        WHEN 'ci1' THEN NEW.proposed_status := 'ci1_refuse';
        WHEN 'ci2' THEN NEW.proposed_status := 'ci2_refuse';
        WHEN 'ci3' THEN NEW.proposed_status := 'ci3_refuse';
        ELSE NEW.proposed_status := 'refus';
      END CASE;
      
      -- Update candidate status
      UPDATE candidates 
      SET detailed_status = NEW.proposed_status,
          updated_at = now()
      WHERE id = NEW.candidate_id;
      
    -- If feedback is positive and action is continue, propose next status
    ELSIF NEW.feedback_type = 'positif' AND NEW.next_action = 'continue' THEN
      -- Determine next status based on current note type
      CASE NEW.note_type
        WHEN 'precal' THEN NEW.proposed_status := 'ci1';
        WHEN 'ci1' THEN NEW.proposed_status := 'ci2';
        WHEN 'ci2' THEN NEW.proposed_status := 'ci3';
        WHEN 'ci3' THEN NEW.proposed_status := 'pipeline';
        ELSE NEW.proposed_status := NULL;
      END CASE;
      
      -- Only update if there's a clear next step
      IF NEW.proposed_status IS NOT NULL THEN
        UPDATE candidates 
        SET detailed_status = NEW.proposed_status,
            updated_at = now()
        WHERE id = NEW.candidate_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic feedback processing
DROP TRIGGER IF EXISTS trigger_process_feedback_note ON candidate_notes;
CREATE TRIGGER trigger_process_feedback_note
  BEFORE INSERT ON candidate_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.process_feedback_note();