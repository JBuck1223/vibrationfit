-- Life Vision Creation Agent: Database Schema
-- Supports AI-powered conversational vision creation across 12 life categories

-- =====================================================================
-- 1. VISION CONVERSATIONS TABLE
-- =====================================================================
-- Stores individual category conversations between user and AI agent
create table if not exists public.vision_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vision_id uuid not null references public.vision_versions(id) on delete cascade,
  category text not null,
  path_chosen text,
  messages jsonb not null default '[]'::jsonb,
  vibrational_state text,
  final_emotion_score integer,
  generated_vision text,
  vision_generated_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(vision_id, category)
);

-- Add index for faster queries
create index if not exists idx_vision_conversations_user_id on public.vision_conversations(user_id);
create index if not exists idx_vision_conversations_vision_id on public.vision_conversations(vision_id);
create index if not exists idx_vision_conversations_category on public.vision_conversations(category);

-- =====================================================================
-- 2. VISION PROGRESS TABLE
-- =====================================================================
create table if not exists public.vision_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vision_id uuid not null references public.vision_versions(id) on delete cascade,
  categories_completed text[] not null default '{}'::text[],
  current_category text,
  total_categories integer not null default 12,
  last_activity timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  unique(vision_id)
);

-- Add index for faster queries
create index if not exists idx_vision_progress_user_id on public.vision_progress(user_id);
create index if not exists idx_vision_progress_vision_id on public.vision_progress(vision_id);

-- =====================================================================
-- 3. UPDATE VISION_VERSIONS TABLE
-- =====================================================================
-- Add fields to support AI-generated content and conversation metadata
alter table public.vision_versions
  add column if not exists ai_generated boolean default false,
  add column if not exists conversation_count integer default 0,
  add column if not exists emotional_patterns jsonb default '{}'::jsonb,
  add column if not exists cross_category_themes text[] default '{}'::text[];

-- Add comment for documentation
comment on column public.vision_versions.ai_generated is 'Whether this vision was created through AI conversation agent';
comment on column public.vision_versions.conversation_count is 'Number of category conversations completed';
comment on column public.vision_versions.emotional_patterns is 'Detected emotional patterns across categories';
comment on column public.vision_versions.cross_category_themes is 'Recurring themes identified across multiple categories';

-- =====================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

-- Enable RLS on new tables
alter table public.vision_conversations enable row level security;
alter table public.vision_progress enable row level security;

-- vision_conversations policies
create policy "Users can view their own conversations"
  on public.vision_conversations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own conversations"
  on public.vision_conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own conversations"
  on public.vision_conversations for update
  using (auth.uid() = user_id);

create policy "Users can delete their own conversations"
  on public.vision_conversations for delete
  using (auth.uid() = user_id);

-- vision_progress policies
create policy "Users can view their own progress"
  on public.vision_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert their own progress"
  on public.vision_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own progress"
  on public.vision_progress for update
  using (auth.uid() = user_id);

create policy "Users can delete their own progress"
  on public.vision_progress for delete
  using (auth.uid() = user_id);

-- =====================================================================
-- 5. HELPER FUNCTIONS
-- =====================================================================

-- Function to update vision progress when a category is completed
create or replace function public.update_vision_progress_on_completion()
returns trigger as $$
begin
  -- Only proceed if conversation was just completed
  if new.completed_at is not null and (old.completed_at is null or old.completed_at is distinct from new.completed_at) then
    -- Update vision_progress
    update public.vision_progress
    set 
      categories_completed = array_append(
        array_remove(categories_completed, new.category), 
        new.category
      ),
      last_activity = now(),
      completed_at = case 
        when array_length(array_append(array_remove(categories_completed, new.category), new.category), 1) = total_categories 
        then now() 
        else null 
      end
    where vision_id = new.vision_id;
    
    -- Update vision_versions conversation count
    update public.vision_versions
    set conversation_count = (
      select count(*) 
      from public.vision_conversations 
      where vision_id = new.vision_id and completed_at is not null
    )
    where id = new.vision_id;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for automatic progress updates
-- Note: Using IF EXISTS to safely handle re-runs of this migration
do $$
begin
  if exists (select 1 from pg_trigger where tgname = 'on_conversation_completed') then
    drop trigger on_conversation_completed on public.vision_conversations;
  end if;
end $$;

create trigger on_conversation_completed
  after update on public.vision_conversations
  for each row
  execute function public.update_vision_progress_on_completion();

-- Function to initialize vision progress when vision is created
create or replace function public.initialize_vision_progress()
returns trigger as $$
begin
  insert into public.vision_progress (user_id, vision_id, total_categories)
  values (new.user_id, new.id, 12)
  on conflict (vision_id) do nothing;
  
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to auto-initialize progress
-- Note: Using IF EXISTS to safely handle re-runs of this migration
do $$
begin
  if exists (select 1 from pg_trigger where tgname = 'on_vision_created') then
    drop trigger on_vision_created on public.vision_versions;
  end if;
end $$;

create trigger on_vision_created
  after insert on public.vision_versions
  for each row
  execute function public.initialize_vision_progress();

-- =====================================================================
-- 6. GRANT PERMISSIONS
-- =====================================================================

grant usage on schema public to authenticated;
grant all on public.vision_conversations to authenticated;
grant all on public.vision_progress to authenticated;
