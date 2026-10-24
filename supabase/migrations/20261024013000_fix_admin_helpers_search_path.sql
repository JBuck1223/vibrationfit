-- Member updates to user_accounts fail with: relation "user_accounts" does not exist.
--
-- 20261023200407 added the protect_member_account_fields trigger, which runs
-- with SET search_path = '' and calls public.is_admin_account(). That helper
-- (and its siblings) referenced user_accounts unqualified and had no
-- search_path of its own, so inside the trigger it inherited the empty path
-- and the lookup failed; every member save on user_accounts (theme, overlay,
-- profile fields) errored. Called directly, with PostgREST's search_path of
-- public, it worked, which is why reads never showed the problem.
--
-- Qualify the table and pin the search_path so these helpers behave the same
-- from any caller. Signatures and semantics are unchanged.
BEGIN;

CREATE OR REPLACE FUNCTION public.is_admin_account(check_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_accounts
    WHERE id = check_user_id AND role IN ('admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin_account(check_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_accounts
    WHERE id = check_user_id AND role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_accounts
    WHERE id = user_id AND role IN ('admin', 'super_admin')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_accounts
    WHERE id = user_id AND role = 'super_admin'
  );
END;
$$;

COMMIT;
