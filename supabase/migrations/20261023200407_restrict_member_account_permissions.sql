-- Phase 2: apply only after the compatible application release is deployed.
BEGIN;
DROP POLICY IF EXISTS "Authenticated users can view basic profile info" ON public.user_accounts;

CREATE OR REPLACE FUNCTION public.protect_member_account_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  editable text[] := ARRAY['first_name','last_name','full_name','profile_picture_url',
    'phone','sms_opt_in','sms_opt_in_date','sms_opt_in_ip','email_opt_in',
    'date_of_birth','about_me','timezone','favorite_quote','updated_at','last_login_at',
    'song_publishing_agreement_accepted_at','song_publishing_agreement_version',
    'song_publishing_legal_name','shipping_line1','shipping_line2','shipping_city',
    'shipping_state','shipping_postal_code','shipping_country','theme_id','theme_overlay',
    'cover_image_url','occupation','social_links','allow_shared_tokens'];
BEGIN
  -- SECURITY INVOKER preserves service-role and trusted trigger operations.
  IF current_user IN ('anon','authenticated') AND NOT public.is_admin_account(auth.uid()) THEN
    IF (to_jsonb(NEW) - editable) IS DISTINCT FROM (to_jsonb(OLD) - editable) THEN
      RAISE EXCEPTION 'Account authority fields require administrator access' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.protect_member_account_fields() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER protect_member_account_fields BEFORE UPDATE ON public.user_accounts
FOR EACH ROW EXECUTE FUNCTION public.protect_member_account_fields();

-- Revoke the wrappers as well as the underlying grant: definer wrappers can
-- otherwise invoke the restricted function with their owner's privileges.
DO $$
DECLARE f record;
BEGIN
  FOR f IN SELECT p.oid::regprocedure AS signature FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname IN (
      'debug_delete_auth_user','prepare_user_for_deletion','delete_user_storage_objects',
      'grant_tokens_for_tier','grant_tokens_by_stripe_price_id','grant_annual_tokens',
      'grant_trial_tokens','drip_tokens_28day')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f.signature);
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', f.signature);
  END LOOP;
END $$;
DROP POLICY IF EXISTS "Service role can insert token transactions" ON public.token_transactions;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.token_transactions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.token_transactions TO authenticated;
GRANT ALL ON public.token_transactions TO service_role;
COMMIT;
