-- Household vision support using SECURITY DEFINER helper function
-- Avoids RLS issues on household_members and improves performance

-- Step 1: Create helper function (bypasses RLS safely)
CREATE OR REPLACE FUNCTION is_active_household_member(h uuid, u uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = h
      AND user_id = u
      AND status = 'active'
  );
$$;

-- Grant execute to authenticated role only
REVOKE EXECUTE ON FUNCTION is_active_household_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_active_household_member(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION is_active_household_member(h uuid, u uuid) IS 
  'SECURITY DEFINER function to check if user is active household member. Bypasses RLS for membership checks.';

-- Step 2: Ensure table-level GRANTs exist
GRANT SELECT, INSERT, UPDATE, DELETE ON vision_versions TO authenticated;

-- Step 3: Add household policies (supplement existing personal policies)

-- SELECT: Household members can view household visions
CREATE POLICY "household_members_can_view_household_visions"
  ON vision_versions FOR SELECT TO authenticated
  USING (
    household_id IS NOT NULL
    AND is_active_household_member(household_id, auth.uid())
  );

-- INSERT: Household members can create household visions
CREATE POLICY "household_members_can_insert_household_visions"
  ON vision_versions FOR INSERT TO authenticated
  WITH CHECK (
    household_id IS NOT NULL
    AND user_id = auth.uid()  -- Must be creator
    AND is_active_household_member(household_id, auth.uid())
  );

-- UPDATE: Household members can edit household visions
CREATE POLICY "household_members_can_update_household_visions"
  ON vision_versions FOR UPDATE TO authenticated
  USING (
    household_id IS NOT NULL
    AND is_active_household_member(household_id, auth.uid())
  )
  WITH CHECK (
    household_id IS NOT NULL
    AND is_active_household_member(household_id, auth.uid())
  );

-- DELETE: Only household admins can delete household visions
CREATE POLICY "household_admins_can_delete_household_visions"
  ON vision_versions FOR DELETE TO authenticated
  USING (
    household_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM household_members
      WHERE household_id = vision_versions.household_id
        AND user_id = auth.uid()
        AND status = 'active'
        AND role = 'admin'
    )
  );

-- Step 4: Add index for performance
CREATE INDEX IF NOT EXISTS idx_household_members_user_household 
  ON household_members(user_id, household_id) 
  WHERE status = 'active';

-- Step 5: Verify personal vision policies exist and have TO clause
-- Check existing policies
DO $$
BEGIN
  -- If personal policies don't specify TO authenticated, recreate them
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'vision_versions' 
      AND policyname = 'Users can view own visions'
  ) THEN
    -- Create personal SELECT policy if missing
    CREATE POLICY "Users can view own visions"
      ON vision_versions FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

COMMENT ON TABLE vision_versions IS 
  'Life visions. Personal visions have household_id = NULL. Household visions have household_id set and are accessible to all active household members.';




