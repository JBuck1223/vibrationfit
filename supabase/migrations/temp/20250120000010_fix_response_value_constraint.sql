-- Fix response_value constraint to allow 0 for custom responses
-- Purpose: Allow response_value to be 0 for "None of these specifically resonate" responses

-- Drop the existing constraint
ALTER TABLE assessment_responses DROP CONSTRAINT IF EXISTS assessment_responses_response_value_check;

-- Add the new constraint that allows 0, 2, 4, 6, 8, 10
ALTER TABLE assessment_responses ADD CONSTRAINT assessment_responses_response_value_check 
CHECK (response_value IN (0, 2, 4, 6, 8, 10));

-- Update the comment to reflect the change
COMMENT ON COLUMN assessment_responses.response_value IS 'Numerical value of the response (0 for custom responses, 2, 4, 6, 8, or 10 for regular responses)';

-- Log the change
DO $$
BEGIN
  RAISE NOTICE '✅ Updated response_value constraint to allow 0 for custom responses';
END $$;
