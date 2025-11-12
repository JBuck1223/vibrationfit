-- Add missing UPDATE and DELETE policies for refinements table
-- Run this manually in Supabase SQL editor

-- Add UPDATE policy for users to update their own refinements
CREATE POLICY "Users can update their own refinements" ON refinements
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Add DELETE policy for users to delete their own refinements  
CREATE POLICY "Users can delete their own refinements" ON refinements
    FOR DELETE USING (auth.uid() = user_id);

-- Update grants to ensure users have UPDATE and DELETE permissions
GRANT UPDATE, DELETE ON refinements TO authenticated;
