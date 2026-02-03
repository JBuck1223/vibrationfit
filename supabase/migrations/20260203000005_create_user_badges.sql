-- Migration: Create user_badges table for badge/achievement system
-- Created: 2026-02-03

-- ============================================
-- USER BADGES TABLE
-- ============================================
-- Stores earned badges for users
-- Each badge can only be earned once per user

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Each user can only earn each badge once
  CONSTRAINT unique_user_badge UNIQUE(user_id, badge_type)
);

-- ============================================
-- INDEXES
-- ============================================

-- Index for fetching all badges for a user
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);

-- Index for fetching all users with a specific badge
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_type ON user_badges(badge_type);

-- Index for sorting by earned date
CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON user_badges(earned_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Users can view their own badges
CREATE POLICY "Users can view own badges"
  ON user_badges
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can view other users' badges (for profile display)
CREATE POLICY "Users can view other users badges"
  ON user_badges
  FOR SELECT
  TO authenticated
  USING (true);

-- Only the system/admin can insert badges (via service role)
-- Regular users cannot directly insert badges
CREATE POLICY "Service role can insert badges"
  ON user_badges
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Only service role can update badges
CREATE POLICY "Service role can update badges"
  ON user_badges
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Only service role can delete badges (for revocation)
CREATE POLICY "Service role can delete badges"
  ON user_badges
  FOR DELETE
  TO service_role
  USING (true);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE user_badges IS 'Stores earned badges/achievements for users';
COMMENT ON COLUMN user_badges.badge_type IS 'Badge identifier (e.g., gym_rookie, vibe_anchor)';
COMMENT ON COLUMN user_badges.earned_at IS 'When the badge was earned';
COMMENT ON COLUMN user_badges.metadata IS 'Additional data about how badge was earned';
