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
  start_cloud_recording?: boolean // Auto-start cloud recording when this participant joins
  start_video_off?: boolean
  start_audio_off?: boolean
  exp?: number                    // Token expiration (Unix seconds)
  nbf?: number                    // Not before (Unix seconds)
}

export interface DailyRecording {
  id: string
  room_name: string
  start_ts: number
  status: 'recording' | 'processing' | 'ready' | 'finished' | 'failed'
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

  const contentType = response.headers.get('content-type') || ''

  if (!response.ok) {
    let errorBody: string
    if (contentType.includes('application/json')) {
      const error = await response.json().catch(() => ({}))
      errorBody = JSON.stringify(error)
    } else {
      const text = await response.text().catch(() => '')
      errorBody = text.slice(0, 200)
    }
    throw new Error(
      `Daily.co API error: ${response.status} ${response.statusText} - ${errorBody}`
    )
  }

  if (!contentType.includes('application/json')) {
    const text = await response.text()
    throw new Error(
      `Daily.co API returned non-JSON response (${contentType || 'no content-type'}): ${text.slice(0, 200)}`
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
      enable_knocking: true,
      enable_prejoin_ui: true,
      enable_network_ui: true,
      enable_people_ui: true,
      enable_recording: 'cloud',
      max_participants: 2,
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
  const properties: Record<string, unknown> = {
    room_name: config.room_name,
    user_id: config.user_id,
    user_name: config.user_name,
    is_owner: config.is_owner || false,
    enable_screenshare: config.enable_screenshare ?? true,
    enable_recording: config.enable_recording ?? 'cloud',
    start_video_off: config.start_video_off ?? false,
    start_audio_off: config.start_audio_off ?? false,
    exp: config.exp || Math.floor(Date.now() / 1000) + 86400,
    nbf: config.nbf,
  }

  if (config.start_cloud_recording) {
    properties.start_cloud_recording = true
  }

  const body = { properties }

  return dailyFetch<DailyMeetingToken>('/meeting-tokens', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/**
 * Create a host token with full permissions.
 * 
 * All session types use cloud recording (composited active-speaker layout).
 * The client auto-starts recording after the host joins.
 */
export async function createHostToken(
  roomName: string,
  userId: string,
  userName: string,
  sessionType?: string
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
 * Create a participant token with limited permissions.
 * For group sessions, participants join muted with camera off.
 */
export async function createParticipantToken(
  roomName: string,
  userId: string,
  userName: string,
  sessionType?: string
): Promise<DailyMeetingToken> {
  const isGroupSession = sessionType === 'group' || sessionType === 'workshop'
    || sessionType === 'alignment_gym' || sessionType === 'webinar'

  return createMeetingToken({
    room_name: roomName,
    user_id: userId,
    user_name: userName,
    is_owner: false,
    enable_screenshare: isGroupSession ? false : true,
    enable_recording: false,
    start_video_off: isGroupSession ? true : undefined,
    start_audio_off: isGroupSession ? true : undefined,
  })
}

// ============================================================================
// MEETINGS (session lookup)
// ============================================================================

export interface DailyMeeting {
  id: string
  room: string
  start_time: number
  duration: number
  ongoing: boolean
  max_participants: number
  participants: Array<{
    user_id?: string
    user_name?: string
    join_time: number
    duration: number
  }>
}

/**
 * Get meeting details by meeting session ID.
 * Resolves a Daily dashboard session URL to a room name + recording info.
 */
export async function getMeeting(meetingId: string): Promise<DailyMeeting> {
  return dailyFetch<DailyMeeting>(`/meetings/${meetingId}`)
}

/**
 * List meetings for a room (or all rooms).
 * Returns participant-level data for each meeting.
 * https://docs.daily.co/reference/rest-api/meetings/list-meetings
 */
export async function listMeetings(
  roomName?: string
): Promise<{ data: DailyMeeting[] }> {
  const params = new URLSearchParams()
  if (roomName) params.set('room', roomName)
  const query = params.toString()
  const endpoint = query ? `/meetings?${query}` : '/meetings'
  return dailyFetch<{ data: DailyMeeting[] }>(endpoint)
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
// ON-DEMAND ROOM PROVISIONING
// ============================================================================

/**
 * Ensure a Daily.co room exists and is joinable for a session.
 * Verifies the room hasn't expired or been deleted before trusting it.
 * Creates a fresh room on demand if needed.
 */
export async function ensureDailyRoom(session: {
  daily_room_name?: string | null
  daily_room_url?: string | null
  session_type: string
  scheduled_at: string
  scheduled_duration_minutes?: number
}): Promise<{ name: string; url: string; created: boolean }> {
  if (session.daily_room_name && session.daily_room_url) {
    try {
      const existing = await getRoom(session.daily_room_name)
      const exp = existing.config?.exp
      const nowSec = Math.floor(Date.now() / 1000)
      if (exp && exp < nowSec) {
        console.warn(`[ensureDailyRoom] Room "${session.daily_room_name}" expired — creating fresh one`)
        deleteRoom(session.daily_room_name).catch(() => {})
      } else {
        return { name: session.daily_room_name, url: session.daily_room_url, created: false }
      }
    } catch {
      console.warn(`[ensureDailyRoom] Room "${session.daily_room_name}" not found — creating fresh one`)
    }
  }

  // Use whichever is later: now or scheduled time, so rooms never expire immediately
  const now = new Date()
  const scheduled = new Date(session.scheduled_at)
  const scheduledAt = scheduled > now ? scheduled : now
  const duration = session.scheduled_duration_minutes || 60
  let room: DailyRoom

  switch (session.session_type) {
    case 'group':
    case 'workshop':
      room = await createGroupRoom(scheduledAt, 0, duration)
      break
    case 'alignment_gym':
      room = await createAlignmentGymRoom(scheduledAt, duration)
      break
    case 'webinar':
      room = await createWebinarRoom(scheduledAt, duration)
      break
    default:
      room = await createOneOnOneRoom(scheduledAt, duration)
  }

  return { name: room.name, url: room.url, created: true }
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
  const expirationTime = new Date(scheduledAt)
  expirationTime.setHours(expirationTime.getHours() + 24)
  
  return createRoom({
    properties: {
      max_participants: 2,
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
 * Create a group session room (cloud recording — active-speaker composite)
 */
export async function createGroupRoom(
  scheduledAt: Date,
  maxParticipants = 0,
  durationMinutes = 90
): Promise<DailyRoom> {
  const expirationTime = new Date(scheduledAt)
  expirationTime.setHours(expirationTime.getHours() + 24)
  
  return createRoom({
    properties: {
      max_participants: maxParticipants,
      enable_knocking: false,
      enable_screenshare: true,
      enable_chat: true,
      enable_recording: 'cloud',
      enable_prejoin_ui: true,
      start_video_off: true,
      start_audio_off: true,
      exp: Math.floor(expirationTime.getTime() / 1000),
    },
  })
}

/**
 * Create an Alignment Gym room (cloud recording — active-speaker composite).
 * Unlimited participants, host-led. Members join with camera/mic off by default.
 */
export async function createAlignmentGymRoom(
  scheduledAt: Date,
  durationMinutes = 90
): Promise<DailyRoom> {
  const expirationTime = new Date(scheduledAt)
  expirationTime.setHours(expirationTime.getHours() + 24)
  
  return createRoom({
    properties: {
      max_participants: 0,
      enable_knocking: false,
      enable_screenshare: true,
      enable_chat: true,
      enable_recording: 'cloud',
      enable_prejoin_ui: true,
      start_video_off: true,
      start_audio_off: true,
      exp: Math.floor(expirationTime.getTime() / 1000),
    },
  })
}

/**
 * Create a webinar/large event room (cloud recording — active-speaker composite)
 */
export async function createWebinarRoom(
  scheduledAt: Date,
  durationMinutes = 120
): Promise<DailyRoom> {
  const expirationTime = new Date(scheduledAt)
  expirationTime.setHours(expirationTime.getHours() + 24)
  
  return createRoom({
    properties: {
      max_participants: 0,
      enable_knocking: false,
      enable_screenshare: true,
      enable_chat: true,
      enable_recording: 'cloud',
      enable_prejoin_ui: true,
      start_video_off: true,
      start_audio_off: true,
      exp: Math.floor(expirationTime.getTime() / 1000),
    },
  })
}

