/**
 * Recording Sync Cron Job
 *
 * GET /api/cron/recording-sync
 *
 * Runs every 5 minutes. Daily.co writes recordings directly to our S3 bucket;
 * this cron just checks Daily's API for completed recordings and updates the
 * database with CDN URLs. No file downloads or uploads involved.
 */

import { NextRequest, NextResponse } from 'next/server'
import { syncRecordings } from '@/lib/video/recording-sync'

export const runtime = 'nodejs'
export const maxDuration = 60

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const summary = await syncRecordings()

    console.log(
      `[cron/recording-sync] ${summary.synced} synced, ${summary.not_ready} not ready, ${summary.errors} errors`
    )

    return NextResponse.json(summary)
  } catch (error) {
    console.error('[cron/recording-sync] Unexpected error:', error)
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}
