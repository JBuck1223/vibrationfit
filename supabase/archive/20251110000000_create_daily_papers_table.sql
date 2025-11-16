begin;

create table if not exists public.daily_papers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  gratitude text not null default '',
  task_one text not null default '',
  task_two text not null default '',
  task_three text not null default '',
  fun_plan text not null default '',
  attachment_url text,
  attachment_key text,
  attachment_content_type text,
  attachment_size bigint,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_papers_user_entry_unique unique (user_id, entry_date)
);

create index if not exists idx_daily_papers_user_entry_date
  on public.daily_papers (user_id, entry_date desc);

drop trigger if exists trg_daily_papers_updated_at on public.daily_papers;
create trigger trg_daily_papers_updated_at
  before update on public.daily_papers
  for each row
  execute function public.set_updated_at();

alter table public.daily_papers enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'daily_papers'
      and policyname = 'Users can manage their daily papers'
  ) then
    create policy "Users can manage their daily papers" on public.daily_papers
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end$$;

commit;


