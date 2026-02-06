-- Migration: Add threading support to vibe_comments
-- Description: Adds parent_comment_id column to enable nested comment replies

-- Add parent_comment_id column for threading
ALTER TABLE public.vibe_comments
ADD COLUMN parent_comment_id UUID REFERENCES public.vibe_comments(id) ON DELETE CASCADE;

-- Add index for efficient querying of replies
CREATE INDEX idx_vibe_comments_parent_id ON public.vibe_comments(parent_comment_id);

-- Add comment explaining the column
COMMENT ON COLUMN public.vibe_comments.parent_comment_id IS 'Reference to parent comment for threaded replies. NULL means top-level comment on post.';
