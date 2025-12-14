-- CLEAN RESET: Remove household support and re-add it properly
-- This ensures user_id stays NOT NULL throughout

-- Step 1: Drop old RLS policies FIRST (before dropping column)
DROP POLICY IF EXISTS "Users can view personal or household visions" ON vision_versions;
DROP POLICY IF EXISTS "Users can insert personal or household visions" ON vision_versions;
DROP POLICY IF EXISTS "Users can update personal or household visions" ON vision_versions;
DROP POLICY IF EXISTS "Users can delete personal visions or admins can delete household visions" ON vision_versions;

-- Also drop the original policies that might still exist
DROP POLICY IF EXISTS "Users can view own visions" ON vision_versions;
DROP POLICY IF EXISTS "Users can view their own vision versions" ON vision_versions;
DROP POLICY IF EXISTS "Users can insert own visions" ON vision_versions;
DROP POLICY IF EXISTS "Users can insert their own vision versions" ON vision_versions;
DROP POLICY IF EXISTS "Users can update own visions" ON vision_versions;
DROP POLICY IF EXISTS "Users can update their own vision versions" ON vision_versions;
DROP POLICY IF EXISTS "Users can delete own visions" ON vision_versions;
DROP POLICY IF EXISTS "Users can delete their own vision versions" ON vision_versions;


-- Step 2: Drop household_id column (now policies are gone)
ALTER TABLE vision_versions
  DROP COLUMN IF EXISTS household_id CASCADE;

-- Step 3: Ensure user_id is NOT NULL
ALTER TABLE vision_versions 
  ALTER COLUMN user_id SET NOT NULL;

-- Step 4: Add household_id back (clean slate)
ALTER TABLE vision_versions
  ADD COLUMN household_id UUID REFERENCES households(id) ON DELETE CASCADE;

-- Step 5: Add index
CREATE INDEX IF NOT EXISTS idx_vision_versions_household_id 
  ON vision_versions(household_id);

-- Step 6: Add comments
COMMENT ON COLUMN vision_versions.user_id IS 
  'Creator/owner of the vision. Always set. For household visions, this is the person who created it.';

COMMENT ON COLUMN vision_versions.household_id IS 
  'NULL for personal visions. Set to household ID for shared household visions that all members can access.';

COMMENT ON TABLE vision_versions IS 
  'Life vision versions. user_id = creator (always set). household_id = NULL for personal, set for household visions.';

-- Step 7: Create NEW RLS policies supporting household
-- SELECT: Personal visions OR household visions where user is member
CREATE POLICY "Users can view personal or household visions" 
  ON vision_versions FOR SELECT 
  USING (
    -- Personal visions: I created it, no household
    (user_id = auth.uid() AND household_id IS NULL) 
    OR 
    -- Household visions: I'm an active member of the household
    (household_id IS NOT NULL AND household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() 
        AND status = 'active'
    ))
  );

-- INSERT: Create personal OR household visions
CREATE POLICY "Users can insert personal or household visions" 
  ON vision_versions FOR INSERT 
  WITH CHECK (
    -- Personal visions: I'm the creator, no household
    (user_id = auth.uid() AND household_id IS NULL)
    OR
    -- Household visions: I'm the creator AND active member of household
    (user_id = auth.uid() AND household_id IS NOT NULL AND household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() 
        AND status = 'active'
    ))
  );

-- UPDATE: Edit personal OR household visions
CREATE POLICY "Users can update personal or household visions" 
  ON vision_versions FOR UPDATE 
  USING (
    -- Personal visions: I created it
    (user_id = auth.uid() AND household_id IS NULL)
    OR
    -- Household visions: I'm an active member (any member can edit)
    (household_id IS NOT NULL AND household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() 
        AND status = 'active'
    ))
  );

-- DELETE: Delete personal visions OR household visions (admin only)
CREATE POLICY "Users can delete personal visions or admins can delete household visions" 
  ON vision_versions FOR DELETE 
  USING (
    -- Personal visions: I created it
    (user_id = auth.uid() AND household_id IS NULL)
    OR
    -- Household visions: I'm admin of the household
    (household_id IS NOT NULL AND household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() 
        AND status = 'active'
        AND role = 'admin'
    ))
  );

-- Step 8: Update refinements function
DROP FUNCTION IF EXISTS public.get_user_total_refinements(uuid);

CREATE FUNCTION public.get_user_total_refinements(p_user_id uuid) 
RETURNS TABLE(total_refinement_count integer, refined_category_list text[])
LANGUAGE plpgsql
AS $$
DECLARE
  total_count integer;
  all_categories text[];
BEGIN
  -- Count refinements in personal visions + household visions user has access to
  SELECT 
    COALESCE(SUM(jsonb_array_length(refined_categories)), 0)::integer
  INTO total_count
  FROM vision_versions
  WHERE (
    -- Personal visions I created
    (user_id = p_user_id AND household_id IS NULL)
    OR
    -- Household visions I have access to
    (household_id IS NOT NULL AND household_id IN (
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
    (user_id = p_user_id AND household_id IS NULL)
    OR
    (household_id IS NOT NULL AND household_id IN (
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
  'Returns total refinements across personal AND household visions. user_id always tracks creator.';

