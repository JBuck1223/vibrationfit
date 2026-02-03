-- Allow authenticated users to view basic profile info of other members
-- This is needed for Vibe Tribe posts to show avatars and names

-- Create policy to allow viewing basic user info (for community features)
CREATE POLICY "Authenticated users can view basic profile info" ON public.user_accounts
FOR SELECT TO authenticated
USING (true);

-- Note: This replaces the more restrictive "Users can view own account" policy
-- by allowing all authenticated users to see all accounts.
-- If you want more granular control, you could instead create a view that only
-- exposes id, full_name, and profile_picture_url, and query that instead.

COMMENT ON POLICY "Authenticated users can view basic profile info" ON public.user_accounts
IS 'Allows authenticated users to view user accounts for community features like Vibe Tribe';
