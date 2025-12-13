-- Add DELETE policy for audio_generation_batches
-- Users should be able to delete their own audio generation batches

CREATE POLICY "Users can delete own audio generation batches"
  ON public.audio_generation_batches
  FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can delete own audio generation batches" ON public.audio_generation_batches IS 
  'Allows users to delete their own audio generation batch records';



