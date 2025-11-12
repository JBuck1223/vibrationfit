-- Quick verification query to check if the functions were created
-- Run this in Supabase SQL Editor to verify

SELECT 
  proname as function_name,
  pg_get_function_result(oid) as return_type,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE proname IN ('calculate_version_diff', 'get_field_label')
ORDER BY proname;

