-- Migration: Add category and vision_id to conversation_sessions
-- This makes it much easier to look up sessions by category/vision

ALTER TABLE conversation_sessions
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS vision_id UUID REFERENCES vision_versions(id) ON DELETE CASCADE;

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_category 
  ON conversation_sessions(category);

CREATE INDEX IF NOT EXISTS idx_conversation_sessions_vision_id 
  ON conversation_sessions(vision_id);

CREATE INDEX IF NOT EXISTS idx_conversation_sessions_user_category_vision 
  ON conversation_sessions(user_id, category, vision_id);

-- Add comment
COMMENT ON COLUMN conversation_sessions.category IS 'The vision category this conversation is about';
COMMENT ON COLUMN conversation_sessions.vision_id IS 'The vision this conversation is refining';

