-- Fix the refinement count to properly sum array lengths without cross product
CREATE OR REPLACE FUNCTION public.get_user_total_refinements(p_user_id uuid)
RETURNS TABLE (
  total_refinement_count integer,
  refined_category_list text[]
)
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

  -- Return total count and list of all unique categories (for reference)
  RETURN QUERY
  SELECT 
    COALESCE(total_count, 0)::integer,
    COALESCE(all_categories, ARRAY[]::text[]);
END;
$$;

COMMENT ON FUNCTION public.get_user_total_refinements(p_user_id uuid) IS 
'Returns the total sum of all category refinements across all vision versions for a user. Each refined category in each version counts separately.';

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_total_refinements(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_total_refinements(uuid) TO service_role;



