-- ============================================================================
-- Fix Video Session RLS Policies
-- Migration: 20260101000002_fix_video_session_policies.sql
-- Description: Fix infinite recursion in video_sessions RLS policies
-- ============================================================================

-- Drop the problematic policies
DROP POLICY IF EXISTS "Hosts can manage their sessions" ON video_sessions;
DROP POLICY IF EXISTS "Participants can view their sessions" ON video_sessions;
DROP POLICY IF EXISTS "Users can view their participation" ON video_session_participants;
DROP POLICY IF EXISTS "Hosts can manage participants" ON video_session_participants;
DROP POLICY IF EXISTS "Participants can manage messages" ON video_session_messages;
DROP POLICY IF EXISTS "Hosts can manage messages" ON video_session_messages;
DROP POLICY IF EXISTS "Hosts can manage recordings" ON video_session_recordings;
DROP POLICY IF EXISTS "Participants can view public recordings" ON video_session_recordings;

-- ============================================================================
-- SIMPLIFIED POLICIES (No circular references)
-- ============================================================================

-- VIDEO_SESSIONS: Simple host-based access
-- Hosts have full access to their sessions
CREATE POLICY "video_sessions_host_all"
  ON video_sessions FOR ALL
  USING (host_user_id = auth.uid())
  WITH CHECK (host_user_id = auth.uid());

-- Anyone can view sessions they're invited to (by checking participants separately)
-- We'll handle participant access at the application level for now
-- This avoids the circular dependency

-- VIDEO_SESSION_PARTICIPANTS: User-based access
-- Users can view their own participation (by user_id only, email matching done at app level)
CREATE POLICY "video_participants_view_own"
  ON video_session_participants FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "video_participants_host_manage"
  ON video_session_participants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM video_sessions vs
      WHERE vs.id = video_session_participants.session_id
      AND vs.host_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM video_sessions vs
      WHERE vs.id = video_session_participants.session_id
      AND vs.host_user_id = auth.uid()
    )
  );

-- VIDEO_SESSION_MESSAGES: Session-based access
CREATE POLICY "video_messages_session_access"
  ON video_session_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM video_sessions vs
      WHERE vs.id = video_session_messages.session_id
      AND vs.host_user_id = auth.uid()
    )
  );

-- VIDEO_SESSION_RECORDINGS: Host-only for now
CREATE POLICY "video_recordings_host_manage"
  ON video_session_recordings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM video_sessions vs
      WHERE vs.id = video_session_recordings.session_id
      AND vs.host_user_id = auth.uid()
    )
  );

-- ============================================================================
-- SECURITY DEFINER FUNCTION for participant session access
-- This avoids RLS recursion by using a function
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_session_ids(user_uuid UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT session_id 
  FROM video_session_participants 
  WHERE user_id = user_uuid
$$;

-- Now add a policy for participants to view their sessions using the function
CREATE POLICY "video_sessions_participant_view"
  ON video_sessions FOR SELECT
  USING (
    id IN (SELECT get_user_session_ids(auth.uid()))
  );

