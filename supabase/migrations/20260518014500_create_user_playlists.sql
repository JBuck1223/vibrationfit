-- Create user_playlists table
CREATE TABLE public.user_playlists (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  icon_key text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.user_playlists IS 'User-created custom playlists that can contain tracks from any audio source';

-- Create user_playlist_tracks table
CREATE TABLE public.user_playlist_tracks (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  playlist_id uuid NOT NULL REFERENCES public.user_playlists(id) ON DELETE CASCADE,
  source_type text NOT NULL,
  source_id text NOT NULL,
  track_data jsonb NOT NULL,
  position integer NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT user_playlist_tracks_source_type_check CHECK (source_type = ANY (ARRAY['life_vision'::text, 'story'::text, 'music'::text]))
);

COMMENT ON TABLE public.user_playlist_tracks IS 'Tracks within a user playlist, with snapshot of track data for self-contained playback';
COMMENT ON COLUMN public.user_playlist_tracks.track_data IS 'Snapshot of AudioTrack shape: { id, title, artist, duration, url, thumbnail }';
COMMENT ON COLUMN public.user_playlist_tracks.source_type IS 'Origin of the track: life_vision, story, or music';
COMMENT ON COLUMN public.user_playlist_tracks.source_id IS 'ID of the original track/catalog row for provenance';

-- Indexes
CREATE INDEX idx_user_playlists_user_id ON public.user_playlists(user_id);
CREATE INDEX idx_user_playlist_tracks_playlist_id ON public.user_playlist_tracks(playlist_id);
CREATE UNIQUE INDEX idx_user_playlist_tracks_position ON public.user_playlist_tracks(playlist_id, position);

-- Enable RLS
ALTER TABLE public.user_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_playlist_tracks ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_playlists
CREATE POLICY "Users can view their own playlists" ON public.user_playlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own playlists" ON public.user_playlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playlists" ON public.user_playlists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own playlists" ON public.user_playlists
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for user_playlist_tracks (via join to parent)
CREATE POLICY "Users can view tracks in their playlists" ON public.user_playlist_tracks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_playlists WHERE id = playlist_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can add tracks to their playlists" ON public.user_playlist_tracks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_playlists WHERE id = playlist_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update tracks in their playlists" ON public.user_playlist_tracks
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_playlists WHERE id = playlist_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can remove tracks from their playlists" ON public.user_playlist_tracks
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_playlists WHERE id = playlist_id AND user_id = auth.uid())
  );
