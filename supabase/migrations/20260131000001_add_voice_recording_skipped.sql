-- Add voice_recording_skipped field to intensive_checklist
-- This tracks when a user explicitly skips Step 8 (Record Voice) which is optional

ALTER TABLE intensive_checklist
ADD COLUMN IF NOT EXISTS voice_recording_skipped boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS voice_recording_skipped_at timestamp with time zone;

-- Add comment for clarity
COMMENT ON COLUMN intensive_checklist.voice_recording_skipped IS 'True if user explicitly skipped Step 8 (Record Voice)';
COMMENT ON COLUMN intensive_checklist.voice_recording_skipped_at IS 'Timestamp when user skipped Step 8';
