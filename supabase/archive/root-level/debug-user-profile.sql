-- Debug: Check your user profile data
-- Run these queries in Supabase SQL Editor

-- 1. Check if you have ANY profiles (without is_active filter)
SELECT 
  id,
  user_id,
  first_name,
  profile_picture_url,
  vibe_assistant_tokens_remaining,
  is_active,
  pg_typeof(is_active) as is_active_type,
  created_at,
  updated_at
FROM user_profiles 
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- 2. Check ALL profiles to see is_active values
SELECT 
  id,
  user_id,
  first_name,
  is_active,
  CASE 
    WHEN is_active = true THEN 'TRUE (boolean)'
    WHEN is_active = 'TRUE' THEN 'TRUE (string)'
    WHEN is_active = false THEN 'FALSE (boolean)'
    WHEN is_active = 'FALSE' THEN 'FALSE (string)'
    ELSE 'NULL or other: ' || is_active::text
  END as is_active_status,
  created_at
FROM user_profiles 
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- 3. Check your user ID
SELECT auth.uid() as current_user_id;

-- 4. If you have profiles but is_active is NULL or false, update them:
-- (Uncomment to run - only if needed!)
-- UPDATE user_profiles 
-- SET is_active = true 
-- WHERE user_id = auth.uid() 
-- AND (is_active IS NULL OR is_active = false)
-- RETURNING id, first_name, is_active;

