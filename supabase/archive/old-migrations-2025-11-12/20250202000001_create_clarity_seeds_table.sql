-- ============================================================================
-- Create Frequency Flip Table
-- ============================================================================
-- Stores flipped clarity seeds from the frequency_flip microprompt
-- These are present-tense, first-person, positive ideal-state phrases
-- that can be used as inputs for vision generation and assembly

begin;

CREATE TABLE IF NOT EXISTS frequency_flip (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Original input from user
  input_text TEXT NOT NULL,
  
  -- Flipped clarity seed (present-tense, first-person, positive)
  clarity_seed TEXT NOT NULL,
  
  -- Essence (one word or short phrase)
  essence TEXT,
  
  -- Optional enriched fields
  sensory_anchor TEXT,
  embodiment_line TEXT,
  surrender_line TEXT,
  
  -- Category and context
  category TEXT, -- Life category (money, health, fun, etc.)
  vision_id UUID REFERENCES vision_versions(id) ON DELETE SET NULL,
  scene_context TEXT, -- Optional scene/category linkage
  
  -- Metadata
  mode TEXT NOT NULL DEFAULT 'flip', -- 'flip' | 'flip+enrich' | 'batch'
  unchanged BOOLEAN DEFAULT false, -- If input was already aligned
  voice_notes JSONB DEFAULT '[]'::jsonb, -- Preserved words/phrases
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_frequency_flip_user_id ON frequency_flip(user_id);
CREATE INDEX IF NOT EXISTS idx_frequency_flip_category ON frequency_flip(category);
CREATE INDEX IF NOT EXISTS idx_frequency_flip_vision_id ON frequency_flip(vision_id);
CREATE INDEX IF NOT EXISTS idx_frequency_flip_created_at ON frequency_flip(created_at DESC);

-- Row Level Security
ALTER TABLE frequency_flip ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own frequency flip seeds" ON frequency_flip
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own frequency flip seeds" ON frequency_flip
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own frequency flip seeds" ON frequency_flip
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own frequency flip seeds" ON frequency_flip
  FOR DELETE USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE frequency_flip IS 'Stores flipped clarity seeds from frequency_flip microprompt';
COMMENT ON COLUMN frequency_flip.input_text IS 'Original contrast/lack language from user';
COMMENT ON COLUMN frequency_flip.clarity_seed IS 'Flipped present-tense, first-person, positive ideal-state phrase';
COMMENT ON COLUMN frequency_flip.essence IS 'One word or short phrase capturing the essence (e.g., Freedom, Ease, Joy)';
COMMENT ON COLUMN frequency_flip.sensory_anchor IS 'Optional single concrete detail in user voice';
COMMENT ON COLUMN frequency_flip.embodiment_line IS 'Optional "I live it now" line in user voice';
COMMENT ON COLUMN frequency_flip.surrender_line IS 'Optional grounded thank-you/allowing line';
COMMENT ON COLUMN frequency_flip.mode IS 'Mode used: flip, flip+enrich, or batch';
COMMENT ON COLUMN frequency_flip.unchanged IS 'True if input was already aligned (no flip needed)';

commit;

