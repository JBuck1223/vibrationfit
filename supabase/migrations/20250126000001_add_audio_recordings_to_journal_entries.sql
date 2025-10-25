-- ============================================================================
-- Add Audio Recordings to Journal Entries
-- ============================================================================
-- This migration adds audio recording storage to journal_entries table
-- Stores recordings as JSONB array with metadata similar to user_profiles

-- Add audio_recordings field to journal_entries table
ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS audio_recordings JSONB DEFAULT '[]'::jsonb NOT NULL;

COMMENT ON COLUMN journal_entries.audio_recordings IS 
'Array of audio/video recordings with metadata: [{ url, transcript, type, category, created_at }]';

-- Example structure:
-- [
--   {
--     "url": "https://media.vibrationfit.com/uploads/.../recording.webm",
--     "transcript": "This is my journal entry...",
--     "type": "audio" | "video",
--     "category": "journal",
--     "duration": 120,
--     "created_at": "2025-01-26T12:00:00Z"
--   }
-- ]
