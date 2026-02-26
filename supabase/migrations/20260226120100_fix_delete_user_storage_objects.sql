-- Fix: delete_user_storage_objects was failing because storage.protect_delete
-- trigger blocks direct DELETE unless storage.allow_delete_query = 'true'

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
