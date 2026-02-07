// /src/app/api/crm/metrics/update/route.ts
// API endpoint to trigger metrics update

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isUserAdmin } from '@/lib/supabase/admin'
import { updateActivityMetrics } from '@/lib/jobs/update-activity-metrics'

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

    // Get optional user_id from body
    const body = await request.json().catch(() => ({}))
    const userId = body.userId

    // Validate userId format if provided
    if (userId && typeof userId !== 'string') {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 })
    }

    // Trigger metrics update
    const result = await updateActivityMetrics(userId)

    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error('Error in metrics update API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
