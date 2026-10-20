-- Meditation sessions and member instrumental beds.
-- songs.entity_type gains 'meditation' so generated instrumentals stay out of the songwriter.
-- Shared instrumentals are registered on audio_background_tracks (category meditations).

ALTER TABLE public.songs DROP CONSTRAINT IF EXISTS songs_entity_type_check;
ALTER TABLE public.songs ADD CONSTRAINT songs_entity_type_check
  CHECK (entity_type = ANY (ARRAY[
    'life_vision'::text,
    'vision_board_item'::text,
    'journal_entry'::text,
    'custom'::text,
    'meditation'::text
  ]));

ALTER TABLE public.audio_background_tracks
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.user_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_audio_background_tracks_created_by
  ON public.audio_background_tracks(created_by)
  WHERE created_by IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.meditations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  inhale_seconds integer NOT NULL,
  exhale_seconds integer NOT NULL,
  duration_minutes integer NOT NULL,
  music_background_track_id uuid REFERENCES public.audio_background_tracks(id) ON DELETE SET NULL,
  music_song_track_id uuid REFERENCES public.song_tracks(id) ON DELETE SET NULL,
  music_volume numeric NOT NULL DEFAULT 0.55,
  binaural_track_id uuid REFERENCES public.audio_background_tracks(id) ON DELETE SET NULL,
  binaural_volume numeric NOT NULL DEFAULT 0.3,
  bpm integer,
  mood text,
  is_shared boolean NOT NULL DEFAULT false,
  is_favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT meditations_inhale_check CHECK (inhale_seconds BETWEEN 2 AND 20),
  CONSTRAINT meditations_exhale_check CHECK (exhale_seconds BETWEEN 2 AND 20),
  CONSTRAINT meditations_duration_check CHECK (duration_minutes BETWEEN 1 AND 30),
  CONSTRAINT meditations_music_volume_check CHECK (music_volume >= 0 AND music_volume <= 1),
  CONSTRAINT meditations_binaural_volume_check CHECK (binaural_volume >= 0 AND binaural_volume <= 1)
);

CREATE INDEX IF NOT EXISTS idx_meditations_user_id ON public.meditations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meditations_shared ON public.meditations(created_at DESC) WHERE is_shared = true;

ALTER TABLE public.meditations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own meditations" ON public.meditations;
CREATE POLICY "Users manage own meditations"
  ON public.meditations
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Members can view shared meditations" ON public.meditations;
CREATE POLICY "Members can view shared meditations"
  ON public.meditations
  FOR SELECT
  TO authenticated
  USING (is_shared = true);
