-- Test script to verify AI scoring fix
-- Run this in Supabase SQL editor to check if the function is working

-- Check if the function exists and what it looks like
SELECT routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'calculate_category_score';

-- Test the function with a sample assessment
-- Replace 'your-assessment-id' with an actual assessment ID that has custom responses
SELECT 
  category,
  calculate_category_score('your-assessment-id'::uuid, category::assessment_category) as calculated_score,
  SUM(response_value) as sum_response_value,
  SUM(CASE WHEN ai_score IS NOT NULL AND is_custom_response = true THEN ai_score ELSE response_value END) as sum_with_ai_score
FROM assessment_responses 
WHERE assessment_id = 'your-assessment-id'::uuid
GROUP BY category;
