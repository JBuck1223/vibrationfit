-- Add household support with CONSOLIDATED policies
-- Replace all existing policies with single policies that handle BOTH personal and household

-- Step 1: Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view own visions" ON vision_versions;
DROP POLICY IF EXISTS "Users can view their own vision versions" ON vision_versions;
DROP POLICY IF EXISTS "Users can insert own visions" ON vision_versions;
DROP POLICY IF EXISTS "Users can insert their own vision versions" ON vision_versions;
DROP POLICY IF EXISTS "Users can update own visions" ON vision_versions;
DROP POLICY IF EXISTS "Users can update their own vision versions" ON vision_versions;
DROP POLICY IF EXISTS "Users can delete own visions" ON vision_versions;
DROP POLICY IF EXISTS "Users can delete their own vision versions" ON vision_versions;

-- Step 2: Create CONSOLIDATED policies (one per operation)

-- SELECT: View personal OR household visions
CREATE POLICY "view_personal_or_household_visions" 
  ON vision_versions FOR SELECT 
  USING (
    (user_id = auth.uid())  -- Personal visions
    OR 
    (household_id IS NOT NULL AND household_id IN (  -- Household visions
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() AND status = 'active'
    ))
  );

-- INSERT: Create personal OR household visions
CREATE POLICY "insert_personal_or_household_visions" 
  ON vision_versions FOR INSERT 
  WITH CHECK (
    (user_id = auth.uid() AND household_id IS NULL)  -- Personal
    OR
    (user_id = auth.uid() AND household_id IN (  -- Household (as member)
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() AND status = 'active'
    ))
  );

-- UPDATE: Edit personal OR household visions
CREATE POLICY "update_personal_or_household_visions" 
  ON vision_versions FOR UPDATE 
  USING (
    (user_id = auth.uid())  -- Personal visions
    OR
    (household_id IS NOT NULL AND household_id IN (  -- Household visions
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() AND status = 'active'
    ))
  );

-- DELETE: Delete personal visions OR household visions (admin only)
CREATE POLICY "delete_personal_or_household_visions" 
  ON vision_versions FOR DELETE 
  USING (
    (user_id = auth.uid() AND household_id IS NULL)  -- Personal
    OR
    (household_id IS NOT NULL AND household_id IN (  -- Household (admin only)
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() AND status = 'active' AND role = 'admin'
    ))
  );

-- Step 3: Update refinements function to include household
DROP FUNCTION IF EXISTS public.get_user_total_refinements(uuid);

CREATE FUNCTION public.get_user_total_refinements(p_user_id uuid) 
RETURNS TABLE(total_refinement_count integer, refined_category_list text[])
LANGUAGE plpgsql
AS $$
DECLARE
  total_count integer;
  all_categories text[];
BEGIN
  -- Count from personal AND household visions
  SELECT 
    COALESCE(SUM(jsonb_array_length(refined_categories)), 0)::integer
  INTO total_count
  FROM vision_versions
  WHERE (
    user_id = p_user_id  -- All visions created by user
    OR
    (household_id IN (  -- Household visions user can access
      SELECT household_id 
      FROM household_members 
      WHERE user_id = p_user_id AND status = 'active'
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
    user_id = p_user_id
    OR
    (household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = p_user_id AND status = 'active'
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
  'Returns refinements from personal AND household visions.';

-- Step 4: Add helpful comments
COMMENT ON COLUMN vision_versions.household_id IS 
  'NULL = personal vision. Set = household vision (all household members can access).';




