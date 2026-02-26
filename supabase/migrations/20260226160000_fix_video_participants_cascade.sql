-- Fix: video_session_participants has CHECK (user_id IS NOT NULL OR email IS NOT NULL)
-- which conflicts with ON DELETE SET NULL when participant has no email.
-- Change to CASCADE -- a participant row without a user is meaningless.

ALTER TABLE public.video_session_participants
  DROP CONSTRAINT IF EXISTS video_session_participants_user_id_fkey;

ALTER TABLE public.video_session_participants
  ADD CONSTRAINT video_session_participants_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update prepare_user_for_deletion to also handle this edge case at runtime
CREATE OR REPLACE FUNCTION public.prepare_user_for_deletion(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, storage
AS $$
DECLARE
  r RECORD;
  result jsonb := '[]'::jsonb;
  row_count int;
BEGIN
  -- 1. Delete Supabase Storage objects owned by this user
  PERFORM set_config('storage.allow_delete_query', 'true', true);
  DELETE FROM storage.objects WHERE owner = p_user_id;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  result := result || jsonb_build_object('step', 'storage_objects', 'deleted', row_count);

  -- 2. Delete rows where SET NULL would violate a CHECK constraint
  DELETE FROM video_session_participants WHERE user_id = p_user_id AND email IS NULL;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  result := result || jsonb_build_object('step', 'video_session_participants', 'deleted', row_count);

  -- 3. Find and null out any FK columns referencing auth.users with NO ACTION
  FOR r IN
    SELECT
      c.conrelid::regclass::text AS table_name,
      a.attname                  AS column_name
    FROM pg_constraint c
    JOIN pg_attribute a
      ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
    WHERE c.contype    = 'f'
      AND c.confrelid  = 'auth.users'::regclass
      AND c.confdeltype = 'a'
  LOOP
    EXECUTE format(
      'UPDATE %s SET %I = NULL WHERE %I = $1',
      r.table_name, r.column_name, r.column_name
    ) USING p_user_id;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    result := result || jsonb_build_object(
      'step', r.table_name || '.' || r.column_name,
      'nulled', row_count
    );
  END LOOP;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.prepare_user_for_deletion(uuid) TO service_role;
