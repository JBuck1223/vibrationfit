begin;

alter table public.voice_profiles
  add column if not exists emotional_intensity_preference text,
  add column if not exists narrative_preference text,
  add column if not exists depth_preference text,
  add column if not exists last_refined_at timestamptz;

commit;
