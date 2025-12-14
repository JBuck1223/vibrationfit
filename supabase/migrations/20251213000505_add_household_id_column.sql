-- Step 1: Add household_id column to vision_versions
-- This is what was missing!

ALTER TABLE vision_versions
ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES households(id) ON DELETE SET NULL;

-- Create index for household lookups
CREATE INDEX IF NOT EXISTS idx_vision_versions_household_id 
ON vision_versions(household_id) 
WHERE household_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN vision_versions.household_id IS 'Optional household ID if this vision is shared with a household. NULL for personal visions.';

-- Now add the household access policies
-- These will work now that the column exists!

CREATE POLICY "Household members view household visions" 
  ON vision_versions FOR SELECT
  USING (
    household_id IS NOT NULL
    AND EXISTS (
      SELECT 1 
      FROM household_members 
      WHERE household_members.household_id = vision_versions.household_id
        AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Household members insert household visions" 
  ON vision_versions FOR INSERT
  WITH CHECK (
    household_id IS NOT NULL
    AND EXISTS (
      SELECT 1 
      FROM household_members 
      WHERE household_members.household_id = vision_versions.household_id
        AND household_members.user_id = auth.uid()
    )
  );

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

