-- Phase 1: additive public profile projection. Apply before deploying callers.
BEGIN;
-- Deliberately owner-executed: expose only community fields across members.
-- Keep private account fields on the RLS-protected base table.
CREATE VIEW public.member_public_profiles WITH (security_barrier = true) AS
SELECT id, first_name, last_name, full_name, profile_picture_url, cover_image_url,
       occupation, social_links, about_me, favorite_quote, created_at, role
FROM public.user_accounts;
REVOKE ALL ON public.member_public_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.member_public_profiles TO authenticated, service_role;
COMMIT;
