-- Step 1: Remove the existing constraint completely
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_detailed_status_check;

-- Step 2: Update all existing data to new status values
UPDATE candidates SET detailed_status = 'prise_contact' WHERE detailed_status IN ('initial', 'contact');
UPDATE candidates SET detailed_status = 'ps' WHERE detailed_status = 'prequalification';
UPDATE candidates SET detailed_status = 'ci1' WHERE detailed_status = 'ec1';
UPDATE candidates SET detailed_status = 'ci2' WHERE detailed_status = 'ec2';
UPDATE candidates SET detailed_status = 'ci3' WHERE detailed_status = 'presentation_client';
UPDATE candidates SET detailed_status = 'hired' WHERE detailed_status IN ('en_mission', 'ancien_employe');

-- Step 3: Update the default value
ALTER TABLE candidates ALTER COLUMN detailed_status SET DEFAULT 'prise_contact';

-- Step 4: Add the new constraint
ALTER TABLE candidates ADD CONSTRAINT candidates_detailed_status_check 
CHECK (detailed_status = ANY(ARRAY[
  'prise_contact', 'ps', 'ci1', 'ci2', 'ci3', 'pipeline', 
  'formal_offer', 'contingent_offer', 'offer_declined', 
  'offer_accepted', 'contract_signed', 'hired'
]));