/**
 * Daily.co participant send permissions.
 * Group session participants start without screen share; the host grants it dynamically.
 */

export type DailySendTrack = 'audio' | 'video' | 'screenVideo' | 'screenAudio'

/** Default for group-session participants (mic + camera only). */
export const DAILY_SEND_BASE: DailySendTrack[] = ['audio', 'video']

/** Granted when host unlocks a speaker or opens the floor. */
export const DAILY_SEND_WITH_SCREEN: DailySendTrack[] = [
  'audio',
  'video',
  'screenVideo',
  'screenAudio',
]
