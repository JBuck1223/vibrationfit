-- Reference clips for meditation instrumentals.
-- Separate from reference_tracks: Mureka registers these with purpose 'instrumental',
-- and those file ids only work with /v1/instrumental/generate.

CREATE TABLE IF NOT EXISTS public.meditation_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  source_url text NOT NULL,
  youtube_url text,
  clip_url text NOT NULL,
  clip_start numeric NOT NULL DEFAULT 0,
  mureka_file_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meditation_references_user
  ON public.meditation_references(user_id, created_at DESC);

ALTER TABLE public.meditation_references ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own meditation references" ON public.meditation_references;
CREATE POLICY "Users manage own meditation references"
  ON public.meditation_references
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
