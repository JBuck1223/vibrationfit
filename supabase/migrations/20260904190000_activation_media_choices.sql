-- Voice and song-genre choices captured after Enter My Activation.
ALTER TABLE public.activations
  ADD COLUMN IF NOT EXISTS voice_id text,
  ADD COLUMN IF NOT EXISTS song_genre text;
