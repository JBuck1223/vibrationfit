-- Temporary diagnostic function: tries to delete from auth.users directly
-- and returns the actual Postgres error message with the constraint name.
-- Remove after debugging is complete.

CREATE OR REPLACE FUNCTION public.debug_delete_auth_user(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, storage
AS $$
DECLARE
  fk_info jsonb := '[]'::jsonb;
  r RECORD;
BEGIN
  -- First, report all FK constraints pointing at auth.users for this user
  FOR r IN
    SELECT
      c.conrelid::regclass::text AS table_name,
      c.conname                  AS constraint_name,
      a.attname                  AS column_name,
      CASE c.confdeltype
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT'
      END AS on_delete
    FROM pg_constraint c
    JOIN pg_attribute a
      ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
    WHERE c.contype   = 'f'
      AND c.confrelid = 'auth.users'::regclass
    ORDER BY c.conrelid::regclass::text
  LOOP
    fk_info := fk_info || jsonb_build_object(
      'table', r.table_name,
      'constraint', r.constraint_name,
      'column', r.column_name,
      'on_delete', r.on_delete
    );
  END LOOP;

  -- Now try the actual delete and catch the error
  BEGIN
    DELETE FROM auth.users WHERE id = p_user_id;
    RETURN jsonb_build_object(
      'success', true,
      'message', 'User deleted successfully',
      'fk_constraints', fk_info
    );
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_message', SQLERRM,
      'error_detail', SQLSTATE,
      'fk_constraints', fk_info
    );
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.debug_delete_auth_user(uuid) TO service_role;
