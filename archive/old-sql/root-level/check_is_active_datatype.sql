-- Check the data type of is_active column in user_profiles table
SELECT 
    column_name,
    data_type,
    udt_name,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
  AND column_name = 'is_active';

-- Also check a sample of actual values to see what's stored
SELECT 
    user_id,
    is_active,
    pg_typeof(is_active) as actual_type,
    is_active::text as value_as_text
FROM user_profiles
LIMIT 10;

