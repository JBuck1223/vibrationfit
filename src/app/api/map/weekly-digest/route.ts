import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { OUTBOUND_URL } from '@/lib/urls'

const APP_BASE_URL = OUTBOUND_URL

/**
 * POST /api/map/weekly-digest
 *
 * Cron-callable endpoint that schedules one consolidated weekly SMS per user
 * with active commitments. Designed to run once per week (e.g., Monday 7am UTC).
 *
 * Creates scheduled_messages rows with related_entity_type = 'map_weekly_digest'.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    const { data: users, error: usersError } = await supabase
      .from('commitments')
      .select('user_id')
      .eq('status', 'active')
      .then(result => {
        if (result.error) return result
        const uniqueIds = [...new Set(result.data?.map(r => r.user_id))]
        return { data: uniqueIds, error: null }
      })

    if (usersError || !users || users.length === 0) {
      return NextResponse.json({ message: 'No active commitments found', scheduled: 0 })
    }

    const { data: accounts } = await supabase
      .from('user_accounts')
      .select('id, phone, sms_opt_in, timezone')
      .in('id', users)
      .eq('sms_opt_in', true)
      .not('phone', 'is', null)

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ message: 'No SMS-eligible users', scheduled: 0 })
    }

    await supabase
      .from('scheduled_messages')
      .delete()
      .eq('related_entity_type', 'map_weekly_digest')
      .eq('status', 'pending')

    let scheduled = 0

    for (const account of accounts) {
      const { data: commitments } = await supabase
        .from('commitments')
        .select('title, category, cadence')
        .eq('user_id', account.id)
        .eq('status', 'active')
        .order('created_at', { ascending: true })

      if (!commitments || commitments.length === 0) continue

      const body = buildDigestBody(commitments)

      const scheduledFor = getNextMondayMorning(account.timezone || 'America/New_York')

      const { error: insertError } = await supabase
        .from('scheduled_messages')
        .insert({
          message_type: 'sms',
          recipient_phone: account.phone,
          recipient_user_id: account.id,
          body,
          scheduled_for: scheduledFor.toISOString(),
          status: 'pending',
          related_entity_type: 'map_weekly_digest',
        })

      if (!insertError) scheduled++
    }

    return NextResponse.json({ message: `Scheduled ${scheduled} weekly digests`, scheduled })
  } catch (err) {
    console.error('Error in POST /api/map/weekly-digest:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

interface CommitmentRow {
  title: string
  category: string
  cadence: { kind: string; count?: number } | null
}

function buildDigestBody(commitments: CommitmentRow[]): string {
  const lines = commitments.map(c => {
    const freq = formatCadence(c.cadence)
    return `- ${c.title} (${freq})`
  })

  return `Your MAP this week:\n${lines.join('\n')}\n\nOpen your MAP: ${APP_BASE_URL}/map`
}

function formatCadence(cadence: { kind: string; count?: number } | null): string {
  if (!cadence) return 'weekly'
  if (cadence.kind === 'daily') return 'daily'
  if (cadence.kind === 'days_per_week' && cadence.count) return `${cadence.count}x/week`
  return 'weekly'
}

function getNextMondayMorning(timezone: string): Date {
  const now = new Date()
  const day = now.getUTCDay()
  const daysUntilMonday = day === 0 ? 1 : day === 1 ? 7 : 8 - day
  const monday = new Date(now)
  monday.setUTCDate(monday.getUTCDate() + daysUntilMonday)
  monday.setUTCHours(11, 0, 0, 0) // 7am ET = 11 UTC (approximate)
  return monday
}
