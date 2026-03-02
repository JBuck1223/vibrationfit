-- Add voice_recording_completed field to intensive_checklist
-- Mirrors voice_recording_skipped: tracks when user actually records their voice in Step 8
-- This eliminates the need to query audio_tracks at runtime to determine step completion

ALTER TABLE intensive_checklist
ADD COLUMN IF NOT EXISTS voice_recording_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS voice_recording_completed_at timestamp with time zone;

COMMENT ON COLUMN intensive_checklist.voice_recording_completed IS 'True if user recorded their voice in Step 8 (Record Voice)';
COMMENT ON COLUMN intensive_checklist.voice_recording_completed_at IS 'Timestamp when user completed their first voice recording in Step 8';
