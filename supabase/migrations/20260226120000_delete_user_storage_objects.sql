-- Migration: Add function to delete Supabase Storage objects owned by a user
-- Required before auth.admin.deleteUser() - Supabase blocks user deletion if they own storage objects

CREATE OR REPLACE FUNCTION public.delete_user_storage_objects(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = storage, public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Supabase storage.protect_delete trigger blocks direct DELETE unless this is set
  PERFORM set_config('storage.allow_delete_query', 'true', true);
  DELETE FROM storage.objects WHERE owner = p_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.delete_user_storage_objects(p_user_id uuid) 
IS 'Deletes all Supabase Storage objects owned by the user. Must be called before auth.admin.deleteUser() to avoid FK constraint violation.';

GRANT EXECUTE ON FUNCTION public.delete_user_storage_objects(uuid) TO service_role;
