-- Allow admins/super_admins to see all video session participants.
-- Without this, the admin sessions list shows "No participant" for sessions they don't host.

CREATE POLICY video_participants_admin_select
  ON public.video_session_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_accounts
      WHERE user_accounts.id = auth.uid()
        AND user_accounts.role IN ('admin', 'super_admin')
    )
  );
