import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scheduleCommitmentReminders } from '@/lib/map/notifications'

/**
 * POST /api/map/schedule-reminders
 * Schedules per-commitment MAP reminders for the authenticated user.
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await scheduleCommitmentReminders(user.id)
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error('Error in POST /api/map/schedule-reminders:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
