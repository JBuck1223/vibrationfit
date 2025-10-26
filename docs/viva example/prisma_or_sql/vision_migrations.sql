-- Vision versions hardening
alter table public.vision_versions
  add constraint if not exists uq_vision_versions_user_version unique (user_id, version_number);

create index if not exists idx_vision_versions_user on public.vision_versions(user_id);
create index if not exists idx_vision_versions_created on public.vision_versions(created_at desc);

-- Provenance + derivation map (only if missing)
alter table public.vision_versions
  add column if not exists sources jsonb default '{}'::jsonb,
  add column if not exists derivation_map jsonb default '{}'::jsonb;

-- Vision audios normalized
create table if not exists public.vision_audios (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  vision_version_id uuid not null references public.vision_versions(id) on delete cascade,
  text_hash text not null,
  generation_params jsonb default '{}'::jsonb,
  provider text default 'internal',
  status text not null check (status in ('queued','generating','ready','failed')) default 'queued',
  error_message text,
  audio_url text,
  duration_seconds integer,
  loudness_lufs numeric,
  sample_rate_hz integer,
  transcript_url text,
  is_active boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists uq_active_audio_per_vision on public.vision_audios(vision_version_id) where (is_active);
create index if not exists idx_vision_audios_user on public.vision_audios(user_id, vision_version_id);
create index if not exists idx_vision_audios_status on public.vision_audios(status);
