-- Migration: Allow authenticated users to insert their own badges
-- Fix: RLS policy only allowed service_role to insert, but the badges API
-- uses the authenticated client. Users need to insert their own badge rows.

-- Allow authenticated users to insert badges for themselves
CREATE POLICY "Users can insert own badges"
  ON user_badges
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
