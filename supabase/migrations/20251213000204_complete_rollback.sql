-- COMPLETE ROLLBACK: Remove ALL household changes and restore original state

-- Step 1: Drop ALL policies on vision_versions
DROP POLICY IF EXISTS "Users can view personal or household visions" ON vision_versions;
DROP POLICY IF EXISTS "Users can insert personal or household visions" ON vision_versions;
DROP POLICY IF EXISTS "Users can update personal or household visions" ON vision_versions;
DROP POLICY IF EXISTS "Users can delete personal visions or admins can delete household visions" ON vision_versions;
DROP POLICY IF EXISTS "Users can view own visions" ON vision_versions;
DROP POLICY IF EXISTS "Users can view their own vision versions" ON vision_versions;
DROP POLICY IF EXISTS "Users can insert own visions" ON vision_versions;
DROP POLICY IF EXISTS "Users can insert their own vision versions" ON vision_versions;
DROP POLICY IF EXISTS "Users can update own visions" ON vision_versions;
DROP POLICY IF EXISTS "Users can update their own vision versions" ON vision_versions;
DROP POLICY IF EXISTS "Users can delete own visions" ON vision_versions;
DROP POLICY IF EXISTS "Users can delete their own vision versions" ON vision_versions;

-- Step 2: Drop household_id column completely
ALTER TABLE vision_versions
  DROP COLUMN IF EXISTS household_id CASCADE;

-- Step 3: Ensure user_id is NOT NULL
ALTER TABLE vision_versions 
  ALTER COLUMN user_id SET NOT NULL;

-- Step 4: Recreate ORIGINAL RLS policies (exact match to COMPLETE_SCHEMA_DUMP.sql)
-- Note: Original has duplicates, we'll recreate them all

CREATE POLICY "Users can view own visions" 
  ON vision_versions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own vision versions" 
  ON vision_versions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own visions" 
  ON vision_versions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vision versions" 
  ON vision_versions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own visions" 
  ON vision_versions FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own vision versions" 
  ON vision_versions FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own visions" 
  ON vision_versions FOR DELETE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vision versions" 
  ON vision_versions FOR DELETE 
  USING (auth.uid() = user_id);

-- Step 5: Restore ORIGINAL refinements function
DROP FUNCTION IF EXISTS public.get_user_total_refinements(uuid);

CREATE FUNCTION public.get_user_total_refinements(p_user_id uuid) 
RETURNS TABLE(total_refinement_count integer, refined_category_list text[])
LANGUAGE plpgsql
AS $$
DECLARE
  total_count integer;
  all_categories text[];
BEGIN
  -- Sum the length of refined_categories arrays across all versions
  SELECT 
    COALESCE(SUM(jsonb_array_length(refined_categories)), 0)::integer
  INTO total_count
  FROM vision_versions
  WHERE user_id = p_user_id
    AND refined_categories IS NOT NULL
    AND jsonb_array_length(refined_categories) > 0;

  -- Get unique list of all categories that have been refined
  SELECT 
    ARRAY_AGG(DISTINCT elem ORDER BY elem)
  INTO all_categories
  FROM vision_versions,
       LATERAL jsonb_array_elements_text(refined_categories) AS elem
  WHERE user_id = p_user_id
    AND refined_categories IS NOT NULL
    AND jsonb_array_length(refined_categories) > 0;

  -- Return total count and list of all unique categories
  RETURN QUERY
  SELECT 
    COALESCE(total_count, 0)::integer,
    COALESCE(all_categories, ARRAY[]::text[]);
END;
$$;

COMMENT ON FUNCTION public.get_user_total_refinements(p_user_id uuid) IS 
  'Returns the total sum of all category refinements across all vision versions for a user. Each refined category in each version counts separately.';

-- Step 6: Restore original table comment
COMMENT ON TABLE vision_versions IS 
  'Life vision versions. Version numbers are calculated dynamically using get_vision_version_number() based on created_at order. Completion percentage is calculated in frontend based on filled fields.';

