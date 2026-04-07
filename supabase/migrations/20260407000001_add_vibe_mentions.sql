-- Migration: Vibe Tribe Mentions
-- Created: 2026-04-07
-- Description: Tracks @mentions in vibe tribe posts and comments

CREATE TABLE IF NOT EXISTS vibe_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES vibe_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES vibe_comments(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentioned_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT vibe_mentions_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

CREATE INDEX idx_vibe_mentions_mentioned_user ON vibe_mentions(mentioned_user_id);
CREATE INDEX idx_vibe_mentions_post ON vibe_mentions(post_id) WHERE post_id IS NOT NULL;
CREATE INDEX idx_vibe_mentions_comment ON vibe_mentions(comment_id) WHERE comment_id IS NOT NULL;

ALTER TABLE vibe_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read mentions"
  ON vibe_mentions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own mentions"
  ON vibe_mentions FOR INSERT
  TO authenticated
  WITH CHECK (mentioned_by_user_id = auth.uid());

CREATE POLICY "Users can delete their own mentions"
  ON vibe_mentions FOR DELETE
  TO authenticated
  USING (mentioned_by_user_id = auth.uid());
