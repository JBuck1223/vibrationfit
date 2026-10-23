-- Disposable PostgreSQL fixture only. Never run against an application database.
\set ON_ERROR_STOP on
CREATE ROLE anon;
CREATE ROLE authenticated;
CREATE ROLE service_role BYPASSRLS;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
$$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;
CREATE TABLE public.user_accounts (
 id uuid PRIMARY KEY, email text, first_name text, last_name text, full_name text,
 profile_picture_url text, cover_image_url text, occupation text, social_links jsonb,
 about_me text, favorite_quote text, created_at timestamptz DEFAULT now(),
 updated_at timestamptz DEFAULT now(), role text DEFAULT 'member',
 household_id uuid, is_household_admin boolean DEFAULT false, membership_tier_id uuid,
 is_active boolean DEFAULT true, comped_access boolean DEFAULT false,
 phone text, shipping_line1 text, date_of_birth date, allow_shared_tokens boolean DEFAULT false,
 future_protected_field text
);
CREATE FUNCTION public.is_admin_account(check_user_id uuid DEFAULT auth.uid()) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS
$$ SELECT EXISTS(SELECT 1 FROM user_accounts WHERE id=check_user_id AND role IN ('admin','super_admin')) $$;
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.user_accounts TO anon, authenticated, service_role;
CREATE POLICY "Users can view own account" ON public.user_accounts FOR SELECT USING(id=auth.uid());
CREATE POLICY "Users can update own account" ON public.user_accounts FOR UPDATE USING(id=auth.uid()) WITH CHECK(id=auth.uid());
CREATE POLICY "Admins can view all accounts" ON public.user_accounts FOR SELECT USING(public.is_admin_account());
CREATE POLICY "Admins can update accounts" ON public.user_accounts FOR UPDATE USING(public.is_admin_account());
CREATE POLICY "Authenticated users can view basic profile info" ON public.user_accounts FOR SELECT TO authenticated USING(true);
CREATE TABLE public.token_transactions(id int GENERATED ALWAYS AS IDENTITY, user_id uuid, tokens_used int);
GRANT ALL ON public.token_transactions TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can insert token transactions" ON public.token_transactions FOR INSERT WITH CHECK(true);
CREATE POLICY "Users can view own token transactions" ON public.token_transactions FOR SELECT USING(user_id=auth.uid());
CREATE FUNCTION public.grant_tokens_for_tier(uuid,uuid,uuid DEFAULT NULL) RETURNS int LANGUAGE sql SECURITY DEFINER AS $$ SELECT 1 $$;
CREATE FUNCTION public.grant_tokens_by_stripe_price_id(uuid,text,uuid DEFAULT NULL) RETURNS int LANGUAGE sql SECURITY DEFINER AS $$ SELECT 1 $$;
CREATE FUNCTION public.grant_annual_tokens(uuid,uuid) RETURNS int LANGUAGE sql SECURITY DEFINER AS $$ SELECT 1 $$;
CREATE FUNCTION public.grant_trial_tokens(uuid,uuid DEFAULT NULL) RETURNS int LANGUAGE sql SECURITY DEFINER AS $$ SELECT 1 $$;
CREATE FUNCTION public.drip_tokens_28day(uuid,uuid,integer DEFAULT 1) RETURNS int LANGUAGE sql SECURITY DEFINER AS $$ SELECT 1 $$;
CREATE FUNCTION public.debug_delete_auth_user(uuid) RETURNS int LANGUAGE sql SECURITY DEFINER AS $$ SELECT 1 $$;
CREATE FUNCTION public.prepare_user_for_deletion(uuid) RETURNS int LANGUAGE sql SECURITY DEFINER AS $$ SELECT 1 $$;
CREATE FUNCTION public.delete_user_storage_objects(uuid) RETURNS int LANGUAGE sql SECURITY DEFINER AS $$ SELECT 1 $$;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
INSERT INTO public.user_accounts(id,email,full_name,role) VALUES
('00000000-0000-0000-0000-000000000001','member@example.test','Member','member'),
('00000000-0000-0000-0000-000000000002','other@example.test','Other','member'),
('00000000-0000-0000-0000-000000000003','admin@example.test','Admin','admin');
\ir ../../supabase/migrations/20261023200319_secure_member_account_permissions.sql
\ir ../../supabase/migrations/20261023200407_restrict_member_account_permissions.sql
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
DO $$
DECLARE n int; column_name text;
BEGIN
 SELECT count(*) INTO n FROM public.user_accounts;
 IF n <> 1 THEN RAISE EXCEPTION 'Private accounts exposed'; END IF;
 SELECT count(*) INTO n FROM public.member_public_profiles;
 IF n <> 3 THEN RAISE EXCEPTION 'Community profiles unavailable'; END IF;
 BEGIN
   EXECUTE 'SELECT email FROM public.member_public_profiles';
   RAISE EXCEPTION 'Private email exposed in view';
 EXCEPTION WHEN undefined_column THEN NULL; END;
 UPDATE public.user_accounts SET first_name='Updated',phone='555',shipping_line1='Address',allow_shared_tokens=true WHERE id=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Legitimate profile update blocked'; END IF;
 FOREACH column_name IN ARRAY ARRAY['role','email','future_protected_field'] LOOP
  BEGIN
   EXECUTE format('UPDATE public.user_accounts SET %I = %L WHERE id=auth.uid()',column_name,'admin');
   RAISE EXCEPTION 'Protected text column allowed: %',column_name;
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 END LOOP;
 FOREACH column_name IN ARRAY ARRAY['comped_access','is_household_admin','is_active'] LOOP
  BEGIN
   EXECUTE format('UPDATE public.user_accounts SET %I = NOT %I WHERE id=auth.uid()',column_name,column_name);
   RAISE EXCEPTION 'Protected boolean allowed: %',column_name;
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 END LOOP;
 BEGIN
  UPDATE public.user_accounts SET membership_tier_id='00000000-0000-0000-0000-000000000002' WHERE id=auth.uid();
  RAISE EXCEPTION 'Membership mutation allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  INSERT INTO public.token_transactions(user_id,tokens_used) VALUES(auth.uid(),999999);
  RAISE EXCEPTION 'Token forgery allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  UPDATE public.member_public_profiles SET role='admin' WHERE id=auth.uid();
  RAISE EXCEPTION 'View update bypass allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
DO $$
DECLARE f record;
BEGIN
 FOR f IN SELECT p.oid,p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('grant_tokens_for_tier','grant_tokens_by_stripe_price_id','grant_annual_tokens','grant_trial_tokens','drip_tokens_28day','debug_delete_auth_user','prepare_user_for_deletion','delete_user_storage_objects') LOOP
  IF has_function_privilege('anon',f.oid,'EXECUTE') OR has_function_privilege('authenticated',f.oid,'EXECUTE') THEN RAISE EXCEPTION 'Public RPC access remains: %',f.proname; END IF;
  IF NOT has_function_privilege('service_role',f.oid,'EXECUTE') THEN RAISE EXCEPTION 'Service RPC access lost: %',f.proname; END IF;
 END LOOP;
 IF has_table_privilege('anon','public.member_public_profiles','SELECT') THEN RAISE EXCEPTION 'Anonymous profile access'; END IF;
END $$;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
UPDATE public.user_accounts SET membership_tier_id='00000000-0000-0000-0000-000000000002' WHERE id='00000000-0000-0000-0000-000000000001';
RESET ROLE;
SET ROLE service_role;
UPDATE public.user_accounts SET comped_access=true WHERE id='00000000-0000-0000-0000-000000000001';
INSERT INTO public.token_transactions(user_id,tokens_used) VALUES('00000000-0000-0000-0000-000000000001',100);
SELECT public.grant_trial_tokens('00000000-0000-0000-0000-000000000001',NULL);
RESET ROLE;
SELECT 'PASS: account isolation, profile reads/edits, protected fields, RPC ACLs, token writes, admin/service operations' AS result;
