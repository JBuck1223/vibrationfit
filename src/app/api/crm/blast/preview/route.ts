export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { queryRecipients, type BlastFilters } from '@/lib/crm/blast-filters'

const PREVIEW_LIMIT = 100

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const filters: BlastFilters = await request.json()

    if (!filters.audience) {
      return NextResponse.json({ error: 'Audience is required' }, { status: 400 })
    }

    const recipients = await queryRecipients(filters)

    return NextResponse.json({
      count: recipients.length,
      recipients: recipients.slice(0, PREVIEW_LIMIT),
    })
  } catch (error: unknown) {
    console.error('Error in blast preview:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
