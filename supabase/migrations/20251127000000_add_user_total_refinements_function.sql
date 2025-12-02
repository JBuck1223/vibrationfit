-- Function to calculate total unique category refinements across all versions for a user
CREATE OR REPLACE FUNCTION public.get_user_total_refinements(p_user_id uuid)
RETURNS TABLE (
  total_refinement_count integer,
  refined_category_list text[]
)
LANGUAGE plpgsql
AS $$
DECLARE
  all_categories text[];
  unique_categories text[];
BEGIN
  -- Collect all refined categories from all versions for this user
  SELECT ARRAY_AGG(DISTINCT elem)
  INTO unique_categories
  FROM vision_versions,
       LATERAL jsonb_array_elements_text(refined_categories) AS elem
  WHERE user_id = p_user_id
    AND refined_categories IS NOT NULL
    AND jsonb_array_length(refined_categories) > 0;

  -- Return count and list of unique refined categories
  RETURN QUERY
  SELECT 
    COALESCE(array_length(unique_categories, 1), 0)::integer,
    COALESCE(unique_categories, ARRAY[]::text[]);
END;
$$;

COMMENT ON FUNCTION public.get_user_total_refinements(p_user_id uuid) IS 
'Returns the total count of unique category refinements across all vision versions for a user. Returns both the count and the list of refined categories.';

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_total_refinements(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_total_refinements(uuid) TO service_role;



