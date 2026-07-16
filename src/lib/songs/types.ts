/**
 * Song Studio Types
 *
 * Songs are generated through the Emotional Songwriting Framework:
 * members define a Song Essence (emotional arc, imagery, vibe) and VIVA
 * crafts lyrics that move through that arc. Mureka then generates music.
 */

// ============================================================================
// SONG ESSENCE (the creative intake)
// ============================================================================

export type SongEnergy =
  | 'calm'
  | 'uplifting'
  | 'explosive'
  | 'reflective'
  | 'rebellious'
  | 'blissful'

export type LyricalStyle =
  | 'simple'
  | 'poetic'
  | 'cinematic'
  | 'conversational'

export type CommercialStyle =
  | 'indie'
  | 'pop'
  | 'folk'
  | 'country'
  | 'rock'
  | 'edm'
  | 'cinematic'

export interface VibeSliders {
  emotional_intensity: number   // 1-10
  spiritual_depth: number       // 1-10
  energy: SongEnergy
  lyrical_style: LyricalStyle
  commercial_style: CommercialStyle
}

export interface SongEssence {
  song_idea: string
  song_title?: string
  emotional_start: string
  emotional_destination: string
  core_message: string
  imagery: string[]
  energy_style: string
  sliders: VibeSliders
}

// ============================================================================
// SONG ENTITY (mirrors stories pattern)
// ============================================================================

export type SongEntityType =
  | 'life_vision'
  | 'vision_board_item'
  | 'journal_entry'
  | 'custom'

export type SongSource =
  | 'ai_generated'
  | 'user_written'
  | 'ai_assisted'

export type SongStatus =
  | 'draft'
  | 'generating_lyrics'
  | 'lyrics_complete'
  | 'generating_music'
  | 'completed'
  | 'failed'

export interface SongMetadata {
  model_used?: string
  prompt_version?: string
  source_snapshot?: Record<string, unknown>
  [key: string]: unknown
}

export interface Song {
  id: string
  user_id: string
  entity_type: SongEntityType
  entity_id: string
  title: string | null
  lyrics: string | null
  song_essence: SongEssence | null
  style_prompt: string | null
  source: SongSource
  status: SongStatus
  metadata: SongMetadata
  generation_count: number
  display_order: number
  /** Story Behind the Song: member-recorded video/audio telling the story */
  story_media_url: string | null
  story_media_type: 'video' | 'audio' | null
  story_recorded_at: string | null
  created_at: string
  updated_at: string
}

// ============================================================================
// SONG TRACKS (individual Mureka outputs)
// ============================================================================

export type SongTrackStatus =
  | 'generating'
  | 'completed'
  | 'failed'

export interface SongTrackMetadata {
  mureka_mp3_url?: string
  mureka_cover_url?: string
  mureka_share_url?: string
  [key: string]: unknown
}

export interface SongTrack {
  id: string
  song_id: string
  user_id: string
  mureka_task_id: string | null
  mureka_song_id: string | null
  title: string | null
  version: string
  mp3_url: string | null
  s3_key: string | null
  cover_url: string | null
  cover_s3_key: string | null
  duration_ms: number | null
  genres: string[]
  moods: string[]
  is_favorite: boolean
  stems_url: string | null
  stems_s3_key: string | null
  /** Public sharing (non-members): permanent token for /music/[token] */
  share_token?: string | null
  /** Whether the public share link is active */
  is_shared?: boolean
  /** Whether the track is listed on the public /music discover page */
  is_public?: boolean
  shared_at?: string | null
  status: SongTrackStatus
  metadata: SongTrackMetadata
  created_at: string
}

// ============================================================================
// PAYLOADS
// ============================================================================

export interface GenerateLyricsPayload {
  entity_type: SongEntityType
  entity_id: string
  song_essence: SongEssence
  title?: string
}

export interface GenerateMusicPayload {
  song_id: string
  style_prompt?: string
  reference_id?: string
  lyrics?: string
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

export interface UseSongsReturn {
  songs: Song[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export interface UseSongReturn {
  song: Song | null
  tracks: SongTrack[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// ============================================================================
// PRESET DATA (for the Song Essence form)
// ============================================================================

export const EMOTIONAL_STARTS = [
  'Burned out', 'Stuck', 'Scared', 'Guilty', 'Numb',
  'Overwhelmed', 'Lost', 'Invisible', 'Restless', 'Heavy',
] as const

export const EMOTIONAL_DESTINATIONS = [
  'Free', 'Alive', 'Empowered', 'Peaceful', 'Inspired',
  'Hopeful', 'Lit up', 'Sovereign', 'Joyful', 'Unstoppable',
] as const

export const IMAGERY_SUGGESTIONS = [
  'Sparkles on water', 'Bare feet in sand', 'Driving all night',
  'Dancing in the rain', 'Holding your baby', 'Neon lights',
  'Mountains at sunrise', 'Sunsets', 'Boat rides', 'Messy kitchens',
  'City rooftops', 'Open highways', 'Campfire smoke', 'Ocean waves',
  'Morning coffee', 'Starlit sky', 'Wind in your hair', 'First snow',
] as const

export const ENERGY_STYLES = [
  'Indie uplifting',
  'Cinematic anthem',
  'Folk stomp',
  'Country soul',
  'Coldplay-style emotional build',
  'Mumford-style earthy energy',
  'OneRepublic emotional anthem',
  'Sia-style emotional release',
  'Surf rock freedom vibe',
  'EDM spiritual lift',
  'Acoustic intimate',
  'Gospel-inspired triumph',
] as const

export const SONG_IDEA_EXAMPLES = [
  'Following your bliss',
  'Laughing instead of crying',
  'Feeling worthy just by existing',
  'Going after your dreams',
  'Earth is our playground',
  'Freedom is the basis of life',
  'Dancing through the chaos',
  'Coming home to yourself',
] as const

export const CORE_MESSAGE_EXAMPLES = [
  'Life is too short not to live fully',
  'Joy is the purpose of life',
  'We are worthy by existing',
  'Freedom starts internally',
  'Contrast creates clarity',
  'The Universe responds to vibration',
  'Love is the only real thing',
  'You were born to feel alive',
] as const
