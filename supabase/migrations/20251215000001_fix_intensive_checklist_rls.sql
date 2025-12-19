-- Fix intensive_checklist RLS UPDATE policy
-- Missing WITH CHECK clause prevents updates

-- Drop old incomplete policy
DROP POLICY IF EXISTS "Users can update own intensive checklist" ON intensive_checklist;

-- Recreate with WITH CHECK clause
CREATE POLICY "Users can update own intensive checklist"
ON intensive_checklist
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "Users can update own intensive checklist" ON intensive_checklist IS 
'Allows users to update their own intensive checklist records (status, started_at, completed_at, step completions)';




