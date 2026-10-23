-- Member access: who may use the member app, and when Vibe Tribe opens.
--
-- Members are: admins, super admins and coaches; accounts given complimentary
-- access; anyone with an active, trialing or past-due subscription, or a
-- canceled one until its paid period ends; and active members of a paying
-- household. Free accounts (Free Activation) are not members.
--
-- Vibe Tribe opens for a member once Getting Started reaches its step (every
-- step before it is done), once Getting Started is complete, or for
-- established members who predate Getting Started (no progress row, but a
-- committed Life Vision). Reading Vibe Tribe needs membership; posting,
-- commenting and hearting need the step to be open.

alter table public.user_accounts
  add column if not exists comped_access boolean not null default false;

comment on column public.user_accounts.comped_access is
  'Complimentary member access without a subscription (family, partners).';

create or replace function public.has_member_access(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  -- A signed-in user may only ask about themselves; the service role may
  -- ask about anyone (sign-in redirects use it).
  select uid is not null
    and (uid = auth.uid() or auth.role() = 'service_role')
    and (
    exists (
      select 1 from public.user_accounts ua
      where ua.id = uid
        and (ua.role in ('admin', 'super_admin', 'coach') or ua.comped_access)
    )
    or exists (
      select 1 from public.customer_subscriptions cs
      where cs.user_id = uid
        and (
          cs.status in ('active', 'trialing', 'past_due')
          or (cs.status = 'canceled' and cs.current_period_end > now())
        )
    )
    or exists (
      select 1
      from public.household_members hm
      join public.households h on h.id = hm.household_id
      where hm.user_id = uid
        and hm.status = 'active'
        and h.subscription_status in ('active', 'trialing', 'past_due')
    )
  )
$$;

create or replace function public.vibe_tribe_unlocked(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_member_access(uid) and (
    exists (
      select 1 from public.user_accounts ua
      where ua.id = uid and ua.role in ('admin', 'super_admin', 'coach')
    )
    or exists (
      select 1 from public.life_activation_progress p
      where p.user_id = uid
        and (
          p.onboarding_completed_at is not null
          or p.onboarding ? 'complete'
          or p.onboarding ? 'tribe'
          -- Steps 1-6 (welcome, intake, world, vision, kit, voice); "world" is
          -- inferred from later steps for older rows, so it is not required.
          or p.onboarding ?& array['welcome', 'intake', 'vision', 'kit', 'voice']
        )
    )
    or (
      not exists (select 1 from public.life_activation_progress p where p.user_id = uid)
      and exists (
        select 1 from public.vision_versions v
        where v.user_id = uid and v.is_active and not v.is_draft and v.household_id is null
      )
    )
  )
$$;

revoke all on function public.has_member_access(uuid) from public, anon;
revoke all on function public.vibe_tribe_unlocked(uuid) from public, anon;
grant execute on function public.has_member_access(uuid) to authenticated, service_role;
grant execute on function public.vibe_tribe_unlocked(uuid) to authenticated, service_role;

-- Vibe Tribe: members read; members whose step is open write.
drop policy if exists "Anyone can view non-deleted posts" on public.vibe_posts;
create policy "Members can view non-deleted posts" on public.vibe_posts
  for select to authenticated
  using (is_deleted = false and (select public.has_member_access(auth.uid())));

drop policy if exists "Authenticated users can create posts" on public.vibe_posts;
create policy "Members with Vibe Tribe open can create posts" on public.vibe_posts
  for insert to authenticated
  with check (auth.uid() = user_id and (select public.vibe_tribe_unlocked(auth.uid())));

drop policy if exists "Anyone can view non-deleted comments" on public.vibe_comments;
create policy "Members can view non-deleted comments" on public.vibe_comments
  for select to authenticated
  using (is_deleted = false and (select public.has_member_access(auth.uid())));

drop policy if exists "Authenticated users can create comments" on public.vibe_comments;
create policy "Members with Vibe Tribe open can create comments" on public.vibe_comments
  for insert to authenticated
  with check (auth.uid() = user_id and (select public.vibe_tribe_unlocked(auth.uid())));

drop policy if exists "Anyone can view hearts" on public.vibe_hearts;
create policy "Members can view hearts" on public.vibe_hearts
  for select to authenticated
  using ((select public.has_member_access(auth.uid())));

drop policy if exists "Authenticated users can add hearts" on public.vibe_hearts;
create policy "Members with Vibe Tribe open can add hearts" on public.vibe_hearts
  for insert to authenticated
  with check (auth.uid() = user_id and (select public.vibe_tribe_unlocked(auth.uid())));
