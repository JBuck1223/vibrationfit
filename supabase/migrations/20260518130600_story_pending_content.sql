-- Add pending_content and pending_title columns to stories table
-- These hold proposed updates until the user commits or discards them.

ALTER TABLE public.stories
  ADD COLUMN pending_content text,
  ADD COLUMN pending_title text;

COMMENT ON COLUMN public.stories.pending_content IS 'Holds proposed story content during update flow until user commits or discards';
COMMENT ON COLUMN public.stories.pending_title IS 'Holds proposed story title during update flow until user commits or discards';
