-- Run this in Supabase SQL Editor to see what policies exist
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  cmd as operation,
  qual as using_clause,
  with_check
FROM pg_policies 
WHERE tablename = 'vision_versions'
ORDER BY policyname;

