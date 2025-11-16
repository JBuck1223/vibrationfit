-- =====================================================================
-- Fix household_members RLS Policies
-- =====================================================================
-- Issue: Circular reference in RLS policy preventing queries from working
-- Solution: Simplify policies to avoid circular references

-- Drop ALL existing policies on household_members
DO $$ 
DECLARE 
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'household_members' 
    AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON household_members', policy_record.policyname);
  END LOOP;
END $$;

-- Create new simplified policies (NON-RECURSIVE)

-- Policy: Users can view their own membership AND all members in households they admin
-- Uses ONLY households table to avoid recursion
CREATE POLICY "Users can view household members"
  ON household_members
  FOR SELECT
  USING (
    user_id = auth.uid() 
    OR 
    household_id IN (
      SELECT h.id 
      FROM households h 
      WHERE h.admin_user_id = auth.uid()
    )
  );

-- Policy 3: Household admins can insert new members (when accepting invitations)
CREATE POLICY "Admins can add members"
  ON household_members
  FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT id 
      FROM households 
      WHERE admin_user_id = auth.uid()
    )
  );

-- Policy 4: Household admins can update member settings
CREATE POLICY "Admins can update members"
  ON household_members
  FOR UPDATE
  USING (
    household_id IN (
      SELECT id 
      FROM households 
      WHERE admin_user_id = auth.uid()
    )
  );

-- Policy 5: Household admins can remove members
CREATE POLICY "Admins can remove members"
  ON household_members
  FOR DELETE
  USING (
    household_id IN (
      SELECT id 
      FROM households 
      WHERE admin_user_id = auth.uid()
    )
  );

-- Add comment
COMMENT ON TABLE household_members IS 'Tracks household membership with simplified RLS policies to avoid circular references';

