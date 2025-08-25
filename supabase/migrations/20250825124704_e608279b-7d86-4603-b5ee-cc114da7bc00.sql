-- Drop the old constraint
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

-- Update any existing 'initial' status records to 'prise_contact'
UPDATE candidates SET detailed_status = 'prise_contact' WHERE detailed_status = 'initial';

-- Update any existing 'contact' status records to 'prise_contact'
UPDATE candidates SET detailed_status = 'prise_contact' WHERE detailed_status = 'contact';

-- Update any existing 'prequalification' status records to 'ps'
UPDATE candidates SET detailed_status = 'ps' WHERE detailed_status = 'prequalification';

-- Update any existing 'ec1' status records to 'ci1'
UPDATE candidates SET detailed_status = 'ci1' WHERE detailed_status = 'ec1';

-- Update any existing 'ec2' status records to 'ci2'
UPDATE candidates SET detailed_status = 'ci2' WHERE detailed_status = 'ec2';

-- Update any existing 'presentation_client' status records to 'ci3'
UPDATE candidates SET detailed_status = 'ci3' WHERE detailed_status = 'presentation_client';

-- Update any existing 'en_mission' status records to 'hired'
UPDATE candidates SET detailed_status = 'hired' WHERE detailed_status = 'en_mission';

-- Update any existing 'refus' status records to 'offer_declined'
UPDATE candidates SET detailed_status = 'offer_declined' WHERE detailed_status = 'refus';

-- Update any existing 'ancien_employe' status records to 'hired'
UPDATE candidates SET detailed_status = 'hired' WHERE detailed_status = 'ancien_employe';