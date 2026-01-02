-- ============================================================================
-- Video Sessions Feature
-- Migration: 20260101000001_video_sessions.sql
-- Description: Tables for 1:1 video coaching sessions with Daily.co integration
-- ============================================================================

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Session types
CREATE TYPE video_session_type AS ENUM (
  'one_on_one',       -- 1:1 coaching call
  'group',            -- Small group session
  'workshop',         -- Activation Intensive workshop
  'webinar'           -- Large live event
);

-- Session status
CREATE TYPE video_session_status AS ENUM (
  'scheduled',        -- Future session
  'waiting',          -- Host in waiting room
  'live',             -- Currently in progress
  'completed',        -- Successfully ended
  'cancelled',        -- Cancelled before start
  'no_show'           -- Participant didn't show
);

-- Recording status
CREATE TYPE video_recording_status AS ENUM (
  'none',             -- No recording
  'recording',        -- Currently recording
  'processing',       -- Daily.co processing
  'ready',            -- Ready to download
  'uploaded',         -- Uploaded to S3
  'failed'            -- Recording failed
);

-- ============================================================================
-- MAIN TABLES
-- ============================================================================

-- Video Sessions - Main session table
CREATE TABLE video_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Room details (from Daily.co)
  daily_room_name TEXT NOT NULL UNIQUE,
  daily_room_url TEXT NOT NULL,
  
  -- Session metadata
  title TEXT NOT NULL,
  description TEXT,
  session_type video_session_type NOT NULL DEFAULT 'one_on_one',
  status video_session_status NOT NULL DEFAULT 'scheduled',
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ NOT NULL,
  scheduled_duration_minutes INTEGER NOT NULL DEFAULT 60,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  actual_duration_seconds INTEGER,
  
  -- Host info
  host_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Recording
  recording_status video_recording_status NOT NULL DEFAULT 'none',
  daily_recording_id TEXT,
  recording_s3_key TEXT,
  recording_url TEXT,
  recording_duration_seconds INTEGER,
  
  -- Settings
  enable_recording BOOLEAN DEFAULT true,
  enable_transcription BOOLEAN DEFAULT true,
  enable_waiting_room BOOLEAN DEFAULT true,
  max_participants INTEGER DEFAULT 2,
  
  -- Notes
  host_notes TEXT,           -- Private notes for host
  session_summary TEXT,      -- Post-session summary (can be VIVA-generated)
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Session Participants - Who was invited/attended
CREATE TABLE video_session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES video_sessions(id) ON DELETE CASCADE,
  
  -- Participant info
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,                 -- For non-user participants
  name TEXT,                  -- Display name
  
  -- Attendance
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Engagement metrics
  camera_on_percent NUMERIC(5,2),
  mic_on_percent NUMERIC(5,2),
  
  -- Status
  is_host BOOLEAN DEFAULT false,
  attended BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(session_id, user_id),
  CONSTRAINT email_or_user CHECK (user_id IS NOT NULL OR email IS NOT NULL)
);

-- Video Session Messages - In-call chat
CREATE TABLE video_session_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES video_sessions(id) ON DELETE CASCADE,
  
  -- Sender
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  
  -- Message content
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'chat', -- 'chat', 'question', 'reaction', 'system'
  
  -- Timestamps
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Session Recordings - Track recording files
CREATE TABLE video_session_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES video_sessions(id) ON DELETE CASCADE,
  
  -- Daily.co info
  daily_recording_id TEXT UNIQUE,
  daily_download_url TEXT,
  
  -- S3 storage
  s3_bucket TEXT,
  s3_key TEXT,
  s3_url TEXT,
  
  -- File info
  file_size_bytes BIGINT,
  duration_seconds INTEGER,
  format TEXT DEFAULT 'mp4',
  
  -- Transcription
  transcript_text TEXT,
  transcript_s3_key TEXT,
  
  -- Processing status
  status video_recording_status NOT NULL DEFAULT 'processing',
  error_message TEXT,
  
  -- Visibility
  is_public BOOLEAN DEFAULT false,
  resource_library_id UUID,  -- If added to resource library
  
  -- Timestamps
  recorded_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Session lookups
CREATE INDEX idx_video_sessions_host ON video_sessions(host_user_id);
CREATE INDEX idx_video_sessions_scheduled ON video_sessions(scheduled_at);
CREATE INDEX idx_video_sessions_status ON video_sessions(status);
CREATE INDEX idx_video_sessions_daily_room ON video_sessions(daily_room_name);

-- Participant lookups
CREATE INDEX idx_video_participants_session ON video_session_participants(session_id);
CREATE INDEX idx_video_participants_user ON video_session_participants(user_id);
CREATE INDEX idx_video_participants_email ON video_session_participants(email);

-- Message lookups
CREATE INDEX idx_video_messages_session ON video_session_messages(session_id);
CREATE INDEX idx_video_messages_sent ON video_session_messages(sent_at);

-- Recording lookups
CREATE INDEX idx_video_recordings_session ON video_session_recordings(session_id);
CREATE INDEX idx_video_recordings_status ON video_session_recordings(status);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_video_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_video_sessions_timestamp
  BEFORE UPDATE ON video_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_video_session_timestamp();

CREATE TRIGGER update_video_participants_timestamp
  BEFORE UPDATE ON video_session_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_video_session_timestamp();

CREATE TRIGGER update_video_recordings_timestamp
  BEFORE UPDATE ON video_session_recordings
  FOR EACH ROW
  EXECUTE FUNCTION update_video_session_timestamp();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE video_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_session_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_session_recordings ENABLE ROW LEVEL SECURITY;

-- Sessions: Host can do everything, participants can view their sessions
CREATE POLICY "Hosts can manage their sessions"
  ON video_sessions FOR ALL
  USING (host_user_id = auth.uid());

CREATE POLICY "Participants can view their sessions"
  ON video_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM video_session_participants
      WHERE session_id = video_sessions.id
      AND user_id = auth.uid()
    )
  );

-- Participants: Users can see their own participation
CREATE POLICY "Users can view their participation"
  ON video_session_participants FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Hosts can manage participants"
  ON video_session_participants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM video_sessions
      WHERE id = video_session_participants.session_id
      AND host_user_id = auth.uid()
    )
  );

-- Messages: Participants can read/write messages in their sessions
CREATE POLICY "Participants can manage messages"
  ON video_session_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM video_session_participants
      WHERE session_id = video_session_messages.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can manage messages"
  ON video_session_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM video_sessions
      WHERE id = video_session_messages.session_id
      AND host_user_id = auth.uid()
    )
  );

-- Recordings: Hosts can manage, participants can view if public
CREATE POLICY "Hosts can manage recordings"
  ON video_session_recordings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM video_sessions
      WHERE id = video_session_recordings.session_id
      AND host_user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can view public recordings"
  ON video_session_recordings FOR SELECT
  USING (
    is_public = true
    AND EXISTS (
      SELECT 1 FROM video_session_participants
      WHERE session_id = video_session_recordings.session_id
      AND user_id = auth.uid()
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE video_sessions IS 'Video coaching sessions using Daily.co';
COMMENT ON TABLE video_session_participants IS 'Participants in video sessions';
COMMENT ON TABLE video_session_messages IS 'Chat messages during video sessions';
COMMENT ON TABLE video_session_recordings IS 'Recordings of video sessions';

COMMENT ON COLUMN video_sessions.daily_room_name IS 'Unique room name from Daily.co API';
COMMENT ON COLUMN video_sessions.daily_room_url IS 'Full URL to join the Daily.co room';
COMMENT ON COLUMN video_sessions.session_summary IS 'Can be VIVA-generated after the call';

