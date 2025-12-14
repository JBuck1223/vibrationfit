-- COMPLETE ROLLBACK: Remove ALL household policies from vision_versions
-- This should restore your life-vision page to working state

DROP POLICY IF EXISTS "household_members_can_access_household_visions" ON vision_versions;
DROP POLICY IF EXISTS "household_members_can_view_household_visions" ON vision_versions;
DROP POLICY IF EXISTS "household_members_can_insert_household_visions" ON vision_versions;
DROP POLICY IF EXISTS "household_members_can_update_household_visions" ON vision_versions;
DROP POLICY IF EXISTS "household_members_can_delete_household_visions" ON vision_versions;

-- That's it. Your original policies should handle everything:
-- - "Users can view their own visions" - FOR SELECT USING (auth.uid() = user_id)
-- - "Users can insert their own visions" - FOR INSERT WITH CHECK (auth.uid() = user_id)
-- - "Users can update their own visions" - FOR UPDATE USING (auth.uid() = user_id)
-- - "Users can delete their own visions" - FOR DELETE USING (auth.uid() = user_id)

-- These original policies work for both personal AND household visions
-- as long as user_id = auth.uid() (the creator/owner)

