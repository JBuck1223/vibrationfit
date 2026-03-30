export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { queryRecipients, type BlastFilters } from '@/lib/crm/blast-filters'
import { filterSuppressed } from '@/lib/messaging/suppressions'

const PREVIEW_LIMIT = 100

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const filters: BlastFilters = body.filters ?? body
    const excludeSegmentId: string | undefined = body.excludeSegmentId
    const channel: string | undefined = body.channel

    if (!filters.audience) {
      return NextResponse.json({ error: 'Audience is required' }, { status: 400 })
    }

    const allRecipients = await queryRecipients({
      ...filters,
      exclude_segment_id: excludeSegmentId,
    })

    const { allowed, suppressed } = await filterSuppressed(allRecipients)

    const emailCount = allowed.filter(r => !!r.email).length
    const smsCount = allRecipients.filter(r => r.phone && r.smsOptIn).length

    return NextResponse.json({
      count: allowed.length,
      suppressedCount: suppressed.length,
      totalBeforeSuppression: allRecipients.length,
      emailCount,
      smsCount,
      recipients: allowed.slice(0, PREVIEW_LIMIT),
    })
  } catch (error: unknown) {
    console.error('Error in blast preview:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
