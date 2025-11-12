-- Check what values exist in the token_action_type enum
SELECT 
  t.typname AS enum_name,
  e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'token_action_type'
ORDER BY e.enumsortorder;

