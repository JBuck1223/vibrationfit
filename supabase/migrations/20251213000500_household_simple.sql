-- SIMPLE household support: Add ONE policy for household member access
-- Keep ALL existing policies unchanged
-- household_id is just a filter/tag, user_id tracks creator

-- Add ONE supplemental policy: Let household members access household visions
CREATE POLICY "household_members_can_access_household_visions" 
  ON vision_versions FOR ALL
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

-- That's it! No other changes needed.
-- Existing policies handle personal visions (user_id = auth.uid())
-- New policy handles household visions (household member access)




