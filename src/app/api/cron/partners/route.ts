/**
 * Partners Daily Cron
 *
 * GET /api/cron/partners — runs daily after provider cost sync.
 * Finalizes profit snapshots for ended cycles and approves referral
 * commissions whose refund hold has passed. Logic: src/lib/partners/daily.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { runPartnersDaily } from '@/lib/partners/daily'

export const runtime = 'nodejs'
export const maxDuration = 300
export const dynamic = 'force-dynamic'

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runPartnersDaily(createServiceClient())
    console.log('[partners cron] done:', result)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('[partners cron] failed:', err)
    return NextResponse.json({ error: 'Partners cron failed' }, { status: 500 })
  }
}
