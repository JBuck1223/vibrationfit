-- Migration: Generalize Audio System for Multiple Content Types
-- Purpose: Extend audio_sets, audio_tracks, and audio_generation_batches to support
--          content beyond life visions (focus stories, affirmations, visualizations, etc.)
-- Date: 2026-02-02

-- ============================================================================
-- PART 1: Extend audio_sets
-- ============================================================================

-- Add content_type discriminator
ALTER TABLE audio_sets 
  ADD COLUMN IF NOT EXISTS content_type text DEFAULT 'life_vision';

-- Add content_id for generic FK to source content
ALTER TABLE audio_sets 
  ADD COLUMN IF NOT EXISTS content_id uuid;

-- Make vision_id nullable (not all audio is for visions)
ALTER TABLE audio_sets ALTER COLUMN vision_id DROP NOT NULL;

-- Add check constraint for valid content types
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'audio_sets_content_type_check'
  ) THEN
    ALTER TABLE audio_sets ADD CONSTRAINT audio_sets_content_type_check 
      CHECK (content_type IN ('life_vision', 'focus_story', 'affirmation', 'visualization', 'journal', 'custom'));
  END IF;
END $$;

-- Add index for content lookups
CREATE INDEX IF NOT EXISTS idx_audio_sets_content 
  ON audio_sets(content_type, content_id) 
  WHERE content_id IS NOT NULL;

-- Comments
COMMENT ON COLUMN audio_sets.content_type IS 'Type of content: life_vision, focus_story, affirmation, visualization, journal, custom';
COMMENT ON COLUMN audio_sets.content_id IS 'Generic reference to source content (vision_focus.id, affirmation.id, etc.)';

-- ============================================================================
-- PART 2: Extend audio_tracks
-- ============================================================================

-- Add content_type discriminator
ALTER TABLE audio_tracks 
  ADD COLUMN IF NOT EXISTS content_type text DEFAULT 'life_vision';

-- Make vision_id nullable
ALTER TABLE audio_tracks ALTER COLUMN vision_id DROP NOT NULL;

-- Add check constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'audio_tracks_content_type_check'
  ) THEN
    ALTER TABLE audio_tracks ADD CONSTRAINT audio_tracks_content_type_check 
      CHECK (content_type IN ('life_vision', 'focus_story', 'affirmation', 'visualization', 'journal', 'custom'));
  END IF;
END $$;

-- Add index for content lookups
CREATE INDEX IF NOT EXISTS idx_audio_tracks_content 
  ON audio_tracks(content_type);

-- Comment
COMMENT ON COLUMN audio_tracks.content_type IS 'Type of content this track belongs to';

-- ============================================================================
-- PART 3: Extend audio_generation_batches
-- ============================================================================

-- Add content_type discriminator
ALTER TABLE audio_generation_batches 
  ADD COLUMN IF NOT EXISTS content_type text DEFAULT 'life_vision';

-- Add content_id for generic FK
ALTER TABLE audio_generation_batches 
  ADD COLUMN IF NOT EXISTS content_id uuid;

-- Make vision_id nullable
ALTER TABLE audio_generation_batches ALTER COLUMN vision_id DROP NOT NULL;

-- Add check constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'audio_generation_batches_content_type_check'
  ) THEN
    ALTER TABLE audio_generation_batches ADD CONSTRAINT audio_generation_batches_content_type_check 
      CHECK (content_type IN ('life_vision', 'focus_story', 'affirmation', 'visualization', 'journal', 'custom'));
  END IF;
END $$;

-- Comments
COMMENT ON COLUMN audio_generation_batches.content_type IS 'Type of content being generated';
COMMENT ON COLUMN audio_generation_batches.content_id IS 'Generic reference to source content';

-- ============================================================================
-- PART 4: Update existing records (set content_type for existing data)
-- ============================================================================

-- All existing records are life_vision by default (already set via DEFAULT)
-- No data migration needed as DEFAULT handles this
