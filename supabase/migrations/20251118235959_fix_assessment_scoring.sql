-- Migration: Fix assessment scoring and remove AI-related columns
-- Date: November 19, 2025

-- Step 1: Fix the calculate_category_score function (remove ai_score references)
CREATE OR REPLACE FUNCTION calculate_category_score(
  p_assessment_id UUID,
  p_category assessment_category
)
RETURNS INTEGER AS $$
DECLARE
  v_total_score INTEGER;
BEGIN
  -- Simple sum of response values - no AI logic needed
  SELECT COALESCE(SUM(response_value), 0)
  INTO v_total_score
  FROM assessment_responses
  WHERE assessment_id = p_assessment_id
    AND category = p_category;
  
  RETURN v_total_score;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_category_score IS 'Calculates total score for a category by summing response_value';

-- Step 2: Drop AI-related columns from assessment_responses
ALTER TABLE assessment_responses
  DROP COLUMN IF EXISTS is_custom_response,
  DROP COLUMN IF EXISTS ai_green_line,
  DROP COLUMN IF EXISTS custom_response_value;

