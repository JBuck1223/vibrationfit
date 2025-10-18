-- Debug script to check what's actually in the database
-- Run this in Supabase SQL editor to see what's happening

-- Check if the function was updated
SELECT routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'calculate_category_score';

-- Check what's in assessment_responses for custom responses
SELECT 
  question_id,
  response_value,
  ai_score,
  is_custom_response,
  response_text,
  green_line
FROM assessment_responses 
WHERE is_custom_response = true
ORDER BY created_at DESC
LIMIT 5;

-- Check if there are any responses with ai_score
SELECT 
  COUNT(*) as total_responses,
  COUNT(CASE WHEN ai_score IS NOT NULL THEN 1 END) as responses_with_ai_score,
  COUNT(CASE WHEN is_custom_response = true THEN 1 END) as custom_responses
FROM assessment_responses;
