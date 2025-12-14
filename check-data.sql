-- Check for any visions with NULL user_id
SELECT 
  id,
  user_id,
  household_id,
  title,
  is_draft,
  is_active,
  created_at
FROM vision_versions
WHERE user_id IS NULL
ORDER BY created_at DESC;

-- Check all your personal visions
SELECT 
  id,
  user_id,
  household_id,
  title,
  is_draft,
  is_active,
  created_at
FROM vision_versions
WHERE household_id IS NULL  -- Personal visions
ORDER BY created_at DESC;

