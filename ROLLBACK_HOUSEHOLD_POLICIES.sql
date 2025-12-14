-- COMPLETE ROLLBACK: Remove all household policies that broke vision_versions
-- Copy and paste this entire file into Supabase SQL Editor and run it

-- Remove all household-related policies from vision_versions
DROP POLICY IF EXISTS "household_members_can_access_household_visions" ON vision_versions;
DROP POLICY IF EXISTS "household_members_can_view_household_visions" ON vision_versions;
DROP POLICY IF EXISTS "household_members_can_insert_household_visions" ON vision_versions;
DROP POLICY IF EXISTS "household_members_can_update_household_visions" ON vision_versions;
DROP POLICY IF EXISTS "household_members_can_delete_household_visions" ON vision_versions;
DROP POLICY IF EXISTS "Household members view household visions" ON vision_versions;
DROP POLICY IF EXISTS "Household members insert household visions" ON vision_versions;
DROP POLICY IF EXISTS "Household members update household visions" ON vision_versions;
DROP POLICY IF EXISTS "Household members delete household visions" ON vision_versions;

-- Verify: Check what policies remain (should only be the original 4)
SELECT 
  policyname, 
  cmd as operation
FROM pg_policies 
WHERE tablename = 'vision_versions'
ORDER BY policyname;

-- You should see ONLY these 4 policies:
-- 1. Users can delete own visions (DELETE)
-- 2. Users can insert own visions (INSERT)
-- 3. Users can update own visions (UPDATE)
-- 4. Users can view own visions (SELECT)

