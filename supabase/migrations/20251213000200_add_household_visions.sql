-- =================================================================
-- Migration: Add Household Vision Support to vision_versions
-- Date: 2024-12-13
-- Purpose: Enable household visions that can be shared by all household members
-- =================================================================

-- STEP 1: Add household_id column to vision_versions
-- ---------------------------------------------------------------
ALTER TABLE vision_versions
  ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES households(id) ON DELETE CASCADE;

-- Add index for household queries
CREATE INDEX IF NOT EXISTS idx_vision_versions_household_id 
  ON vision_versions(household_id);

-- Add comment
COMMENT ON COLUMN vision_versions.household_id IS 
  'Household ID if this is a shared household vision. Mutually exclusive with user_id. When set, all household members can view/edit this vision.';


-- STEP 2: Make user_id nullable (for household visions)
-- ---------------------------------------------------------------
-- First, we need to drop the NOT NULL constraint on user_id
ALTER TABLE vision_versions 
  ALTER COLUMN user_id DROP NOT NULL;


-- STEP 3: Add ownership constraint
-- ---------------------------------------------------------------
-- Vision must belong to EITHER user OR household (not both, not neither)
ALTER TABLE vision_versions
  ADD CONSTRAINT vision_ownership_check 
  CHECK (
    (user_id IS NOT NULL AND household_id IS NULL) OR
    (user_id IS NULL AND household_id IS NOT NULL)
  );


-- STEP 4: Drop old RLS policies (there are duplicates, clean them up)
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own visions" ON vision_versions;
DROP POLICY IF EXISTS "Users can view their own vision versions" ON vision_versions;
DROP POLICY IF EXISTS "Users can insert own visions" ON vision_versions;
DROP POLICY IF EXISTS "Users can insert their own vision versions" ON vision_versions;
DROP POLICY IF EXISTS "Users can update own visions" ON vision_versions;
DROP POLICY IF EXISTS "Users can update their own vision versions" ON vision_versions;
DROP POLICY IF EXISTS "Users can delete own visions" ON vision_versions;
DROP POLICY IF EXISTS "Users can delete their own vision versions" ON vision_versions;


-- STEP 5: Create new RLS policies supporting household access
-- ---------------------------------------------------------------

-- SELECT: View personal visions OR household visions (if active member)
CREATE POLICY "Users can view personal or household visions" 
  ON vision_versions FOR SELECT 
  USING (
    -- Personal visions
    (user_id = auth.uid()) 
    OR 
    -- Household visions where user is an active member
    (household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() 
        AND status = 'active'
    ))
  );

-- INSERT: Create personal visions OR household visions (if active member)
CREATE POLICY "Users can insert personal or household visions" 
  ON vision_versions FOR INSERT 
  WITH CHECK (
    -- Personal visions (user_id must match, household_id must be NULL)
    (user_id = auth.uid() AND household_id IS NULL)
    OR
    -- Household visions (user_id must be NULL, household_id must be a household the user is an active member of)
    (user_id IS NULL AND household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() 
        AND status = 'active'
    ))
  );

-- UPDATE: Edit personal visions OR household visions (if active member)
CREATE POLICY "Users can update personal or household visions" 
  ON vision_versions FOR UPDATE 
  USING (
    -- Personal visions
    (user_id = auth.uid())
    OR
    -- Household visions (any active member can edit)
    (household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() 
        AND status = 'active'
    ))
  )
  WITH CHECK (
    -- Same rules for the updated record
    (user_id = auth.uid())
    OR
    (household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() 
        AND status = 'active'
    ))
  );

-- DELETE: Delete personal visions OR household visions (admin only for household)
CREATE POLICY "Users can delete personal visions or admins can delete household visions" 
  ON vision_versions FOR DELETE 
  USING (
    -- Personal visions (anyone can delete their own)
    (user_id = auth.uid())
    OR
    -- Household visions (admin only)
    (household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() 
        AND status = 'active'
        AND role = 'admin'
    ))
  );


-- STEP 6: Update table comment
-- ---------------------------------------------------------------
COMMENT ON TABLE vision_versions IS 
  'Life vision versions. Can be personal (user_id) or shared household visions (household_id). Version numbers are calculated dynamically using get_vision_version_number() based on created_at order. Completion percentage is calculated in frontend based on filled fields.';


-- =================================================================
-- Migration Complete
-- =================================================================
-- Changes Summary:
-- 1. Added household_id column with foreign key to households table
-- 2. Made user_id nullable (to allow household-only visions)
-- 3. Added constraint ensuring vision belongs to user OR household (not both)
-- 4. Cleaned up duplicate RLS policies
-- 5. Created new RLS policies allowing household members to access household visions
-- 6. Household members can view/edit household visions
-- 7. Only household admins can delete household visions
--
-- Next Steps (Backend/Frontend):
-- - Update vision creation flow to handle household mode
-- - Update VIVA prompts to use perspective field
-- - Add household vision tab to /life-vision page
-- - Add "Create Personal/Household Vision" dropdown
-- =================================================================

