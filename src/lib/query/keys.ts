/**
 * Central query-key registry for the app-wide TanStack Query cache.
 *
 * Every shared piece of entity data has exactly one key (or key factory) here.
 * Invalidation happens by prefix, so `invalidateQueries({ queryKey: keys.playlists })`
 * also invalidates parametrized children like `keys.playlistTracks(id)`.
 *
 * TABLE_TO_KEYS maps Postgres tables to the query keys that depend on them.
 * The RealtimeInvalidationBridge uses it to auto-invalidate the cache whenever
 * a row changes, no matter where the write came from (client, API route, cron,
 * another device).
 */

export const keys = {
  // Life Vision
  visions: ['visions'] as const,
  household: ['household'] as const,
  householdContext: ['household', 'context'] as const,

  // Profile
  profile: ['profile'] as const,
  profileVersions: ['profile', 'versions'] as const,
  activeProfile: ['profile', 'active'] as const,

  // Journal
  journalEntries: ['journal-entries'] as const,

  // Vision Board
  visionBoardCount: ['vision-board-count'] as const,

  // Stories
  stories: ['stories'] as const,

  // Playlists
  playlists: ['playlists'] as const,
  playlistTracks: (playlistId: string) => ['playlists', 'tracks', playlistId] as const,

  // Audio Studio
  audioSets: ['audio-sets'] as const,
  audioBatches: ['audio-batches'] as const,

  // MAP Studio
  maps: ['maps'] as const,
  mapTargets: ['map-targets'] as const,
  commitments: ['commitments'] as const,
  commitmentOccurrences: ['commitment-occurrences'] as const,

  // Reset Studio
  resets: ['resets'] as const,
} as const

type QueryKeyPrefix = readonly string[]

/**
 * Postgres table -> query keys to invalidate when rows in that table change.
 * Tables listed here must also be added to the `supabase_realtime` publication
 * (see supabase/migrations/*_realtime_core_tables.sql).
 */
export const TABLE_TO_KEYS: Record<string, QueryKeyPrefix[]> = {
  vision_versions: [keys.visions, keys.audioSets],
  user_profiles: [keys.profile],
  journal_entries: [keys.journalEntries],
  vision_board_items: [keys.visionBoardCount],
  stories: [keys.stories, keys.audioSets],
  user_playlists: [keys.playlists],
  user_playlist_tracks: [keys.playlists],
  audio_sets: [keys.audioSets],
  audio_tracks: [keys.audioSets],
  audio_generation_batches: [keys.audioBatches, keys.audioSets],
  user_maps: [keys.maps],
  vision_targets: [keys.mapTargets],
  commitments: [keys.commitments],
  commitment_occurrences: [keys.commitmentOccurrences, keys.commitments],
  resets: [keys.resets],
  reset_items: [keys.resets],
}
