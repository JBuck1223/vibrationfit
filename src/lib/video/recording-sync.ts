/**
 * Recording Sync — Lightweight pull-based sync
 *
 * Daily.co writes recordings directly to our S3 bucket via custom S3 storage.
 * This module just checks Daily's API for completed recordings and updates
 * the database with the CDN URL. No file downloads or uploads needed.
 *
 * After syncing, newly synced recordings are automatically submitted to
 * MediaConvert for optimization (fragmented MP4 → progressive MP4).
 */

import { createServiceClient } from '@/lib/supabase/service'
import { listRecordings, getRecording } from '@/lib/video/daily'
import { optimizeRecording } from '@/lib/video/recording-optimize'

const CDN_URL = 'https://media.vibrationfit.com'

export interface SyncResult {
  session_id: string
  room_name: string
  title: string
  action: 'synced' | 'already_synced' | 'not_ready' | 'no_recordings' | 'error'
  recording_url?: string
  error_detail?: string
}

export interface SyncSummary {
  synced: number
  already_synced: number
  not_ready: number
  errors: number
  results: SyncResult[]
}

/**
 * Sync recordings for sessions that need them.
 *
 * With direct-to-S3 enabled, Daily writes the file to our bucket automatically.
 * This function queries Daily's REST API for recording metadata (S3 key, duration,
 * status) and updates video_sessions with the CDN URL. No file transfer involved.
 */
export async function syncRecordings(opts?: {
  sessionId?: string
}): Promise<SyncSummary> {
  const supabase = createServiceClient()

  let query = supabase
    .from('video_sessions')
    .select('id, daily_room_name, daily_recording_id, recording_status, recording_url, title')
    .not('daily_room_name', 'is', null)

  if (opts?.sessionId) {
    query = query.eq('id', opts.sessionId)
  } else {
    query = query
      .in('recording_status', ['recording', 'processing', 'failed', 'none'])
      .order('created_at', { ascending: false })
      .limit(50)
  }

  const { data: pendingSessions, error: dbError } = await query

  if (dbError) {
    return {
      synced: 0,
      already_synced: 0,
      not_ready: 0,
      errors: 1,
      results: [{
        session_id: '',
        room_name: '',
        title: '',
        action: 'error',
        error_detail: dbError.message,
      }],
    }
  }

  const results: SyncResult[] = []

  for (const session of pendingSessions || []) {
    try {
      if (session.recording_url && session.recording_status === 'uploaded') {
        results.push({
          session_id: session.id,
          room_name: session.daily_room_name,
          title: session.title,
          action: 'already_synced',
          recording_url: session.recording_url,
        })
        continue
      }

      const { data: recordings } = await listRecordings(session.daily_room_name)

      if (!recordings || recordings.length === 0) {
        results.push({
          session_id: session.id,
          room_name: session.daily_room_name,
          title: session.title,
          action: 'no_recordings',
        })
        continue
      }

      const ready = recordings.filter(
        (r) => r.status === 'ready' || r.status === 'finished'
      )

      if (ready.length === 0) {
        results.push({
          session_id: session.id,
          room_name: session.daily_room_name,
          title: session.title,
          action: 'not_ready',
        })
        continue
      }

      const best = ready.sort((a, b) => (b.start_ts || 0) - (a.start_ts || 0))[0]

      let recordingDetails = best
      try {
        recordingDetails = await getRecording(best.id)
      } catch {
        // Fall back to the list data if detail fetch fails
      }

      // Daily's API returns the actual S3 key as `s3key` (no underscore) when
      // using custom S3 storage. Fall back to the room/id pattern for legacy recordings.
      const details = recordingDetails as unknown as Record<string, unknown>
      const s3Key = (details.s3key as string)
        || (details.s3_key as string)
        || `session-recordings/${session.daily_room_name}/${best.id}.mp4`

      const recordingUrl = `${CDN_URL}/${s3Key}`
      const duration = recordingDetails.duration || best.duration || 0

      const { error: updateError } = await supabase
        .from('video_sessions')
        .update({
          recording_status: 'uploaded',
          recording_s3_key: s3Key,
          recording_url: recordingUrl,
          recording_duration_seconds: duration,
          daily_recording_id: best.id,
        })
        .eq('id', session.id)

      if (updateError) {
        results.push({
          session_id: session.id,
          room_name: session.daily_room_name,
          title: session.title,
          action: 'error',
          error_detail: updateError.message,
        })
        continue
      }

      results.push({
        session_id: session.id,
        room_name: session.daily_room_name,
        title: session.title,
        action: 'synced',
        recording_url: recordingUrl,
      })
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      console.error(`[recording-sync] Error syncing ${session.daily_room_name}:`, errMsg)
      results.push({
        session_id: session.id,
        room_name: session.daily_room_name,
        title: session.title,
        action: 'error',
        error_detail: errMsg,
      })
    }
  }

  // Auto-submit newly synced recordings for MediaConvert optimization.
  // Fire-and-forget: optimization runs in background and the status endpoint
  // or a future poll will finalize the URL swap.
  const synced = results.filter((r) => r.action === 'synced')
  for (const r of synced) {
    optimizeRecording(r.session_id).catch((err) =>
      console.error(`[recording-sync] optimize trigger failed for ${r.session_id}:`, err)
    )
  }

  return {
    synced: synced.length,
    already_synced: results.filter((r) => r.action === 'already_synced').length,
    not_ready: results.filter((r) => r.action === 'not_ready').length,
    errors: results.filter((r) => r.action === 'error').length,
    results,
  }
}
