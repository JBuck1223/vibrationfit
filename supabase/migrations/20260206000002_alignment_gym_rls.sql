-- Migration: RLS policy for Alignment Gym sessions
-- 
-- Alignment Gym sessions are open to all authenticated members.
-- Any logged-in user can view and join them without being pre-invited.

-- Allow any authenticated user to SELECT alignment_gym sessions
CREATE POLICY video_sessions_alignment_gym_view ON public.video_sessions
  FOR SELECT
  USING (
    session_type = 'alignment_gym'
    AND auth.uid() IS NOT NULL
  );

-- Allow any authenticated user to be added as a participant to alignment_gym sessions
-- (so they can join without being pre-invited)
CREATE POLICY video_participants_alignment_gym_join ON public.video_session_participants
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.video_sessions vs
      WHERE vs.id = video_session_participants.session_id
        AND vs.session_type = 'alignment_gym'
    )
    AND user_id = auth.uid()
  );

-- Allow participants to view other participants in alignment_gym sessions
CREATE POLICY video_participants_alignment_gym_view ON public.video_session_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.video_sessions vs
      WHERE vs.id = video_session_participants.session_id
        AND vs.session_type = 'alignment_gym'
    )
    AND auth.uid() IS NOT NULL
  );

-- Allow any authenticated user to read messages in alignment_gym sessions
CREATE POLICY video_messages_alignment_gym_view ON public.video_session_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.video_sessions vs
      WHERE vs.id = video_session_messages.session_id
        AND vs.session_type = 'alignment_gym'
    )
    AND auth.uid() IS NOT NULL
  );

-- Allow any authenticated user to post messages in alignment_gym sessions
CREATE POLICY video_messages_alignment_gym_insert ON public.video_session_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.video_sessions vs
      WHERE vs.id = video_session_messages.session_id
        AND vs.session_type = 'alignment_gym'
    )
    AND (user_id = auth.uid() OR user_id IS NULL)
  );
