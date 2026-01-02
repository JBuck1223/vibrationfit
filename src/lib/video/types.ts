/**
 * Video Session Types
 * 
 * Shared types for video session management across client and server.
 */

// ============================================================================
// DATABASE TYPES (matching Supabase schema)
// ============================================================================

export type VideoSessionType = 'one_on_one' | 'group' | 'workshop' | 'webinar'

export type VideoSessionStatus = 
  | 'scheduled' 
  | 'waiting' 
  | 'live' 
  | 'completed' 
  | 'cancelled' 
  | 'no_show'

export type VideoRecordingStatus = 
  | 'none' 
  | 'recording' 
  | 'processing' 
  | 'ready' 
  | 'uploaded' 
  | 'failed'

export interface VideoSession {
  id: string
  daily_room_name: string
  daily_room_url: string
  title: string
  description?: string
  session_type: VideoSessionType
  status: VideoSessionStatus
  scheduled_at: string
  scheduled_duration_minutes: number
  started_at?: string
  ended_at?: string
  actual_duration_seconds?: number
  host_user_id: string
  recording_status: VideoRecordingStatus
  daily_recording_id?: string
  recording_s3_key?: string
  recording_url?: string
  recording_duration_seconds?: number
  enable_recording: boolean
  enable_transcription: boolean
  enable_waiting_room: boolean
  max_participants: number
  host_notes?: string
  session_summary?: string
  created_at: string
  updated_at: string
}

export interface VideoSessionParticipant {
  id: string
  session_id: string
  user_id?: string
  email?: string
  phone?: string
  name?: string
  invited_at: string
  joined_at?: string
  left_at?: string
  duration_seconds?: number
  camera_on_percent?: number
  mic_on_percent?: number
  is_host: boolean
  attended: boolean
  created_at: string
  updated_at: string
}

export interface VideoSessionMessage {
  id: string
  session_id: string
  user_id?: string
  sender_name: string
  message: string
  message_type: 'chat' | 'question' | 'reaction' | 'system'
  sent_at: string
  created_at: string
}

export interface VideoSessionRecording {
  id: string
  session_id: string
  daily_recording_id?: string
  daily_download_url?: string
  s3_bucket?: string
  s3_key?: string
  s3_url?: string
  file_size_bytes?: number
  duration_seconds?: number
  format: string
  transcript_text?: string
  transcript_s3_key?: string
  status: VideoRecordingStatus
  error_message?: string
  is_public: boolean
  resource_library_id?: string
  recorded_at?: string
  processed_at?: string
  created_at: string
  updated_at: string
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateSessionRequest {
  title: string
  description?: string
  session_type?: VideoSessionType
  scheduled_at: string  // ISO string
  scheduled_duration_minutes?: number
  participant_email?: string
  participant_name?: string
  participant_phone?: string
  host_admin_id?: string
  enable_recording?: boolean
  enable_waiting_room?: boolean
}

export interface CreateSessionResponse {
  session: VideoSession
  host_token: string
  room_url: string
}

export interface JoinSessionRequest {
  session_id: string
}

export interface JoinSessionResponse {
  session: VideoSession
  token: string
  room_url: string
  is_host: boolean
}

export interface UpdateSessionRequest {
  title?: string
  description?: string
  scheduled_at?: string
  scheduled_duration_minutes?: number
  status?: VideoSessionStatus
  host_notes?: string
  session_summary?: string
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export type CallState = 
  | 'idle'              // Not in a call
  | 'joining'           // Connecting to Daily.co
  | 'waiting'           // In waiting room
  | 'in-call'           // Active call
  | 'leaving'           // Disconnecting
  | 'left'              // Call ended
  | 'error'             // Connection error

export interface Participant {
  id: string
  user_id?: string
  user_name: string
  local: boolean
  video: boolean
  audio: boolean
  screen: boolean
  joined_at: Date
}

export interface DeviceInfo {
  deviceId: string
  label: string
  kind: 'audioinput' | 'videoinput' | 'audiooutput'
}

export interface CallSettings {
  camera: boolean
  microphone: boolean
  speaker: boolean
  selectedCamera?: string
  selectedMicrophone?: string
  selectedSpeaker?: string
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

export interface DailyWebhookPayload {
  event: DailyWebhookEventType
  timestamp: number
  room: string
  data: Record<string, unknown>
}

export type DailyWebhookEventType =
  | 'meeting.started'
  | 'meeting.ended'
  | 'participant.joined'
  | 'participant.left'
  | 'recording.started'
  | 'recording.stopped'
  | 'recording.ready-to-download'
  | 'recording.error'

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getSessionTypeLabel(type: VideoSessionType): string {
  const labels: Record<VideoSessionType, string> = {
    one_on_one: '1:1 Session',
    group: 'Group Session',
    workshop: 'Workshop',
    webinar: 'Live Event',
  }
  return labels[type]
}

export function getSessionStatusLabel(status: VideoSessionStatus): string {
  const labels: Record<VideoSessionStatus, string> = {
    scheduled: 'Scheduled',
    waiting: 'Waiting Room',
    live: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
  }
  return labels[status]
}

export function getSessionStatusColor(status: VideoSessionStatus): string {
  const colors: Record<VideoSessionStatus, string> = {
    scheduled: 'text-blue-400',
    waiting: 'text-yellow-400',
    live: 'text-green-400',
    completed: 'text-gray-400',
    cancelled: 'text-red-400',
    no_show: 'text-orange-400',
  }
  return colors[status]
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`
  }
  return `${secs}s`
}

export function isSessionJoinable(session: VideoSession): boolean {
  const now = new Date()
  const scheduledAt = new Date(session.scheduled_at)
  
  // Can join 10 minutes before scheduled time
  const joinableFrom = new Date(scheduledAt)
  joinableFrom.setMinutes(joinableFrom.getMinutes() - 10)
  
  // Can join until 30 minutes after scheduled end
  const joinableUntil = new Date(scheduledAt)
  joinableUntil.setMinutes(
    joinableUntil.getMinutes() + session.scheduled_duration_minutes + 30
  )
  
  return (
    now >= joinableFrom &&
    now <= joinableUntil &&
    session.status !== 'completed' &&
    session.status !== 'cancelled'
  )
}

