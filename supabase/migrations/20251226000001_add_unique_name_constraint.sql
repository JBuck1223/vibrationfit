-- Add unique constraint to audio_background_tracks.name
-- This allows upsert operations when regenerating tracks

ALTER TABLE public.audio_background_tracks
ADD CONSTRAINT audio_background_tracks_name_unique UNIQUE (name);

