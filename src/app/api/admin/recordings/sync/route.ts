/**
 * Admin Recording Sync
 *
 * POST /api/admin/recordings/sync
 *
 * Admin-only wrapper around the shared syncRecordings() utility.
 * Accepts optional { session_id } to sync a single session.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { syncRecordings } from '@/lib/video/recording-sync'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json().catch(() => ({}))
    const sessionId = body.session_id as string | undefined

    const summary = await syncRecordings(sessionId ? { sessionId } : undefined)

    return NextResponse.json(summary)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[admin/recordings/sync] Error:', msg)
    return NextResponse.json({ error: msg || 'Internal server error' }, { status: 500 })
  }
}
