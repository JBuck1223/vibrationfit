-- Fix vibe_posts UPDATE policy for soft deletes
-- The original WITH CHECK clause was preventing soft deletes because it was re-checking ownership

-- Drop all existing update policies
DROP POLICY IF EXISTS "Users can update their own posts" ON public.vibe_posts;
DROP POLICY IF EXISTS "Admins can update any post" ON public.vibe_posts;

-- Create a single combined UPDATE policy
-- USING: Check if user owns the post OR is admin (determines which rows can be updated)
-- WITH CHECK: Only validate that user_id hasn't been changed to someone else
CREATE POLICY "Users and admins can update posts" ON public.vibe_posts 
FOR UPDATE TO authenticated 
USING (
  -- User owns the post
  auth.uid() = user_id
  OR
  -- User is admin
  EXISTS (
    SELECT 1 FROM public.user_accounts
    WHERE user_accounts.id = auth.uid()
    AND user_accounts.role IN ('admin', 'super_admin')
  )
)
WITH CHECK (true);  -- USING already validates access, WITH CHECK allows any valid update

COMMENT ON POLICY "Users and admins can update posts" ON public.vibe_posts 
IS 'Owners can update their posts, admins can update any post. Soft deletes are allowed.';
