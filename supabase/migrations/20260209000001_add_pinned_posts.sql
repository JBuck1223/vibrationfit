-- Migration: Add Pinned Posts Support
-- Created: 2026-02-09
-- Description: Add is_pinned column to vibe_posts for coaches to pin important posts

-- ============================================================================
-- ADD PINNED COLUMNS TO VIBE_POSTS
-- ============================================================================

-- Add is_pinned column with default false
ALTER TABLE vibe_posts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false;

-- Add pinned_at timestamp (when the post was pinned)
ALTER TABLE vibe_posts ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ;

-- Add pinned_by reference (who pinned the post)
ALTER TABLE vibe_posts ADD COLUMN IF NOT EXISTS pinned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ============================================================================
-- INDEX FOR EFFICIENT PINNED POST QUERIES
-- ============================================================================

-- Index for fetching pinned posts efficiently
CREATE INDEX IF NOT EXISTS idx_vibe_posts_pinned 
  ON vibe_posts(is_pinned, pinned_at DESC) 
  WHERE is_pinned = true AND is_deleted = false;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON COLUMN vibe_posts.is_pinned IS 'Whether this post is pinned to the top of the feed';
COMMENT ON COLUMN vibe_posts.pinned_at IS 'Timestamp when the post was pinned';
COMMENT ON COLUMN vibe_posts.pinned_by IS 'User ID of the admin/coach who pinned the post';
