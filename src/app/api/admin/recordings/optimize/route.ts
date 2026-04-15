/**
 * Session Recording Optimizer
 *
 * POST /api/admin/recordings/optimize
 *
 * Takes a session recording (fragmented MP4 from Daily.co) and re-encodes it
 * through AWS MediaConvert as a progressive-download MP4 with moov at front.
 *
 * Body: { session_id: string }
 * Returns: { session_id, jobId?, status, detail? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { optimizeRecording } from '@/lib/video/recording-optimize'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json().catch(() => ({}))
    const sessionId = body.session_id as string | undefined

    if (!sessionId) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      )
    }

    const result = await optimizeRecording(sessionId)
    return NextResponse.json(result)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[admin/recordings/optimize] Error:', msg)
    return NextResponse.json(
      { error: msg || 'Internal server error' },
      { status: 500 }
    )
  }
}
