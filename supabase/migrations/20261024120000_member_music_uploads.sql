-- Member music uploads: members can upload original songs they hold full rights to.
-- Uploaded songs reuse songs + song_tracks (source = 'member_upload') so they flow
-- through the Member Library / artist pages like VIVA songs. The rights attestation
-- is recorded on the track row for audit.

ALTER TABLE public.songs DROP CONSTRAINT IF EXISTS songs_source_check;
ALTER TABLE public.songs
  ADD CONSTRAINT songs_source_check
  CHECK (source = ANY (ARRAY['ai_generated'::text, 'user_written'::text, 'ai_assisted'::text, 'member_upload'::text]));

ALTER TABLE public.song_tracks
  ADD COLUMN IF NOT EXISTS rights_attested_at timestamptz,
  ADD COLUMN IF NOT EXISTS rights_attestation_version text;

COMMENT ON COLUMN public.song_tracks.rights_attested_at IS
  'When the member attested this uploaded track is their original work and they hold full rights (member uploads only)';
COMMENT ON COLUMN public.song_tracks.rights_attestation_version IS
  'Version of the Original Music Rights attestation text the member accepted (see src/lib/songs/upload-rights.ts)';
