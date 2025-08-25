-- First, update all existing status values to match the new pipeline steps
UPDATE candidates SET detailed_status = 'prise_contact' WHERE detailed_status = 'initial';
UPDATE candidates SET detailed_status = 'prise_contact' WHERE detailed_status = 'contact';
UPDATE candidates SET detailed_status = 'ps' WHERE detailed_status = 'prequalification';
UPDATE candidates SET detailed_status = 'ci1' WHERE detailed_status = 'ec1';
UPDATE candidates SET detailed_status = 'ci2' WHERE detailed_status = 'ec2';
UPDATE candidates SET detailed_status = 'ci3' WHERE detailed_status = 'presentation_client';
UPDATE candidates SET detailed_status = 'hired' WHERE detailed_status = 'en_mission';
UPDATE candidates SET detailed_status = 'hired' WHERE detailed_status = 'ancien_employe';

-- Drop the old constraint if it exists
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_detailed_status_check;

-- Add the new constraint with updated status values
ALTER TABLE candidates ADD CONSTRAINT candidates_detailed_status_check 
CHECK (detailed_status = ANY(ARRAY[
  'prise_contact', 'ps', 'ci1', 'ci2', 'ci3', 'pipeline', 
  'formal_offer', 'contingent_offer', 'offer_declined', 
  'offer_accepted', 'contract_signed', 'hired'
]));

-- Update the default value for detailed_status column
ALTER TABLE candidates ALTER COLUMN detailed_status SET DEFAULT 'prise_contact';