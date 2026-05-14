/**
 * Session Transcription API (Admin)
 *
 * POST /api/admin/recordings/transcribe
 *
 * Manually trigger transcription for a session. Uses the shared
 * transcribeSession logic (fal.ai Whisper + GPT-4o key points).
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { transcribeSession } from '@/lib/video/transcribe-session'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { session_id, force } = await request.json()

    if (!session_id) {
      return NextResponse.json({ error: 'session_id is required' }, { status: 400 })
    }

    const result = await transcribeSession(session_id, { force })

    if (!result.success) {
      const status = result.error?.includes('not found') ? 404
        : result.error?.includes('No recording') ? 422
        : result.error?.includes('already has') ? 409
        : 500
      return NextResponse.json({ error: result.error }, { status })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[transcribe] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Transcription failed unexpectedly' },
      { status: 500 }
    )
  }
}
