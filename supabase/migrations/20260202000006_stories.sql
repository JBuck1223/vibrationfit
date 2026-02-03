-- Migration: Stories System
-- Purpose: Polymorphic stories table for generated narratives attached to any entity
-- Date: 2026-02-02
--
-- Stories can be attached to any entity (vision board items, life visions, goals, etc.)
-- and support both AI-generated and user-recorded audio via the existing audio system.
--
-- ENTITY TYPE USAGE:
-- -----------------
-- life_vision: Focus stories (day-in-the-life narratives)
--   metadata: { selected_categories, category_data, suggested_highlights, selected_highlights }
--
-- vision_board_item: Stories for individual vision board items
--   metadata: { prompts_used, generation_settings }
--
-- goal: Goal-focused narratives
-- schedule_block: Preview stories for upcoming activities
-- journal_entry: Reflective stories from journal entries

-- ============================================================================
-- PART 1: Stories Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Polymorphic attachment: what entity is this story about?
  -- The entity itself has all the context (name, description, categories, etc.)
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  
  -- Optional title (can override or supplement entity's name)
  title text,
  
  -- Content
  content text,
  word_count integer,
  
  -- Source tracking
  source text NOT NULL DEFAULT 'ai_generated',
  
  -- AI-generated audio (via audio_sets system with background mixing)
  audio_set_id uuid REFERENCES audio_sets(id) ON DELETE SET NULL,
  
  -- User-recorded audio (direct upload)
  user_audio_url text,
  user_audio_duration_seconds integer,
  
  -- Additional metadata (prompts used, generation settings, etc.)
  metadata jsonb DEFAULT '{}'::jsonb,
  
  -- Generation/processing status
  status text DEFAULT 'draft' NOT NULL,
  error_message text,
  generation_count integer DEFAULT 0 NOT NULL,
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Constraints
  CONSTRAINT stories_entity_type_check 
    CHECK (entity_type IN (
      'life_vision',
      'vision_board_item', 
      'goal',
      'schedule_block',
      'journal_entry',
      'custom'
    )),
  CONSTRAINT stories_source_check 
    CHECK (source IN ('ai_generated', 'user_written', 'ai_assisted')),
  CONSTRAINT stories_status_check 
    CHECK (status IN ('draft', 'generating', 'completed', 'failed')),
  -- One story per entity
  CONSTRAINT unique_story_per_entity UNIQUE (entity_type, entity_id)
);

-- ============================================================================
-- PART 2: Comments
-- ============================================================================

COMMENT ON TABLE stories IS 'Polymorphic stories attached to entities. Entity provides context (name, description, categories).';
COMMENT ON COLUMN stories.entity_type IS 'Type of entity: life_vision, vision_board_item, goal, schedule_block, journal_entry, custom';
COMMENT ON COLUMN stories.entity_id IS 'UUID of the entity (vision_board_items.id, vision_versions.id, etc.)';
COMMENT ON COLUMN stories.title IS 'Optional title - can override or supplement the entity name';
COMMENT ON COLUMN stories.source IS 'How content was created: ai_generated, user_written, ai_assisted';
COMMENT ON COLUMN stories.audio_set_id IS 'Reference to AI-generated audio via audio_sets (with background mixing)';
COMMENT ON COLUMN stories.user_audio_url IS 'URL to user-recorded audio file';
COMMENT ON COLUMN stories.user_audio_duration_seconds IS 'Duration of user-recorded audio in seconds';
COMMENT ON COLUMN stories.metadata IS 'Additional data: prompts used, generation settings, highlights extracted, etc.';
COMMENT ON COLUMN stories.generation_count IS 'Number of times story has been regenerated';

-- ============================================================================
-- PART 3: Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_stories_user ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_entity ON stories(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status) WHERE status != 'completed';
CREATE INDEX IF NOT EXISTS idx_stories_user_entity_type ON stories(user_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_stories_audio_set ON stories(audio_set_id) WHERE audio_set_id IS NOT NULL;

-- ============================================================================
-- PART 4: Row Level Security
-- ============================================================================

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stories" ON stories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own stories" ON stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stories" ON stories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories" ON stories
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- PART 5: Updated_at Trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_stories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_stories_updated_at ON stories;
CREATE TRIGGER trigger_stories_updated_at
  BEFORE UPDATE ON stories
  FOR EACH ROW
  EXECUTE FUNCTION update_stories_updated_at();

-- ============================================================================
-- PART 6: Update audio_sets content_type constraint to include 'story'
-- ============================================================================

ALTER TABLE audio_sets DROP CONSTRAINT IF EXISTS audio_sets_content_type_check;
ALTER TABLE audio_sets ADD CONSTRAINT audio_sets_content_type_check 
  CHECK (content_type IN ('life_vision', 'focus_story', 'story', 'affirmation', 'visualization', 'journal', 'custom'));

ALTER TABLE audio_tracks DROP CONSTRAINT IF EXISTS audio_tracks_content_type_check;
ALTER TABLE audio_tracks ADD CONSTRAINT audio_tracks_content_type_check 
  CHECK (content_type IN ('life_vision', 'focus_story', 'story', 'affirmation', 'visualization', 'journal', 'custom'));

ALTER TABLE audio_generation_batches DROP CONSTRAINT IF EXISTS audio_generation_batches_content_type_check;
ALTER TABLE audio_generation_batches ADD CONSTRAINT audio_generation_batches_content_type_check 
  CHECK (content_type IN ('life_vision', 'focus_story', 'story', 'affirmation', 'visualization', 'journal', 'custom'));

-- ============================================================================
-- PART 7: AI Tool Configurations for Story Generation
-- ============================================================================

-- Focus Highlight Extraction Tool (for life_vision entity_type)
INSERT INTO ai_tools (tool_key, tool_name, description, model_name, temperature, max_tokens, system_prompt, is_active) VALUES
('focus_highlight_extraction', 'Focus Highlight Extraction', 
 'Analyzes life vision to extract 5-7 vivid, emotionally charged highlights for Focus story narration',
 'gpt-4o', 0.7, 1000,
 'You are VIVA analyzing a Life Vision document to extract the most vivid, emotionally charged moments for audio narration. Identify highlights that are sensory-rich, emotionally activating, and span different times of day. Return structured JSON with category, text, essence word, and time of day.',
 true)
ON CONFLICT (tool_key) DO UPDATE SET
  tool_name = EXCLUDED.tool_name,
  description = EXCLUDED.description,
  model_name = EXCLUDED.model_name,
  temperature = EXCLUDED.temperature,
  max_tokens = EXCLUDED.max_tokens,
  system_prompt = EXCLUDED.system_prompt,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Focus Story Generation Tool (for life_vision entity_type)
INSERT INTO ai_tools (tool_key, tool_name, description, model_name, temperature, max_tokens, system_prompt, is_active) VALUES
('focus_story_generation', 'Focus Story Generation', 
 'Generates immersive day-in-the-life narrative (750-1000 words) from selected vision highlights',
 'gpt-4o', 0.8, 1500,
 'You are VIVA crafting an immersive day-in-the-life narrative. Write in first person, present tense, with sensory-rich descriptions. Flow naturally from morning awakening through evening wind-down, weaving the provided highlights into a cohesive story. Show, do not tell - create visceral experiences through specific sensory details.',
 true)
ON CONFLICT (tool_key) DO UPDATE SET
  tool_name = EXCLUDED.tool_name,
  description = EXCLUDED.description,
  model_name = EXCLUDED.model_name,
  temperature = EXCLUDED.temperature,
  max_tokens = EXCLUDED.max_tokens,
  system_prompt = EXCLUDED.system_prompt,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Vision Board Item Story Tool
INSERT INTO ai_tools (tool_key, tool_name, description, model_name, temperature, max_tokens, system_prompt, is_active) VALUES
('vision_board_story', 'Vision Board Item Story', 
 'Creates an immersive story around a specific vision board item',
 'gpt-4o', 0.8, 1200,
 'You are VIVA creating an immersive first-person story about achieving a specific vision board item. Write in present tense as if the user is living this moment. Include sensory details, emotions, and the significance of this achievement. Make it feel real and visceral.',
 true)
ON CONFLICT (tool_key) DO UPDATE SET
  tool_name = EXCLUDED.tool_name,
  description = EXCLUDED.description,
  model_name = EXCLUDED.model_name,
  temperature = EXCLUDED.temperature,
  max_tokens = EXCLUDED.max_tokens,
  system_prompt = EXCLUDED.system_prompt,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
