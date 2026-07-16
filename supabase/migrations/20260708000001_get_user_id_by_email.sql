-- Targeted user lookup by email for checkout/webhook hot paths.
-- Replaces unpaginated auth.admin.listUsers() scans that degrade as the
-- user base grows (and silently miss users beyond the first page).
--
-- SECURITY DEFINER so it can read auth.users; execution is revoked from
-- anon/authenticated and granted only to service_role, which is the only
-- caller (Stripe webhook + checkout create-intent via admin client).

create or replace function public.get_user_id_by_email(p_email text)
returns uuid
language sql
security definer
set search_path = ''
stable
as $$
  select id
  from auth.users
  where lower(email) = lower(p_email)
    and deleted_at is null
  order by created_at asc
  limit 1;
$$;

revoke execute on function public.get_user_id_by_email(text) from public;
revoke execute on function public.get_user_id_by_email(text) from anon;
revoke execute on function public.get_user_id_by_email(text) from authenticated;
grant execute on function public.get_user_id_by_email(text) to service_role;
