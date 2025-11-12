-- Run this in Supabase SQL Editor to check the actual column names in vision_versions table

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'vision_versions'
  AND column_name IN ('romance', 'love', 'business', 'work', 'possessions', 'stuff')
ORDER BY column_name;

-- Also show ALL columns to see the full structure:
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'vision_versions'
ORDER BY ordinal_position;
