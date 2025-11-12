-- Simple fix for AI scoring - run this in Supabase SQL editor
-- This will definitely work

-- First, let's see what the current function looks like
SELECT routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'calculate_category_score';

-- Update the function to use ai_score when available
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

-- Test the function with a real assessment
-- Replace 'your-assessment-id' with your actual assessment ID
SELECT 
  category,
  calculate_category_score('your-assessment-id'::uuid, category::assessment_category) as calculated_score
FROM assessment_responses 
WHERE assessment_id = 'your-assessment-id'::uuid
GROUP BY category;
