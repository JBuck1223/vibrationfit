-- Migration: Vibe Tribe Community System
-- Created: 2026-02-02
-- Description: Community feed with posts, comments, hearts, and user stats
-- 
-- WHAT THIS DOES:
-- 1. Creates vibe_tag enum for post categorization (win, wobble, vision, practice)
-- 2. Creates vibe_posts table for community posts with media support
-- 3. Creates vibe_comments table for post comments
-- 4. Creates vibe_hearts table for likes on posts/comments
-- 5. Creates user_community_stats table for aggregated user stats
-- 6. Adds RLS policies and triggers for count management

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Vibe tag for categorizing posts
CREATE TYPE vibe_tag AS ENUM ('win', 'wobble', 'vision', 'collaboration');

-- Media type for posts
CREATE TYPE vibe_media_type AS ENUM ('none', 'image', 'video', 'mixed');

-- ============================================================================
-- VIBE POSTS - Main community posts table
-- ============================================================================
CREATE TABLE IF NOT EXISTS vibe_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Author
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Content
  content TEXT,
  media_urls JSONB DEFAULT '[]'::jsonb,
  media_type vibe_media_type NOT NULL DEFAULT 'none',
  
  -- Categorization (required)
  vibe_tag vibe_tag NOT NULL,
  
  -- Optional life vision categories (health, wealth, relationships, etc.)
  life_categories TEXT[] DEFAULT '{}',
  
  -- Denormalized counts (updated by triggers)
  hearts_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  
  -- Soft delete for moderation
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT vibe_posts_has_content CHECK (
    content IS NOT NULL AND content != '' OR 
    jsonb_array_length(media_urls) > 0
  )
);

-- Indexes for vibe_posts
CREATE INDEX idx_vibe_posts_user_id ON vibe_posts(user_id);
CREATE INDEX idx_vibe_posts_vibe_tag ON vibe_posts(vibe_tag);
CREATE INDEX idx_vibe_posts_created_at ON vibe_posts(created_at DESC);
CREATE INDEX idx_vibe_posts_not_deleted ON vibe_posts(is_deleted) WHERE is_deleted = false;
CREATE INDEX idx_vibe_posts_tag_created ON vibe_posts(vibe_tag, created_at DESC) WHERE is_deleted = false;

-- Trigger for updated_at
CREATE TRIGGER set_vibe_posts_updated_at
  BEFORE UPDATE ON vibe_posts
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- VIBE COMMENTS - Comments on posts
-- ============================================================================
CREATE TABLE IF NOT EXISTS vibe_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  post_id UUID NOT NULL REFERENCES vibe_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Content (text only, no media)
  content TEXT NOT NULL,
  
  -- Denormalized count (updated by trigger)
  hearts_count INTEGER NOT NULL DEFAULT 0,
  
  -- Soft delete for moderation
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT vibe_comments_content_not_empty CHECK (content != '')
);

-- Indexes for vibe_comments
CREATE INDEX idx_vibe_comments_post_id ON vibe_comments(post_id);
CREATE INDEX idx_vibe_comments_user_id ON vibe_comments(user_id);
CREATE INDEX idx_vibe_comments_created_at ON vibe_comments(created_at DESC);
CREATE INDEX idx_vibe_comments_not_deleted ON vibe_comments(is_deleted) WHERE is_deleted = false;

-- ============================================================================
-- VIBE HEARTS - Likes on posts and comments
-- ============================================================================
CREATE TABLE IF NOT EXISTS vibe_hearts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who hearted
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- What was hearted (one of these must be set)
  post_id UUID REFERENCES vibe_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES vibe_comments(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints: exactly one target
  CONSTRAINT vibe_hearts_one_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  ),
  
  -- Unique: one heart per user per target
  CONSTRAINT vibe_hearts_unique_post UNIQUE (user_id, post_id),
  CONSTRAINT vibe_hearts_unique_comment UNIQUE (user_id, comment_id)
);

-- Indexes for vibe_hearts
CREATE INDEX idx_vibe_hearts_user_id ON vibe_hearts(user_id);
CREATE INDEX idx_vibe_hearts_post_id ON vibe_hearts(post_id) WHERE post_id IS NOT NULL;
CREATE INDEX idx_vibe_hearts_comment_id ON vibe_hearts(comment_id) WHERE comment_id IS NOT NULL;

-- ============================================================================
-- USER COMMUNITY STATS - Aggregated stats for mini profiles
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_community_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User reference (one per user)
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Counts
  total_posts INTEGER NOT NULL DEFAULT 0,
  total_comments INTEGER NOT NULL DEFAULT 0,
  hearts_given INTEGER NOT NULL DEFAULT 0,
  hearts_received INTEGER NOT NULL DEFAULT 0,
  
  -- Streak tracking
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_post_date DATE,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for user_community_stats
CREATE INDEX idx_user_community_stats_user_id ON user_community_stats(user_id);

-- Trigger for updated_at
CREATE TRIGGER set_user_community_stats_updated_at
  BEFORE UPDATE ON user_community_stats
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- TRIGGER FUNCTIONS - Maintain denormalized counts
-- ============================================================================

-- Update hearts_count on vibe_posts when hearts are added/removed
CREATE OR REPLACE FUNCTION update_post_hearts_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE vibe_posts SET hearts_count = hearts_count + 1 WHERE id = NEW.post_id;
    -- Update hearts_received for post author
    UPDATE user_community_stats 
    SET hearts_received = hearts_received + 1, updated_at = now()
    WHERE user_id = (SELECT user_id FROM vibe_posts WHERE id = NEW.post_id);
    -- Update hearts_given for the user who hearted
    UPDATE user_community_stats 
    SET hearts_given = hearts_given + 1, updated_at = now()
    WHERE user_id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE vibe_posts SET hearts_count = hearts_count - 1 WHERE id = OLD.post_id;
    -- Update hearts_received for post author
    UPDATE user_community_stats 
    SET hearts_received = GREATEST(0, hearts_received - 1), updated_at = now()
    WHERE user_id = (SELECT user_id FROM vibe_posts WHERE id = OLD.post_id);
    -- Update hearts_given for the user who removed heart
    UPDATE user_community_stats 
    SET hearts_given = GREATEST(0, hearts_given - 1), updated_at = now()
    WHERE user_id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_post_hearts_count_insert
  AFTER INSERT ON vibe_hearts
  FOR EACH ROW
  WHEN (NEW.post_id IS NOT NULL)
  EXECUTE FUNCTION update_post_hearts_count();

CREATE TRIGGER trigger_update_post_hearts_count_delete
  AFTER DELETE ON vibe_hearts
  FOR EACH ROW
  WHEN (OLD.post_id IS NOT NULL)
  EXECUTE FUNCTION update_post_hearts_count();

-- Update hearts_count on vibe_comments when hearts are added/removed
CREATE OR REPLACE FUNCTION update_comment_hearts_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE vibe_comments SET hearts_count = hearts_count + 1 WHERE id = NEW.comment_id;
    -- Update hearts_received for comment author
    UPDATE user_community_stats 
    SET hearts_received = hearts_received + 1, updated_at = now()
    WHERE user_id = (SELECT user_id FROM vibe_comments WHERE id = NEW.comment_id);
    -- Update hearts_given for the user who hearted
    UPDATE user_community_stats 
    SET hearts_given = hearts_given + 1, updated_at = now()
    WHERE user_id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE vibe_comments SET hearts_count = hearts_count - 1 WHERE id = OLD.comment_id;
    -- Update hearts_received for comment author
    UPDATE user_community_stats 
    SET hearts_received = GREATEST(0, hearts_received - 1), updated_at = now()
    WHERE user_id = (SELECT user_id FROM vibe_comments WHERE id = OLD.comment_id);
    -- Update hearts_given for the user who removed heart
    UPDATE user_community_stats 
    SET hearts_given = GREATEST(0, hearts_given - 1), updated_at = now()
    WHERE user_id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_comment_hearts_count_insert
  AFTER INSERT ON vibe_hearts
  FOR EACH ROW
  WHEN (NEW.comment_id IS NOT NULL)
  EXECUTE FUNCTION update_comment_hearts_count();

CREATE TRIGGER trigger_update_comment_hearts_count_delete
  AFTER DELETE ON vibe_hearts
  FOR EACH ROW
  WHEN (OLD.comment_id IS NOT NULL)
  EXECUTE FUNCTION update_comment_hearts_count();

-- Update comments_count on vibe_posts when comments are added/removed
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE vibe_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    -- Update total_comments for the commenter
    UPDATE user_community_stats 
    SET total_comments = total_comments + 1, updated_at = now()
    WHERE user_id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.is_deleted = true AND OLD.is_deleted = false) THEN
    UPDATE vibe_posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = COALESCE(OLD.post_id, NEW.post_id);
    RETURN COALESCE(NEW, OLD);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_post_comments_count
  AFTER INSERT OR DELETE OR UPDATE OF is_deleted ON vibe_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

-- Update user stats when posts are created
CREATE OR REPLACE FUNCTION update_user_post_stats()
RETURNS TRIGGER AS $$
DECLARE
  last_date DATE;
  current_streak INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get or create user stats
    INSERT INTO user_community_stats (user_id, total_posts, last_post_date, streak_days)
    VALUES (NEW.user_id, 1, CURRENT_DATE, 1)
    ON CONFLICT (user_id) DO UPDATE SET
      total_posts = user_community_stats.total_posts + 1,
      streak_days = CASE
        WHEN user_community_stats.last_post_date = CURRENT_DATE THEN user_community_stats.streak_days
        WHEN user_community_stats.last_post_date = CURRENT_DATE - 1 THEN user_community_stats.streak_days + 1
        ELSE 1
      END,
      longest_streak = GREATEST(
        user_community_stats.longest_streak,
        CASE
          WHEN user_community_stats.last_post_date = CURRENT_DATE THEN user_community_stats.streak_days
          WHEN user_community_stats.last_post_date = CURRENT_DATE - 1 THEN user_community_stats.streak_days + 1
          ELSE 1
        END
      ),
      last_post_date = CURRENT_DATE,
      updated_at = now();
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.is_deleted = true AND OLD.is_deleted = false) THEN
    UPDATE user_community_stats 
    SET total_posts = GREATEST(0, total_posts - 1), updated_at = now()
    WHERE user_id = COALESCE(OLD.user_id, NEW.user_id);
    RETURN COALESCE(NEW, OLD);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_user_post_stats
  AFTER INSERT OR DELETE OR UPDATE OF is_deleted ON vibe_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_post_stats();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE vibe_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_hearts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_community_stats ENABLE ROW LEVEL SECURITY;

-- vibe_posts policies
CREATE POLICY "Anyone can view non-deleted posts"
  ON vibe_posts FOR SELECT
  USING (is_deleted = false);

CREATE POLICY "Authenticated users can create posts"
  ON vibe_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON vibe_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON vibe_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any post"
  ON vibe_posts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete any post"
  ON vibe_posts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- vibe_comments policies
CREATE POLICY "Anyone can view non-deleted comments"
  ON vibe_comments FOR SELECT
  USING (is_deleted = false);

CREATE POLICY "Authenticated users can create comments"
  ON vibe_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON vibe_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON vibe_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any comment"
  ON vibe_comments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete any comment"
  ON vibe_comments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- vibe_hearts policies
CREATE POLICY "Anyone can view hearts"
  ON vibe_hearts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can add hearts"
  ON vibe_hearts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own hearts"
  ON vibe_hearts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- user_community_stats policies
CREATE POLICY "Anyone can view community stats"
  ON user_community_stats FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Stats are managed by system"
  ON user_community_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Stats are updated by system"
  ON user_community_stats FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user has hearted a post
CREATE OR REPLACE FUNCTION has_user_hearted_post(p_user_id UUID, p_post_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM vibe_hearts 
    WHERE user_id = p_user_id AND post_id = p_post_id
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check if user has hearted a comment
CREATE OR REPLACE FUNCTION has_user_hearted_comment(p_user_id UUID, p_comment_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM vibe_hearts 
    WHERE user_id = p_user_id AND comment_id = p_comment_id
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE vibe_posts IS 'Community posts in the Vibe Tribe feed';
COMMENT ON TABLE vibe_comments IS 'Comments on Vibe Tribe posts';
COMMENT ON TABLE vibe_hearts IS 'Hearts (likes) on posts and comments';
COMMENT ON TABLE user_community_stats IS 'Aggregated community statistics per user';
COMMENT ON TYPE vibe_tag IS 'Categories for Vibe Tribe posts: win, wobble, vision, practice';
