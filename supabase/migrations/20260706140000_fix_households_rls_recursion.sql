-- Fix infinite RLS recursion between households and household_members
--
-- Bug: "Start Fresh" on Life Vision failed with
--   ERROR 42P17: infinite recursion detected in policy for relation "household_members"
--
-- Cause: circular policy references:
--   vision_versions DELETE policy (household_admins_can_delete_household_visions)
--     -> subqueries household_members
--   household_members SELECT policy ("Users can view household members")
--     -> subqueries households
--   households SELECT policy ("Users can view their household")
--     -> subqueries household_members  (cycle -> recursion at plan time)
--
-- Fix: rewrite the households SELECT policy to use the existing
-- SECURITY DEFINER helper is_active_household_member() (added in
-- 20251213000600_household_with_helper.sql), which bypasses RLS and
-- breaks the cycle. Visibility semantics are unchanged: admins and
-- active members can see their household.

DROP POLICY "Users can view their household" ON households;

CREATE POLICY "Users can view their household" ON households
  FOR SELECT USING (
    admin_user_id = auth.uid()
    OR is_active_household_member(id, auth.uid())
  );
