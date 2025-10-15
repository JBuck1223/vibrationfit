-- ============================================================================
-- Add AI Scoring Fields to Assessment Responses
-- ============================================================================
-- This migration adds fields to support AI-scored custom responses in the assessment

-- Add new columns to assessment_responses table
ALTER TABLE assessment_responses
ADD COLUMN is_custom_response BOOLEAN DEFAULT FALSE,
ADD COLUMN ai_score INTEGER CHECK (ai_score IN (2, 4, 6, 8, 10)),
ADD COLUMN ai_green_line TEXT CHECK (ai_green_line IN ('above', 'neutral', 'below'));

-- Add comments for the new columns
COMMENT ON COLUMN assessment_responses.is_custom_response IS 'True if this response was a custom text response scored by AI';
COMMENT ON COLUMN assessment_responses.ai_score IS 'AI-generated score for custom responses (2, 4, 6, 8, or 10)';
COMMENT ON COLUMN assessment_responses.ai_green_line IS 'AI-determined Green Line status for custom responses';

-- Update the unique constraint to handle the new fields properly
-- (The existing constraint should still work, but let's make sure)
-- No changes needed to the unique constraint as it's on (assessment_id, question_id)
