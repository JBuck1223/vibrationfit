-- Rollback for 20251213000500_household_simple.sql
-- This removes the problematic policy that was breaking personal vision access

DROP POLICY IF EXISTS "household_members_can_access_household_visions" ON vision_versions;

-- That's it - this restores access to personal visions
-- The original policies ("Users can view their own visions" etc.) will handle everything

