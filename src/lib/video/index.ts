/**
 * Video Module - VibrationFit Video Conferencing
 * 
 * This module provides video conferencing capabilities using Daily.co.
 * 
 * Server-side: Use functions from ./daily.ts
 * Client-side: Use the React components and hooks
 * 
 * Environment Variables:
 * - DAILY_API_KEY: Server-side API key (secret)
 * - DAILY_DOMAIN: Your Daily.co domain
 * - NEXT_PUBLIC_DAILY_DOMAIN: Client-side domain reference
 */

// Server-side exports
export * from './daily'

// Re-export types
export type {
  DailyRoom,
  DailyRoomConfig,
  DailyMeetingToken,
  DailyMeetingTokenConfig,
  DailyRecording,
  DailyWebhookEvent,
} from './daily'

