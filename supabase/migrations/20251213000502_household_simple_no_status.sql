-- SIMPLE household support WITHOUT status check
-- Works with current household_members schema

-- Drop previous policies if they exist
DROP POLICY IF EXISTS "household_members_can_access_household_visions" ON vision_versions;
DROP POLICY IF EXISTS "household_members_can_view_household_visions" ON vision_versions;
DROP POLICY IF EXISTS "household_members_can_insert_household_visions" ON vision_versions;
DROP POLICY IF EXISTS "household_members_can_update_household_visions" ON vision_versions;
DROP POLICY IF EXISTS "household_members_can_delete_household_visions" ON vision_versions;

-- Add household access policies (without status check)
CREATE POLICY "household_members_can_view_household_visions" 
  ON vision_versions FOR SELECT
  USING (
    household_id IS NOT NULL 
    AND household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "household_members_can_insert_household_visions" 
  ON vision_versions FOR INSERT
  WITH CHECK (
    household_id IS NOT NULL 
    AND household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "household_members_can_update_household_visions" 
  ON vision_versions FOR UPDATE
  USING (
    household_id IS NOT NULL 
    AND household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    household_id IS NOT NULL 
    AND household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "household_members_can_delete_household_visions" 
  ON vision_versions FOR DELETE
  USING (
    household_id IS NOT NULL 
    AND household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid()
    )
  );

-- These work alongside existing personal vision policies:
-- Personal visions (household_id IS NULL): "Users can X their own visions" policies
-- Household visions (household_id IS NOT NULL): These new "household_members_can_X" policies
-- PostgreSQL RLS uses OR logic, so either set works

