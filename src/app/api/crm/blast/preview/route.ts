export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isUserAdmin } from '@/lib/supabase/admin'
import { queryRecipients, type BlastFilters } from '@/lib/crm/blast-filters'

const PREVIEW_LIMIT = 100

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isUserAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
