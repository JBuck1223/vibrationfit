-- Add edited_at column to vibe_comments for tracking comment edits
ALTER TABLE public.vibe_comments
  ADD COLUMN IF NOT EXISTS edited_at timestamp with time zone;
