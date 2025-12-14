-- Safe household support that won't break personal visions
-- Only adds ADDITIONAL access for household members
-- Existing policies continue to work for all visions

-- Clean slate: remove any previous household policies
DROP POLICY IF EXISTS "household_members_can_access_household_visions" ON vision_versions;
DROP POLICY IF EXISTS "household_members_can_view_household_visions" ON vision_versions;
DROP POLICY IF EXISTS "household_members_can_insert_household_visions" ON vision_versions;
DROP POLICY IF EXISTS "household_members_can_update_household_visions" ON vision_versions;
DROP POLICY IF EXISTS "household_members_can_delete_household_visions" ON vision_versions;

-- Add NEW policies that only apply to household visions
-- These work IN ADDITION TO the existing "Users can X own visions" policies

-- Policy 1: Household members can VIEW household visions
CREATE POLICY "Household members view household visions" 
  ON vision_versions FOR SELECT
  USING (
    -- Only applies if household_id is set
    household_id IS NOT NULL
    -- And user is a member of that household  
    AND EXISTS (
      SELECT 1 
      FROM household_members 
      WHERE household_members.household_id = vision_versions.household_id
        AND household_members.user_id = auth.uid()
    )
  );

-- Policy 2: Household members can INSERT household visions
CREATE POLICY "Household members insert household visions" 
  ON vision_versions FOR INSERT
  WITH CHECK (
    -- Only applies if household_id is set
    household_id IS NOT NULL
    -- And user is a member of that household
    AND EXISTS (
      SELECT 1 
      FROM household_members 
      WHERE household_members.household_id = vision_versions.household_id
        AND household_members.user_id = auth.uid()
    )
  );

-- Policy 3: Household members can UPDATE household visions
CREATE POLICY "Household members update household visions" 
  ON vision_versions FOR UPDATE
  USING (
    household_id IS NOT NULL
    AND EXISTS (
      SELECT 1 
      FROM household_members 
      WHERE household_members.household_id = vision_versions.household_id
        AND household_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    household_id IS NOT NULL
    AND EXISTS (
      SELECT 1 
      FROM household_members 
      WHERE household_members.household_id = vision_versions.household_id
        AND household_members.user_id = auth.uid()
    )
  );

-- Policy 4: Household members can DELETE household visions
CREATE POLICY "Household members delete household visions" 
  ON vision_versions FOR DELETE
  USING (
    household_id IS NOT NULL
    AND EXISTS (
      SELECT 1 
      FROM household_members 
      WHERE household_members.household_id = vision_versions.household_id
        AND household_members.user_id = auth.uid()
    )
  );

-- How this works:
--
-- Personal visions (household_id IS NULL):
--   ✓ Handled by existing "Users can X own visions" policies
--   ✓ New policies return FALSE (household_id IS NOT NULL fails)
--   ✓ No interference!
--
-- Household visions - Creator (user_id = auth.uid()):
--   ✓ Handled by existing "Users can X own visions" policies
--   ✓ Creator still has full control via user_id match
--
-- Household visions - Other members:
--   ✓ Handled by new "Household members X household visions" policies
--   ✓ Grants access via household_members membership
--
-- PostgreSQL RLS uses OR logic across policies, so if ANY policy grants access, it works!

