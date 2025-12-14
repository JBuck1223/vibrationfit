-- FIXED: household support with proper personal vision access
-- Drop the problematic policy first
DROP POLICY IF EXISTS "household_members_can_access_household_visions" ON vision_versions;

-- Add household access policy that ONLY applies to household visions
-- Split into separate policies for clarity
CREATE POLICY "household_members_can_view_household_visions" 
  ON vision_versions FOR SELECT
  USING (
    household_id IS NOT NULL 
    AND household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() 
        AND status = 'active'
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
        AND status = 'active'
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
        AND status = 'active'
    )
  )
  WITH CHECK (
    household_id IS NOT NULL 
    AND household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() 
        AND status = 'active'
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
        AND status = 'active'
    )
  );

-- Verify existing policies are still there (they should be from original migration)
-- These handle personal visions where household_id IS NULL:
-- ✓ "Users can view their own visions" - FOR SELECT USING (auth.uid() = user_id)
-- ✓ "Users can insert their own visions" - FOR INSERT WITH CHECK (auth.uid() = user_id)
-- ✓ "Users can update their own visions" - FOR UPDATE USING (auth.uid() = user_id)
-- ✓ "Users can delete their own visions" - FOR DELETE USING (auth.uid() = user_id)

-- How it works:
-- Personal visions (household_id IS NULL): Handled by original "Users can X their own visions" policies
-- Household visions (household_id IS NOT NULL): Handled by new "household_members_can_X" policies
-- PostgreSQL RLS uses OR logic, so either set of policies will grant access

