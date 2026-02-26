-- Comprehensive fix: find ALL FK constraints referencing auth.users(id)
-- that have NO ACTION (the default, which blocks deletion), and convert
-- them to ON DELETE SET NULL.
--
-- This replaces the earlier partial fix (20260226130000) by catching
-- every constraint dynamically via pg_constraint instead of listing
-- them by hand.

DO $$
DECLARE
  r RECORD;
  fixed INT := 0;
BEGIN
  FOR r IN
    SELECT
      c.conrelid::regclass::text AS table_name,
      c.conname                  AS constraint_name,
      a.attname                  AS column_name
    FROM pg_constraint c
    JOIN pg_attribute a
      ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
    WHERE c.contype    = 'f'                          -- foreign keys only
      AND c.confrelid  = 'auth.users'::regclass       -- pointing at auth.users
      AND c.confdeltype = 'a'                          -- 'a' = NO ACTION (default / restrict)
  LOOP
    RAISE NOTICE 'Fixing %.% (constraint %)', r.table_name, r.column_name, r.constraint_name;
    EXECUTE format(
      'ALTER TABLE %s DROP CONSTRAINT %I', r.table_name, r.constraint_name
    );
    EXECUTE format(
      'ALTER TABLE %s ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES auth.users(id) ON DELETE SET NULL',
      r.table_name, r.constraint_name, r.column_name
    );
    fixed := fixed + 1;
  END LOOP;

  RAISE NOTICE 'Done. Fixed % FK constraint(s).', fixed;
END $$;

-- Runtime safety net: a callable function that nulls out any remaining
-- bare-FK references to a user before deleteUser() is called.
-- This handles edge cases where a future migration adds a bare FK.
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

  -- 2. Find and null out any FK columns referencing auth.users with NO ACTION
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
