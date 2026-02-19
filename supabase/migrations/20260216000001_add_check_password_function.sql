-- Migration: Add check_user_has_password() RPC function
-- Purpose: Allows the client to check whether the current authenticated user
--          has set a password, by inspecting auth.users.encrypted_password.
--          This is more reliable than the user_metadata.has_password flag,
--          which is only set when users go through the setup-password flow.

CREATE OR REPLACE FUNCTION public.check_user_has_password()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  has_pw boolean;
BEGIN
  SELECT (encrypted_password IS NOT NULL AND encrypted_password != '')
  INTO has_pw
  FROM auth.users
  WHERE id = auth.uid();

  RETURN COALESCE(has_pw, false);
END;
$$;

-- Only authenticated users can call this function (checks their own password status)
REVOKE ALL ON FUNCTION public.check_user_has_password() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_user_has_password() TO authenticated;
