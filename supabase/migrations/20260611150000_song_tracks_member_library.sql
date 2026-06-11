-- Add in_member_library column to song_tracks for explicit member library management.
-- Hearting a track no longer auto-shares to the public catalog; members must
-- explicitly "Add to member library" or "Submit for publishing" via the 3-dot menu.

ALTER TABLE public.song_tracks
  ADD COLUMN IF NOT EXISTS in_member_library boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_song_tracks_member_library
  ON public.song_tracks (user_id, in_member_library)
  WHERE in_member_library = true;

COMMENT ON COLUMN public.song_tracks.in_member_library IS 'Whether this track appears in the member library on /audio/music';

-- RPC to get member library track IDs (bypasses PostgREST schema cache for new column)
CREATE OR REPLACE FUNCTION public.get_member_library_track_ids()
RETURNS TABLE(id uuid)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT st.id FROM song_tracks st WHERE st.user_id = auth.uid() AND st.in_member_library = true;
$$;
