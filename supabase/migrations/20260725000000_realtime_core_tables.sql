-- Enable Supabase Realtime (postgres_changes) on core entity tables.
--
-- The client-side RealtimeInvalidationBridge subscribes to these tables and
-- invalidates the TanStack Query cache when rows change, so UI updates
-- automatically after any write (client, API route, cron, other device).
-- Events are RLS-filtered: users only receive changes for rows they can see.
--
-- Idempotent: skips tables already in the publication.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'vision_versions',
    'user_profiles',
    'journal_entries',
    'vision_board_items',
    'stories',
    'user_playlists',
    'user_playlist_tracks',
    'audio_sets',
    'audio_tracks',
    'audio_generation_batches',
    'user_maps',
    'vision_targets',
    'commitments',
    'commitment_occurrences',
    'resets',
    'reset_items'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
