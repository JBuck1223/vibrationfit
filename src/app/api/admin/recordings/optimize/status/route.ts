/**
 * Recording Optimization Status / Finalize
 *
 * GET /api/admin/recordings/optimize/status?jobId=xxx&session_id=yyy
 *
 * Polls the MediaConvert job status. When the job is COMPLETE, updates the
 * session's recording_url to the optimized file.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { checkOptimizationJob } from '@/lib/video/recording-optimize'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const sessionId = searchParams.get('session_id')

    if (!jobId || !sessionId) {
      return NextResponse.json(
        { error: 'jobId and session_id are required' },
        { status: 400 }
      )
    }

    const result = await checkOptimizationJob(jobId, sessionId)
    return NextResponse.json(result)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[admin/recordings/optimize/status] Error:', msg)
    return NextResponse.json(
      { error: msg || 'Internal server error' },
      { status: 500 }
    )
  }
}
