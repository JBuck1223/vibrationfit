-- Migration: Video Session Messages RLS for Participants
-- Allow session participants (not just hosts) to read and post chat messages

-- Drop existing restrictive policy (host-only)
DROP POLICY IF EXISTS video_messages_session_access ON public.video_session_messages;

-- Policy: Participants can view messages for sessions they're part of
CREATE POLICY video_messages_participant_select ON public.video_session_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.video_session_participants vsp
      WHERE vsp.session_id = video_session_messages.session_id
        AND vsp.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.video_sessions vs
      WHERE vs.id = video_session_messages.session_id
        AND vs.host_user_id = auth.uid()
    )
  );

-- Policy: Participants can insert messages for sessions they're part of
CREATE POLICY video_messages_participant_insert ON public.video_session_messages
  FOR INSERT
  WITH CHECK (
    -- User must be a participant or host of the session
    (
      EXISTS (
        SELECT 1 FROM public.video_session_participants vsp
        WHERE vsp.session_id = video_session_messages.session_id
          AND vsp.user_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM public.video_sessions vs
        WHERE vs.id = video_session_messages.session_id
          AND vs.host_user_id = auth.uid()
      )
    )
    -- And the user_id must match the authenticated user (or be null for guests)
    AND (user_id = auth.uid() OR user_id IS NULL)
  );

-- Policy: Users can only update their own messages (for future edit feature)
CREATE POLICY video_messages_own_update ON public.video_session_messages
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own messages, hosts can delete any in their session
CREATE POLICY video_messages_delete ON public.video_session_messages
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.video_sessions vs
      WHERE vs.id = video_session_messages.session_id
        AND vs.host_user_id = auth.uid()
    )
  );

-- Enable realtime for video_session_messages (for live chat updates)
-- Note: Make sure the table is added to supabase realtime publication
-- Run this in Supabase dashboard if needed:
-- ALTER PUBLICATION supabase_realtime ADD TABLE video_session_messages;

COMMENT ON TABLE public.video_session_messages IS 'Chat messages during video sessions - YouTube-live style feed';
