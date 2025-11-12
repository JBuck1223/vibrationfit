-- ═══════════════════════════════════════════════════════════════════════
-- VIVA Chat System Migrations - SAFE VERSION
-- Only adds missing pieces, won't fail if tables exist
-- ═══════════════════════════════════════════════════════════════════════

-- Check and add context column to ai_conversations if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_conversations' AND column_name = 'context'
    ) THEN
        ALTER TABLE ai_conversations ADD COLUMN context JSONB DEFAULT '{}';
        RAISE NOTICE 'Added context column to ai_conversations';
    ELSE
        RAISE NOTICE 'context column already exists in ai_conversations';
    END IF;
END $$;

-- Add category and vision_id to conversation_sessions if missing
ALTER TABLE conversation_sessions
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS vision_id UUID REFERENCES vision_versions(id) ON DELETE CASCADE;

-- Create indexes (safe, won't fail if exists)
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_category 
  ON conversation_sessions(category);

CREATE INDEX IF NOT EXISTS idx_conversation_sessions_vision_id 
  ON conversation_sessions(vision_id);

CREATE INDEX IF NOT EXISTS idx_conversation_sessions_user_category_vision 
  ON conversation_sessions(user_id, category, vision_id);

-- Add comment for documentation
COMMENT ON COLUMN conversation_sessions.category IS 'The vision category this conversation is about';
COMMENT ON COLUMN conversation_sessions.vision_id IS 'The vision this conversation is refining';

-- ═══════════════════════════════════════════════════════════════════════
-- ✅ Safe migration complete!
-- ═══════════════════════════════════════════════════════════════════════

