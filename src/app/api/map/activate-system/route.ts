import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { reminderTimeToPostgresTime } from '@/lib/map/reminder-time'

interface ActivateSystemCommitmentPayload {
  category: string
  type?: string
  title: string
  description?: string | null
  cadence: unknown
  activity_type: string
  notify_sms?: boolean
  notify_email?: boolean
  reminder_time?: string | null
  reminder_days?: number[] | null
}

interface ActivateSystemBody {
  title?: string
  timezone?: string
  map_weekly_reminder_email?: boolean
  map_weekly_reminder_sms?: boolean
  map_weekly_reminder_time?: string
  commitments: ActivateSystemCommitmentPayload[]
}

/**
 * POST /api/map/activate-system
 * Single-transaction system MAP activate (archive pillar actives + insert rituals).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as ActivateSystemBody
    if (!body.commitments?.length) {
      return NextResponse.json({ error: 'At least one commitment is required' }, { status: 400 })
    }

    const weeklyTime = body.map_weekly_reminder_time
      ? reminderTimeToPostgresTime(body.map_weekly_reminder_time)
      : null

    const { data, error } = await supabase.rpc('activate_system_map', {
      p_title: body.title ?? 'My MAP',
      p_timezone: body.timezone ?? 'America/New_York',
      p_map_weekly_reminder_email: body.map_weekly_reminder_email ?? true,
      p_map_weekly_reminder_sms: body.map_weekly_reminder_sms ?? true,
      p_map_weekly_reminder_time: weeklyTime,
      p_commitments: body.commitments,
    })

    if (error) {
      console.error('activate_system_map error:', error)
      return NextResponse.json({ error: error.message || 'Failed to activate MAP' }, { status: 500 })
    }

    return NextResponse.json({ result: data })
  } catch (err) {
    console.error('Error in POST /api/map/activate-system:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
