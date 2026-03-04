-- Add DELETE policy for abundance_events so users can delete their own entries
CREATE POLICY "Users can delete their abundance events"
  ON public.abundance_events
  FOR DELETE
  USING (auth.uid() = user_id);
