/**
 * Auto-Transcribe Cron Job
 *
 * GET /api/cron/auto-transcribe
 *
 * Runs every 10 minutes. Two responsibilities:
 * 1. Transcribes Alignment Gym sessions that have a recording but no transcript yet.
 * 2. Regenerates key points for sessions with old-format data (no timestamps).
 *
 * Processes one session per invocation to stay within time limits.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  transcribeSession,
  regenerateKeyPoints,
  keyPointsNeedRegeneration,
} from '@/lib/video/transcribe-session'

export const runtime = 'nodejs'
export const maxDuration = 300

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()

    // Priority 1: Sessions that need full transcription
    const { data: needsTranscript, error: q1Error } = await supabase
      .from('video_sessions')
      .select('id, title, recording_url, session_type')
      .or('session_type.eq.alignment_gym,title.ilike.%alignment gym%')
      .eq('status', 'completed')
      .not('recording_url', 'is', null)
      .is('transcript_text', null)
      .is('transcribed_at', null)
      .order('scheduled_at', { ascending: false })
      .limit(1)

    if (q1Error) {
      console.error('[cron/auto-transcribe] Query error:', q1Error)
      return NextResponse.json({ error: q1Error.message }, { status: 500 })
    }

    if (needsTranscript && needsTranscript.length > 0) {
      const session = needsTranscript[0]
      console.log(`[cron/auto-transcribe] Transcribing: ${session.title} (${session.id})`)

      const result = await transcribeSession(session.id)

      return NextResponse.json({
        action: 'transcribed',
        session_id: session.id,
        session_title: session.title,
        success: result.success,
        word_count: result.word_count,
        error: result.error,
      })
    }

    // Priority 2: Sessions that have a transcript but old-format key points (no timestamps)
    const { data: needsKeyPoints, error: q2Error } = await supabase
      .from('video_sessions')
      .select('id, title, session_type, transcript_key_points')
      .or('session_type.eq.alignment_gym,title.ilike.%alignment gym%')
      .eq('status', 'completed')
      .not('transcript_text', 'is', null)
      .order('scheduled_at', { ascending: false })
      .limit(20)

    if (q2Error) {
      console.error('[cron/auto-transcribe] Key points query error:', q2Error)
      return NextResponse.json({ error: q2Error.message }, { status: 500 })
    }

    const staleSession = needsKeyPoints?.find((s) =>
      keyPointsNeedRegeneration(s.transcript_key_points)
    )

    if (staleSession) {
      console.log(`[cron/auto-transcribe] Regenerating key points: ${staleSession.title} (${staleSession.id})`)

      const result = await regenerateKeyPoints(staleSession.id)

      return NextResponse.json({
        action: 'regenerated_key_points',
        session_id: staleSession.id,
        session_title: staleSession.title,
        success: result.success,
        error: result.error,
      })
    }

    return NextResponse.json({
      action: 'none',
      message: 'All sessions are up to date',
    })
  } catch (error) {
    console.error('[cron/auto-transcribe] Unexpected error:', error)
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}
