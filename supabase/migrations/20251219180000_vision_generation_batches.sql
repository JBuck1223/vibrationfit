-- Vision Generation Batches - Persistent queue for category generation
-- Allows processing to continue in background regardless of page state

create table public.vision_generation_batches (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  
  -- Categories to process (all 12 by default)
  categories_requested text[] not null default array['fun','health','travel','love','family','social','home','work','money','stuff','giving','spirituality'],
  categories_completed text[] not null default '{}',
  categories_failed text[] not null default '{}',
  current_category text null,
  
  -- Status tracking
  status text not null default 'pending',
  error_message text null,
  retry_count integer not null default 0,
  
  -- Timestamps
  created_at timestamp with time zone not null default now(),
  started_at timestamp with time zone null,
  completed_at timestamp with time zone null,
  updated_at timestamp with time zone not null default now(),
  
  -- Result
  vision_id uuid null,
  
  -- Config
  perspective text not null default 'singular',
  metadata jsonb null default '{}',
  
  constraint vision_generation_batches_pkey primary key (id),
  constraint vision_generation_batches_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade,
  constraint vision_generation_batches_vision_id_fkey foreign key (vision_id) references vision_versions (id) on delete set null,
  constraint valid_status check (status in ('pending', 'processing', 'completed', 'partial_success', 'failed', 'retrying'))
);

-- Indexes for efficient queries
create index idx_vision_batches_user_status on vision_generation_batches (user_id, status);
create index idx_vision_batches_status_created on vision_generation_batches (status, created_at desc);
create index idx_vision_batches_processing on vision_generation_batches (status, updated_at) 
  where status in ('pending', 'processing', 'retrying');

-- Unique constraint: only one active batch per user
create unique index idx_vision_batches_user_active on vision_generation_batches (user_id) 
  where status in ('pending', 'processing', 'retrying');

-- Auto-update timestamp
create trigger update_vision_generation_batches_updated_at 
  before update on vision_generation_batches 
  for each row 
  execute function update_updated_at_column();

-- Add comment
comment on table vision_generation_batches is 'Persistent queue for Life Vision category generation. Allows background processing independent of page state.';

