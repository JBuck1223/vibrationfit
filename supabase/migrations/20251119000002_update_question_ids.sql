-- Migration: Update question IDs to use clean category names
-- Changes: romance_* -> love_*, business_* -> work_*, possessions_* -> stuff_*
-- Date: November 19, 2025

-- Update Love (Romance) question IDs
UPDATE assessment_responses
SET question_id = REPLACE(question_id, 'romance_single_', 'love_single_')
WHERE question_id LIKE 'romance_single_%';

UPDATE assessment_responses
SET question_id = REPLACE(question_id, 'romance_relationship_', 'love_relationship_')
WHERE question_id LIKE 'romance_relationship_%';

-- Update Work (Business) question IDs
UPDATE assessment_responses
SET question_id = REPLACE(question_id, 'business_owner_', 'work_owner_')
WHERE question_id LIKE 'business_owner_%';

UPDATE assessment_responses
SET question_id = REPLACE(question_id, 'business_employee_', 'work_employee_')
WHERE question_id LIKE 'business_employee_%';

-- Update Stuff (Possessions) question IDs
UPDATE assessment_responses
SET question_id = REPLACE(question_id, 'possessions_', 'stuff_')
WHERE question_id LIKE 'possessions_%';

