/**
 * Daily.co Video Integration
 * 
 * Server-side utilities for managing Daily.co video rooms.
 * https://docs.daily.co/reference/rest-api
 * 
 * Environment Variables Required:
 * - DAILY_API_KEY: Your Daily.co API key
 * - DAILY_DOMAIN: Your Daily.co domain (e.g., "vibrationfit")
 */

const DAILY_API_KEY = process.env.DAILY_API_KEY || ''
const DAILY_DOMAIN = process.env.DAILY_DOMAIN || 'vibrationfit'
const DAILY_API_BASE = 'https://api.daily.co/v1'

// ============================================================================
// TYPES
// ============================================================================

export interface DailyRoomConfig {
  name?: string                    // Room name (auto-generated if not provided)
  privacy?: 'public' | 'private'   // Default: private
  properties?: {
    exp?: number                   // Expiration timestamp (Unix seconds)
    nbf?: number                   // Not before timestamp
    max_participants?: number      // Max people in room
    enable_screenshare?: boolean   // Allow screen sharing
    enable_chat?: boolean          // Built-in chat
    enable_knocking?: boolean      // Waiting room
    start_video_off?: boolean      // Camera off by default
    start_audio_off?: boolean      // Mic off by default
    enable_recording?: 'cloud' | 'local' | 'raw-tracks' | false
    enable_prejoin_ui?: boolean    // Show pre-join screen
    enable_network_ui?: boolean    // Show network quality indicator
    enable_people_ui?: boolean     // Show participant list
    lang?: string                  // UI language
    geo?: string                   // Preferred geo region
  }
}

export interface DailyRoom {
  id: string
  name: string
  api_created: boolean
  privacy: 'public' | 'private'
  url: string
  created_at: string
  config: {
    exp?: number
    nbf?: number
    max_participants?: number
    enable_recording?: string
    enable_screenshare?: boolean
    enable_chat?: boolean
    enable_knocking?: boolean
    start_video_off?: boolean
    start_audio_off?: boolean
  }
}

export interface DailyMeetingToken {
  token: string
}

export interface DailyMeetingTokenConfig {
  room_name: string
  user_id?: string
  user_name?: string
  is_owner?: boolean              // Can start/stop recording, remove participants
  enable_screenshare?: boolean
  enable_recording?: 'cloud' | 'local' | 'raw-tracks' | false
  start_video_off?: boolean
  start_audio_off?: boolean
  exp?: number                    // Token expiration (Unix seconds)
  nbf?: number                    // Not before (Unix seconds)
}

export interface DailyRecording {
  id: string
  room_name: string
  start_ts: number
  status: 'recording' | 'processing' | 'ready' | 'failed'
  max_participants: number
  duration: number
  tracks?: {
    video?: string[]
    audio?: string[]
  }
  s3_bucket?: string
  s3_region?: string
  download_link?: string
}

export interface DailyWebhookEvent {
  event: string
  timestamp: number
  payload: Record<string, unknown>
}

// ============================================================================
// API HELPERS
// ============================================================================

async function dailyFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!DAILY_API_KEY) {
    throw new Error('DAILY_API_KEY environment variable is not set')
  }

  const response = await fetch(`${DAILY_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${DAILY_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(
      `Daily.co API error: ${response.status} ${response.statusText} - ${JSON.stringify(error)}`
    )
  }

  return response.json()
}

// ============================================================================
// ROOM MANAGEMENT
// ============================================================================

/**
 * Create a new Daily.co room
 */
export async function createRoom(config: DailyRoomConfig = {}): Promise<DailyRoom> {
  const roomName = config.name || generateRoomName()
  
  const body = {
    name: roomName,
    privacy: config.privacy || 'private',
    properties: {
      enable_screenshare: true,
      enable_chat: true,
      enable_knocking: true,        // Waiting room
      enable_prejoin_ui: true,      // Pre-call check
      enable_network_ui: true,      // Show connection quality
      enable_people_ui: true,       // Show participant list
      enable_recording: 'cloud',    // Cloud recording
      max_participants: 2,          // 1:1 calls
      ...config.properties,
    },
  }

  return dailyFetch<DailyRoom>('/rooms', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/**
 * Get room details
 */
export async function getRoom(roomName: string): Promise<DailyRoom> {
  return dailyFetch<DailyRoom>(`/rooms/${roomName}`)
}

/**
 * Delete a room
 */
export async function deleteRoom(roomName: string): Promise<{ deleted: boolean }> {
  return dailyFetch<{ deleted: boolean }>(`/rooms/${roomName}`, {
    method: 'DELETE',
  })
}

/**
 * List all rooms
 */
export async function listRooms(): Promise<{ data: DailyRoom[] }> {
  return dailyFetch<{ data: DailyRoom[] }>('/rooms')
}

/**
 * Update room settings
 */
export async function updateRoom(
  roomName: string,
  config: Partial<DailyRoomConfig['properties']>
): Promise<DailyRoom> {
  return dailyFetch<DailyRoom>(`/rooms/${roomName}`, {
    method: 'POST',
    body: JSON.stringify({ properties: config }),
  })
}

// ============================================================================
// MEETING TOKENS
// ============================================================================

/**
 * Create a meeting token for a participant
 * Tokens control permissions and identify users
 */
export async function createMeetingToken(
  config: DailyMeetingTokenConfig
): Promise<DailyMeetingToken> {
  const body = {
    properties: {
      room_name: config.room_name,
      user_id: config.user_id,
      user_name: config.user_name,
      is_owner: config.is_owner || false,
      enable_screenshare: config.enable_screenshare ?? true,
      enable_recording: config.enable_recording ?? 'cloud',
      start_video_off: config.start_video_off ?? false,
      start_audio_off: config.start_audio_off ?? false,
      // Token valid for 24 hours by default
      exp: config.exp || Math.floor(Date.now() / 1000) + 86400,
      nbf: config.nbf,
    },
  }

  return dailyFetch<DailyMeetingToken>('/meeting-tokens', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/**
 * Create a host token with full permissions
 */
export async function createHostToken(
  roomName: string,
  userId: string,
  userName: string
): Promise<DailyMeetingToken> {
  return createMeetingToken({
    room_name: roomName,
    user_id: userId,
    user_name: userName,
    is_owner: true,
    enable_screenshare: true,
    enable_recording: 'cloud',
  })
}

/**
 * Create a participant token with limited permissions
 */
export async function createParticipantToken(
  roomName: string,
  userId: string,
  userName: string
): Promise<DailyMeetingToken> {
  return createMeetingToken({
    room_name: roomName,
    user_id: userId,
    user_name: userName,
    is_owner: false,
    enable_screenshare: true,
    enable_recording: false,
  })
}

// ============================================================================
// RECORDINGS
// ============================================================================

/**
 * List recordings for a room
 */
export async function listRecordings(roomName?: string): Promise<{ data: DailyRecording[] }> {
  const endpoint = roomName ? `/recordings?room_name=${roomName}` : '/recordings'
  return dailyFetch<{ data: DailyRecording[] }>(endpoint)
}

/**
 * Get recording details
 */
export async function getRecording(recordingId: string): Promise<DailyRecording> {
  return dailyFetch<DailyRecording>(`/recordings/${recordingId}`)
}

/**
 * Get recording access link (download URL)
 */
export async function getRecordingAccessLink(
  recordingId: string
): Promise<{ download_link: string }> {
  return dailyFetch<{ download_link: string }>(`/recordings/${recordingId}/access-link`)
}

/**
 * Delete a recording
 */
export async function deleteRecording(recordingId: string): Promise<{ deleted: boolean }> {
  return dailyFetch<{ deleted: boolean }>(`/recordings/${recordingId}`, {
    method: 'DELETE',
  })
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a unique, readable room name
 * Format: vf-{timestamp}-{random}
 */
export function generateRoomName(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `vf-${timestamp}-${random}`
}

/**
 * Get the full Daily.co room URL
 */
export function getRoomUrl(roomName: string): string {
  return `https://${DAILY_DOMAIN}.daily.co/${roomName}`
}

/**
 * Calculate session expiration (24 hours from now by default)
 */
export function getDefaultExpiration(hoursFromNow = 24): number {
  return Math.floor(Date.now() / 1000) + (hoursFromNow * 3600)
}

/**
 * Verify a webhook signature from Daily.co
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // Daily.co uses HMAC-SHA256 for webhook signatures
  // This requires the webhook secret from your Daily.co dashboard
  const crypto = require('crypto')
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const expectedSignature = hmac.digest('hex')
  return signature === expectedSignature
}

// ============================================================================
// PRESETS FOR VIBRATIONFIT SESSIONS
// ============================================================================

/**
 * Create a 1:1 coaching room with optimal settings
 */
export async function createOneOnOneRoom(
  scheduledAt: Date,
  durationMinutes = 60
): Promise<DailyRoom> {
  // Room expires 30 minutes after scheduled end time
  const expirationTime = new Date(scheduledAt)
  expirationTime.setMinutes(expirationTime.getMinutes() + durationMinutes + 30)
  
  return createRoom({
    properties: {
      max_participants: 2,
      enable_knocking: true,        // Waiting room
      enable_screenshare: true,
      enable_chat: true,
      enable_recording: 'cloud',
      enable_prejoin_ui: true,
      exp: Math.floor(expirationTime.getTime() / 1000),
    },
  })
}

/**
 * Create a group session room
 */
export async function createGroupRoom(
  scheduledAt: Date,
  maxParticipants = 10,
  durationMinutes = 90
): Promise<DailyRoom> {
  const expirationTime = new Date(scheduledAt)
  expirationTime.setMinutes(expirationTime.getMinutes() + durationMinutes + 30)
  
  return createRoom({
    properties: {
      max_participants: maxParticipants,
      enable_knocking: true,
      enable_screenshare: true,
      enable_chat: true,
      enable_recording: 'cloud',
      enable_prejoin_ui: true,
      exp: Math.floor(expirationTime.getTime() / 1000),
    },
  })
}

/**
 * Create an Alignment Gym room (unlimited participants, host-led)
 * Members join with camera/mic off by default; no waiting room.
 */
export async function createAlignmentGymRoom(
  scheduledAt: Date,
  durationMinutes = 90
): Promise<DailyRoom> {
  const expirationTime = new Date(scheduledAt)
  expirationTime.setMinutes(expirationTime.getMinutes() + durationMinutes + 30)
  
  return createRoom({
    properties: {
      // No max_participants — Daily.co bills by minutes, no cap needed
      enable_knocking: false,         // No waiting room — open to all members
      enable_screenshare: true,
      enable_chat: true,
      enable_recording: 'cloud',
      enable_prejoin_ui: true,
      start_video_off: true,          // Members join with camera off
      start_audio_off: true,          // Members join muted
      exp: Math.floor(expirationTime.getTime() / 1000),
    },
  })
}

/**
 * Create a webinar/large event room
 */
export async function createWebinarRoom(
  scheduledAt: Date,
  durationMinutes = 120
): Promise<DailyRoom> {
  const expirationTime = new Date(scheduledAt)
  expirationTime.setMinutes(expirationTime.getMinutes() + durationMinutes + 30)
  
  return createRoom({
    properties: {
      // No max_participants — Daily.co bills by minutes, no cap needed
      enable_knocking: false,       // No waiting room for webinars
      enable_screenshare: true,
      enable_chat: true,
      enable_recording: 'cloud',
      enable_prejoin_ui: true,
      start_video_off: true,        // Participants join with camera off
      start_audio_off: true,        // Participants join muted
      exp: Math.floor(expirationTime.getTime() / 1000),
    },
  })
}

