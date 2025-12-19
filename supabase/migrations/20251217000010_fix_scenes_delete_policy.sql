-- Check and fix the DELETE policy for scenes table
-- Drop existing policy if it exists and recreate it correctly

DROP POLICY IF EXISTS "Users can delete their scenes" ON public.scenes;

CREATE POLICY "Users can delete their scenes" 
ON public.scenes 
FOR DELETE 
USING (auth.uid() = user_id);



