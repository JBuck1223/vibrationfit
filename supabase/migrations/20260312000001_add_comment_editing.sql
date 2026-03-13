-- Add edited_at column to vibe_comments for tracking edits
ALTER TABLE public.vibe_comments
  ADD COLUMN edited_at timestamp with time zone;

COMMENT ON COLUMN public.vibe_comments.edited_at IS 'Timestamp when the comment was last edited. NULL means never edited.';
