-- Fix assessment_responses constraint to allow 0 for custom responses
-- Run this in Supabase SQL editor

-- Drop the existing constraint
ALTER TABLE assessment_responses 
DROP CONSTRAINT IF EXISTS assessment_responses_response_value_check;

-- Add new constraint that allows 0 for custom responses
ALTER TABLE assessment_responses 
ADD CONSTRAINT assessment_responses_response_value_check 
CHECK (response_value IN (0, 2, 4, 6, 8, 10));

-- Add comment explaining the change
COMMENT ON CONSTRAINT assessment_responses_response_value_check ON assessment_responses 
IS 'Allows 0 for custom responses, 2-10 for regular option responses';
