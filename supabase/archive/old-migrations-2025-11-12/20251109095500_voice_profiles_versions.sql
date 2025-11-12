begin;

-- Ensure id primary key exists for versioning
alter table public.voice_profiles
  add column if not exists id uuid default gen_random_uuid();

-- Drop existing primary key on user_id if present
alter table public.voice_profiles
  drop constraint if exists voice_profiles_pkey;

-- Populate id for any rows missing it
update public.voice_profiles
set id = gen_random_uuid()
where id is null;

-- Set new primary key on id
alter table public.voice_profiles
  add constraint voice_profiles_pkey primary key (id);

-- Allow multiple rows per user, track active version
alter table public.voice_profiles
  add column if not exists is_active boolean default true;

-- Ensure user_id indexed for lookups
create index if not exists idx_voice_profiles_user_id on public.voice_profiles (user_id);

-- Guarantee only one active profile per user
create unique index if not exists idx_voice_profiles_user_active
  on public.voice_profiles (user_id)
  where is_active;

commit;
