-- Migration: Change storage quota calculation from SUM to MAX
-- 
-- When a user has both an intensive grant and a subscription grant,
-- they should see the higher of the two (not the sum).

CREATE OR REPLACE FUNCTION public.get_user_storage_quota(p_user_id uuid) 
RETURNS TABLE(total_quota_gb integer)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(MAX(quota_gb), 0)::INTEGER as total_quota_gb
  FROM user_storage
  WHERE user_id = p_user_id;
END;
$$;

COMMENT ON FUNCTION public.get_user_storage_quota(p_user_id uuid) 
IS 'Returns storage quota for user (highest active grant). Usage calculated from S3.';
