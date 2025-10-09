begin;

-- Add recording storage fields to user_profiles
-- Stores recordings as JSONB array with metadata

alter table public.user_profiles
  add column if not exists story_recordings jsonb default '[]'::jsonb not null;

comment on column public.user_profiles.story_recordings is 
  'Array of story recordings with metadata: [{ url, transcript, type, category, created_at }]';

-- Example structure:
-- [
--   {
--     "url": "https://media.vibrationfit.com/user-uploads/.../recording.webm",
--     "transcript": "This is my health story...",
--     "type": "audio" | "video",
--     "category": "health_vitality" | "romance_partnership" | etc,
--     "duration": 120,
--     "created_at": "2025-01-19T12:00:00Z"
--   }
-- ]

commit;

