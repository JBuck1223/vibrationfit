begin;

create table if not exists public.voice_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  word_flow text not null,
  emotional_range text not null,
  detail_level text not null,
  energy_tempo text not null,
  woo_level smallint not null check (woo_level between 1 and 3),
  humor_personality text not null,
  speech_rhythm text not null,
  style_label text,
  forbidden_styles text[],
  sample_phrases text[],
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_voice_profiles_updated_at on public.voice_profiles;
create trigger trg_voice_profiles_updated_at
  before update on public.voice_profiles
  for each row
  execute function public.set_updated_at();

alter table public.voice_profiles enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'voice_profiles'
      and policyname = 'Users can manage their voice profile'
  ) then
    create policy "Users can manage their voice profile" on public.voice_profiles
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end$$;

commit;
