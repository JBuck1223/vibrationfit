-- Add household vision support WITHOUT touching existing functionality
-- Keep user_id NOT NULL, add household_id as optional field

-- Step 1: Add household_id column (nullable, optional)
ALTER TABLE vision_versions
  ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES households(id) ON DELETE CASCADE;

-- Step 2: Add index
CREATE INDEX IF NOT EXISTS idx_vision_versions_household_id 
  ON vision_versions(household_id);

-- Step 3: Add comments (non-breaking)
COMMENT ON COLUMN vision_versions.household_id IS 
  'NULL for personal visions. Set to household ID for shared household visions. user_id tracks the creator.';

-- Step 4: Add NEW policies for household access (don't drop existing ones!)
-- These SUPPLEMENT the existing policies, they don't replace them

-- Allow household members to SELECT household visions
CREATE POLICY "Household members can view household visions" 
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

-- Allow household members to INSERT household visions
CREATE POLICY "Household members can create household visions" 
  ON vision_versions FOR INSERT 
  WITH CHECK (
    user_id = auth.uid() 
    AND household_id IS NOT NULL 
    AND household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() 
        AND status = 'active'
    )
  );

-- Allow household members to UPDATE household visions
CREATE POLICY "Household members can edit household visions" 
  ON vision_versions FOR UPDATE 
  USING (
    household_id IS NOT NULL 
    AND household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() 
        AND status = 'active'
    )
  );

-- Allow household ADMINS to DELETE household visions
CREATE POLICY "Household admins can delete household visions" 
  ON vision_versions FOR DELETE 
  USING (
    household_id IS NOT NULL 
    AND household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() 
        AND status = 'active'
        AND role = 'admin'
    )
  );

-- Step 5: Update refinements function to include household visions
DROP FUNCTION IF EXISTS public.get_user_total_refinements(uuid);

CREATE FUNCTION public.get_user_total_refinements(p_user_id uuid) 
RETURNS TABLE(total_refinement_count integer, refined_category_list text[])
LANGUAGE plpgsql
AS $$
DECLARE
  total_count integer;
  all_categories text[];
BEGIN
  -- Count refinements from personal visions + household visions user has access to
  SELECT 
    COALESCE(SUM(jsonb_array_length(refined_categories)), 0)::integer
  INTO total_count
  FROM vision_versions
  WHERE (
    -- Personal visions
    (user_id = p_user_id AND (household_id IS NULL OR household_id IS NOT NULL))
    OR
    -- Household visions user can access
    (household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = p_user_id 
        AND status = 'active'
    ))
  )
  AND refined_categories IS NOT NULL
  AND jsonb_array_length(refined_categories) > 0;

  -- Get unique categories
  SELECT 
    ARRAY_AGG(DISTINCT elem ORDER BY elem)
  INTO all_categories
  FROM vision_versions,
       LATERAL jsonb_array_elements_text(refined_categories) AS elem
  WHERE (
    (user_id = p_user_id AND (household_id IS NULL OR household_id IS NOT NULL))
    OR
    (household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = p_user_id 
        AND status = 'active'
    ))
  )
  AND refined_categories IS NOT NULL
  AND jsonb_array_length(refined_categories) > 0;

  RETURN QUERY
  SELECT 
    COALESCE(total_count, 0)::integer,
    COALESCE(all_categories, ARRAY[]::text[]);
END;
$$;

COMMENT ON FUNCTION public.get_user_total_refinements(p_user_id uuid) IS 
  'Returns refinements from personal visions created by user AND household visions they can access.';

