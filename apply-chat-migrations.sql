-- ═══════════════════════════════════════════════════════════════════════
-- VIVA Chat System Migrations
-- Apply both migrations in one go for the chat system
-- ═══════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────
-- STEP 1: Create base chat tables
-- ────────────────────────────────────────────────────────────────────────

-- Create ai_conversations table for VIVA chat history
-- Supports conversation sessions and message threading

CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Conversation session grouping
  conversation_id UUID, -- Groups messages into conversations (null for legacy messages)
  conversation_title TEXT, -- Optional: title/summary of conversation
  
  -- Message data
  message TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  
  -- Context metadata
  context JSONB DEFAULT '{}',
  -- Contains: { visionBuildPhase, category, isInitialGreeting, mode, requestedSection, ... }
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create conversation_sessions table for managing conversation metadata
CREATE TABLE IF NOT EXISTS conversation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Session metadata
  title TEXT, -- Auto-generated or user-provided title
  mode TEXT DEFAULT 'master', -- 'master', 'refinement', etc.
  
  -- Summary/preview
  preview_message TEXT, -- First user message or generated summary
  message_count INTEGER DEFAULT 0, -- Number of messages in conversation
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ -- When last message was added
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_conversation_id ON ai_conversations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON ai_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_conversation ON ai_conversations(user_id, conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_conversation_sessions_user_id ON conversation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_updated_at ON conversation_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_user_updated ON conversation_sessions(user_id, updated_at DESC);

-- Function to update conversation session metadata
CREATE OR REPLACE FUNCTION update_conversation_session()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the conversation session's last_message_at and message_count
  IF NEW.conversation_id IS NOT NULL THEN
    UPDATE conversation_sessions
    SET 
      updated_at = NOW(),
      last_message_at = NEW.created_at,
      message_count = (
        SELECT COUNT(*) 
        FROM ai_conversations 
        WHERE conversation_id = NEW.conversation_id
      )
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update conversation sessions
CREATE TRIGGER ai_conversations_update_session
AFTER INSERT ON ai_conversations
FOR EACH ROW
EXECUTE FUNCTION update_conversation_session();

-- Row Level Security
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_conversations
CREATE POLICY "Users can view their own conversations" ON ai_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations" ON ai_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON ai_conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" ON ai_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for conversation_sessions
CREATE POLICY "Users can view their own conversation sessions" ON conversation_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversation sessions" ON conversation_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversation sessions" ON conversation_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversation sessions" ON conversation_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Comments for documentation
COMMENT ON TABLE ai_conversations IS 'Stores individual chat messages between users and VIVA';
COMMENT ON TABLE conversation_sessions IS 'Groups messages into conversations with metadata';
COMMENT ON COLUMN ai_conversations.conversation_id IS 'Links messages to a conversation session (nullable for backward compatibility)';
COMMENT ON COLUMN conversation_sessions.mode IS 'Type of conversation: master, refinement, vision_build, etc.';

-- ────────────────────────────────────────────────────────────────────────
-- STEP 2: Add category and vision_id columns
-- ────────────────────────────────────────────────────────────────────────

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

-- Add comments
COMMENT ON COLUMN conversation_sessions.category IS 'The vision category this conversation is about';
COMMENT ON COLUMN conversation_sessions.vision_id IS 'The vision this conversation is refining';

-- ═══════════════════════════════════════════════════════════════════════
-- ✅ Migration complete!
-- ═══════════════════════════════════════════════════════════════════════

