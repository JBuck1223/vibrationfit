-- Migration: Vision Focus Table
-- Purpose: Store Focus stories - mini day-in-the-life narratives from life visions
-- Date: 2026-02-02

-- ============================================================================
-- Create vision_focus table
-- ============================================================================

CREATE TABLE IF NOT EXISTS vision_focus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vision_id uuid NOT NULL REFERENCES vision_versions(id) ON DELETE CASCADE,
  
  -- Highlight selections (VIVA suggestions and user's final picks)
  suggested_highlights jsonb NOT NULL DEFAULT '[]'::jsonb,
  selected_highlights jsonb NOT NULL DEFAULT '[]'::jsonb,
  
  -- Story content
  story_content text,
  story_word_count integer,
  
  -- Audio reference (uses generalized audio_sets with content_type='focus_story')
  audio_set_id uuid REFERENCES audio_sets(id) ON DELETE SET NULL,
  
  -- Status tracking
  status text DEFAULT 'draft' NOT NULL,
  error_message text,
  
  -- Generation tracking
  generation_count integer DEFAULT 0 NOT NULL,
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Constraints
  CONSTRAINT vision_focus_status_check 
    CHECK (status IN ('draft', 'suggesting', 'generating_story', 'generating_audio', 'completed', 'failed')),
  CONSTRAINT unique_focus_per_vision UNIQUE (vision_id)
);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE vision_focus IS 'Focus stories - 5-7 minute day-in-the-life audio narratives from life visions';
COMMENT ON COLUMN vision_focus.suggested_highlights IS 'VIVA-extracted highlights from vision: [{category, text, essence, timeOfDay}]';
COMMENT ON COLUMN vision_focus.selected_highlights IS 'User-confirmed highlights for story generation';
COMMENT ON COLUMN vision_focus.story_content IS 'Generated day-in-the-life narrative text';
COMMENT ON COLUMN vision_focus.story_word_count IS 'Word count of story (target: 750-1000 for 5-7 min audio)';
COMMENT ON COLUMN vision_focus.audio_set_id IS 'Reference to audio_sets where content_type=focus_story';
COMMENT ON COLUMN vision_focus.status IS 'draft: initial | suggesting: extracting highlights | generating_story: VIVA writing | generating_audio: TTS | completed | failed';
COMMENT ON COLUMN vision_focus.generation_count IS 'Number of times story/audio has been regenerated';

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_vision_focus_user ON vision_focus(user_id);
CREATE INDEX IF NOT EXISTS idx_vision_focus_vision ON vision_focus(vision_id);
CREATE INDEX IF NOT EXISTS idx_vision_focus_status ON vision_focus(status);
CREATE INDEX IF NOT EXISTS idx_vision_focus_audio_set ON vision_focus(audio_set_id) WHERE audio_set_id IS NOT NULL;

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE vision_focus ENABLE ROW LEVEL SECURITY;

-- Users can view their own focus stories
CREATE POLICY "Users can view own focus" ON vision_focus
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own focus stories
CREATE POLICY "Users can create own focus" ON vision_focus
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own focus stories
CREATE POLICY "Users can update own focus" ON vision_focus
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own focus stories
CREATE POLICY "Users can delete own focus" ON vision_focus
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- Updated_at trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_vision_focus_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_vision_focus_updated_at ON vision_focus;
CREATE TRIGGER trigger_vision_focus_updated_at
  BEFORE UPDATE ON vision_focus
  FOR EACH ROW
  EXECUTE FUNCTION update_vision_focus_updated_at();
