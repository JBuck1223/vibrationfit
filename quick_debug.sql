-- Quick test to see what's actually in the database
-- Run this in Supabase SQL editor

-- Check the most recent custom responses
SELECT 
  question_id,
  response_value,
  ai_score,
  is_custom_response,
  response_text,
  green_line,
  created_at
FROM assessment_responses 
WHERE is_custom_response = true
ORDER BY created_at DESC
LIMIT 3;

-- Check if the function is using the right values
-- Replace 'your-assessment-id' with your actual assessment ID
SELECT 
  category,
  SUM(response_value) as sum_response_value,
  SUM(CASE WHEN ai_score IS NOT NULL AND is_custom_response = true THEN ai_score ELSE response_value END) as sum_with_ai_logic,
  COUNT(*) as response_count
FROM assessment_responses 
WHERE assessment_id = 'your-assessment-id'::uuid
GROUP BY category;
