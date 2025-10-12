-- Cleanup script to remove empty "My Vision (Created with Viva)" entries
-- Run this in your Supabase SQL editor

-- First, let's see what we're deleting (review this before running the DELETE)
SELECT id, user_id, title, version_number, created_at, updated_at
FROM vision_versions
WHERE title = 'My Vision (Created with Viva)'
ORDER BY created_at DESC;

-- Once you've confirmed these are the empty Viva visions, run this to delete them:
-- DELETE FROM vision_versions
-- WHERE title = 'My Vision (Created with Viva)';

-- After deletion, verify your real vision is back as latest:
-- SELECT id, user_id, title, version_number, created_at
-- FROM vision_versions
-- ORDER BY version_number DESC
-- LIMIT 5;

