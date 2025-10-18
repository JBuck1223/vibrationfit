-- Fix AI scoring in assessment calculations
-- Purpose: Update calculate_category_score function to use ai_score when available

-- Update the calculate_category_score function to prioritize ai_score for custom responses
CREATE OR REPLACE FUNCTION calculate_category_score(
  p_assessment_id UUID,
  p_category assessment_category
)
RETURNS INTEGER AS $$
DECLARE
  v_total_score INTEGER;
BEGIN
  -- Use ai_score when available (for custom responses), otherwise use response_value
  SELECT COALESCE(SUM(
    CASE 
      WHEN ai_score IS NOT NULL AND is_custom_response = true THEN ai_score
      ELSE response_value
    END
  ), 0)
  INTO v_total_score
  FROM assessment_responses
  WHERE assessment_id = p_assessment_id
    AND category = p_category;
  
  RETURN v_total_score;
END;
$$ LANGUAGE plpgsql;

-- Add comment explaining the change
COMMENT ON FUNCTION calculate_category_score IS 'Calculates total score for a category, using ai_score for custom responses when available, otherwise response_value';

-- Log the change
DO $$
BEGIN
  RAISE NOTICE '✅ Updated calculate_category_score function to use ai_score for custom responses';
END $$;
