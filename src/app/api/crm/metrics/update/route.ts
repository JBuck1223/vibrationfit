// /src/app/api/crm/metrics/update/route.ts

// Force dynamic rendering (no caching)
export const dynamic = 'force-dynamic'
// API endpoint to trigger metrics update

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

    // Check if user is admin
    const isAdmin =
      user.email === 'buckinghambliss@gmail.com' ||
      user.email === 'admin@vibrationfit.com' ||
      user.user_metadata?.is_admin === true

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get optional user_id from body
    const body = await request.json().catch(() => ({}))
    const userId = body.userId

    // Trigger metrics update
    const result = await updateActivityMetrics(userId)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('❌ Error in metrics update API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}












