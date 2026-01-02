-- ============================================================================
-- Add Phone Number to Video Session Participants
-- Migration: 20260102000002_add_participant_phone.sql
-- Description: Add phone field for SMS reminders
-- ============================================================================

-- Add phone column to video_session_participants
ALTER TABLE video_session_participants
ADD COLUMN phone TEXT;

-- Add index for phone lookups
CREATE INDEX idx_video_participants_phone ON video_session_participants(phone);

-- Add comment
COMMENT ON COLUMN video_session_participants.phone IS 'Phone number for SMS reminders';

