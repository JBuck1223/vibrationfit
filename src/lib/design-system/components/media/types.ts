export interface TrackPerformer {
  name: string
  snapshotHref: string
}

export interface AudioTrack {
  id: string
  title: string
  artist: string
  duration: number // in seconds
  url: string
  thumbnail?: string
  variant?: string // Optional: 'sleep', 'meditation', 'energy' for background mixing
  sectionKey?: string
  syncedLyrics?: unknown
  plainLyrics?: string
  /** Clickable artist line (e.g. snapshot profile links). */
  performers?: TrackPerformer[]
  albumLabel?: string
  /** User song version label for /audio/songs track list (e.g. Version 1). */
  versionLabel?: string
  /** Publish pipeline status for user-created songs. */
  publishStatus?: 'pending' | 'approved' | 'published'
  /** Track was created by a Vibe Tribe member (not admin catalog). */
  memberCreated?: boolean
}
