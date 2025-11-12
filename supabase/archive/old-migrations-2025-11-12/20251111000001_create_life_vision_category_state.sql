-- =============================================================================
-- Migration: Create life_vision_category_state table
-- Purpose: Clean V3-specific per-category state storage
-- Date: 2025-11-11
-- Replaces: refinements table for V3 data (64% space savings!)
-- =============================================================================

-- =============================================================================
-- 1. Create life_vision_category_state table
-- =============================================================================

CREATE TABLE IF NOT EXISTS life_vision_category_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  
  -- V3 Step Data
  transcript TEXT,              -- Step 1: User raw input (audio/text)
  ai_summary TEXT,              -- Step 1: VIVA-generated category summary
  ideal_state TEXT,             -- Step 2: Imagination/ideal state answers
  blueprint_data JSONB,         -- Step 3: Being/Doing/Receiving loops
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT life_vision_category_state_category_check 
    CHECK (category IN (
      'fun', 'health', 'travel', 'love', 'family', 'social',
      'home', 'work', 'money', 'stuff', 'giving', 'spirituality'
    )),
  UNIQUE(user_id, category)
);

COMMENT ON TABLE life_vision_category_state IS 'V3 Life Vision per-category state storage';
COMMENT ON COLUMN life_vision_category_state.transcript IS 'Step 1: User audio/text transcript';
COMMENT ON COLUMN life_vision_category_state.ai_summary IS 'Step 1: VIVA-generated category summary';
COMMENT ON COLUMN life_vision_category_state.ideal_state IS 'Step 2: User imagination/ideal state answers';
COMMENT ON COLUMN life_vision_category_state.blueprint_data IS 'Step 3: Being/Doing/Receiving loops as JSONB';

-- =============================================================================
-- 2. Create indexes for performance
-- =============================================================================

-- Primary lookup index (user + category)
CREATE INDEX idx_lv_category_state_user_category 
  ON life_vision_category_state(user_id, category);
  
-- Temporal queries
CREATE INDEX idx_lv_category_state_created 
  ON life_vision_category_state(created_at DESC);
  
-- JSONB queries on blueprint data
CREATE INDEX idx_lv_category_state_blueprint 
  ON life_vision_category_state USING GIN (blueprint_data);

-- =============================================================================
-- 3. Enable Row Level Security (RLS)
-- =============================================================================

ALTER TABLE life_vision_category_state ENABLE ROW LEVEL SECURITY;

-- Users can view their own category state
CREATE POLICY "Users can view own category state"
  ON life_vision_category_state FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own category state
CREATE POLICY "Users can insert own category state"
  ON life_vision_category_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own category state
CREATE POLICY "Users can update own category state"
  ON life_vision_category_state FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own category state
CREATE POLICY "Users can delete own category state"
  ON life_vision_category_state FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- 4. Create trigger for updated_at
-- =============================================================================

CREATE TRIGGER update_lv_category_state_updated_at
  BEFORE UPDATE ON life_vision_category_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- =============================================================================

-- To rollback this migration, run:
--
-- DROP TRIGGER IF EXISTS update_lv_category_state_updated_at ON life_vision_category_state;
-- DROP POLICY IF EXISTS "Users can delete own category state" ON life_vision_category_state;
-- DROP POLICY IF EXISTS "Users can update own category state" ON life_vision_category_state;
-- DROP POLICY IF EXISTS "Users can insert own category state" ON life_vision_category_state;
-- DROP POLICY IF EXISTS "Users can view own category state" ON life_vision_category_state;
-- DROP INDEX IF EXISTS idx_lv_category_state_blueprint;
-- DROP INDEX IF EXISTS idx_lv_category_state_created;
-- DROP INDEX IF EXISTS idx_lv_category_state_user_category;
-- DROP TABLE IF EXISTS life_vision_category_state;

