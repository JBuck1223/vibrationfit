-- Vision Board Ideas Generation Table
-- Stores VIVA-generated suggestions for vision board items

CREATE TABLE IF NOT EXISTS vision_board_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vision_version_id UUID NOT NULL REFERENCES vision_versions(id) ON DELETE CASCADE,
  
  -- Generation metadata
  category TEXT NOT NULL, -- 'fun', 'travel', etc. or 'all' for full generation
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  model_used TEXT NOT NULL, -- e.g. 'gpt-4o'
  tokens_used INTEGER,
  
  -- Suggestions (JSONB array of {name, description})
  suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Tracking
  items_created INTEGER DEFAULT 0, -- How many items they actually created from this
  created_item_ids UUID[] DEFAULT '{}', -- Track which items came from this generation
  
  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'archived', 'expired'
  expires_at TIMESTAMPTZ, -- Optional: auto-expire after 30 days
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_vision_board_ideas_user ON vision_board_ideas(user_id);
CREATE INDEX idx_vision_board_ideas_vision ON vision_board_ideas(vision_version_id);
CREATE INDEX idx_vision_board_ideas_category ON vision_board_ideas(category);
CREATE INDEX idx_vision_board_ideas_status ON vision_board_ideas(status) WHERE status = 'active';
CREATE INDEX idx_vision_board_ideas_user_active ON vision_board_ideas(user_id, status) WHERE status = 'active';

-- RLS
ALTER TABLE vision_board_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vision board ideas"
  ON vision_board_ideas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vision board ideas"
  ON vision_board_ideas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vision board ideas"
  ON vision_board_ideas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vision board ideas"
  ON vision_board_ideas FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_vision_board_ideas_updated_at
  BEFORE UPDATE ON vision_board_ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE vision_board_ideas IS 'Stores VIVA-generated vision board item suggestions';
COMMENT ON COLUMN vision_board_ideas.category IS 'Category key (fun, travel, etc.) or "all" for full generation';
COMMENT ON COLUMN vision_board_ideas.suggestions IS 'Array of {name, description} objects';
COMMENT ON COLUMN vision_board_ideas.items_created IS 'Count of items user actually created from these suggestions';
COMMENT ON COLUMN vision_board_ideas.created_item_ids IS 'Array of vision_board_items.id that came from these suggestions';




