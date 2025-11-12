-- Check is_draft value on your profile
-- Run this in Supabase SQL Editor

SELECT 
  id,
  user_id,
  first_name,
  is_active,
  is_draft,
  pg_typeof(is_draft) as is_draft_type,
  created_at,
  updated_at
FROM user_profiles 
WHERE user_id = auth.uid()
ORDER BY updated_at DESC;

-- If is_draft is NULL or TRUE, update it:
UPDATE user_profiles 
SET is_draft = false 
WHERE user_id = auth.uid() 
AND (is_draft IS NULL OR is_draft = true)
RETURNING id, first_name, is_active, is_draft;

