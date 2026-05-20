import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateMapDigestEmail } from '@/lib/email/templates/map-weekly-digest'
import { parseReminderTimeToParts } from '@/lib/map/reminder-time'
import { OUTBOUND_URL } from '@/lib/urls'

const APP_BASE_URL = OUTBOUND_URL

/**
 * POST /api/map/weekly-digest
 *
 * Cron-callable endpoint that schedules weekly MAP digest messages (email + SMS)
 * for users with active commitments. Runs Monday mornings.
 *
 * Respects weekly digest toggles on the active MAP (user_maps): map_weekly_reminder_email,
 * map_weekly_reminder_sms, map_weekly_reminder_time (local Monday send time with user_maps.timezone,
 * falling back to user_accounts.timezone). Plus global sms_opt_in / email_opt_in on user_accounts.
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
      .select('id, first_name, phone, email, sms_opt_in, email_opt_in, timezone')
      .in('id', users)

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ message: 'No eligible users', scheduled: 0 })
    }

    const { data: activeMaps } = await supabase
      .from('user_maps')
      .select(
        'user_id, timezone, map_weekly_reminder_email, map_weekly_reminder_sms, map_weekly_reminder_time',
      )
      .eq('is_active', true)
      .eq('is_draft', false)
      .in('user_id', users)

    const mapByUserId = new Map(
      (activeMaps ?? []).map(m => [m.user_id as string, m]),
    )

    // Clear any previous pending weekly digest messages
    await supabase
      .from('scheduled_messages')
      .delete()
      .eq('related_entity_type', 'map_weekly_digest')
      .eq('status', 'pending')

    let scheduledSms = 0
    let scheduledEmail = 0

    for (const account of accounts) {
      const mapRow = mapByUserId.get(account.id) as
        | {
            timezone: string | null
            map_weekly_reminder_email: boolean | null
            map_weekly_reminder_sms: boolean | null
            map_weekly_reminder_time: string | null
          }
        | undefined

      const digestTz = mapRow?.timezone || account.timezone || 'America/New_York'
      const wantsWeeklyEmail = mapRow?.map_weekly_reminder_email !== false
      const wantsWeeklySms = mapRow?.map_weekly_reminder_sms !== false

      const wantsSms = wantsWeeklySms && account.sms_opt_in && !!account.phone
      const wantsEmail = wantsWeeklyEmail && account.email_opt_in !== false && !!account.email

      if (!wantsSms && !wantsEmail) continue

      const { data: commitments } = await supabase
        .from('commitments')
        .select('title, category, cadence, activity_type')
        .eq('user_id', account.id)
        .eq('status', 'active')
        .order('created_at', { ascending: true })

      if (!commitments || commitments.length === 0) continue

      const scheduledFor = getNextMondayMorning(
        digestTz,
        mapRow?.map_weekly_reminder_time ?? null,
      )

      if (wantsSms) {
        const body = buildDigestSmsBody(commitments)
        const { error: smsErr } = await supabase
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
        if (!smsErr) scheduledSms++
      }

      if (wantsEmail) {
        const { subject, htmlBody, textBody } = generateMapDigestEmail(
          account.first_name,
          commitments,
        )
        const { error: emailErr } = await supabase
          .from('scheduled_messages')
          .insert({
            message_type: 'email',
            recipient_email: account.email,
            recipient_user_id: account.id,
            subject,
            body: htmlBody,
            text_body: textBody,
            scheduled_for: scheduledFor.toISOString(),
            status: 'pending',
            related_entity_type: 'map_weekly_digest',
          })
        if (!emailErr) scheduledEmail++
      }
    }

    return NextResponse.json({
      message: `Scheduled ${scheduledSms} SMS + ${scheduledEmail} email weekly digests`,
      scheduledSms,
      scheduledEmail,
    })
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

function buildDigestSmsBody(commitments: CommitmentRow[]): string {
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

/**
 * Compute next Monday at the user's preferred local time, expressed as UTC.
 */
function getNextMondayMorning(timezone: string, reminderTime: string | null): Date {
  const { hour: H, minute: Mi } = parseReminderTimeToParts(reminderTime)
  const now = new Date()
  const day = now.getUTCDay()
  const daysUntilMonday = day === 0 ? 1 : day === 1 ? 7 : 8 - day
  const monday = new Date(now)
  monday.setUTCDate(monday.getUTCDate() + daysUntilMonday)

  const year = monday.getUTCFullYear()
  const month = String(monday.getUTCMonth() + 1).padStart(2, '0')
  const dayStr = String(monday.getUTCDate()).padStart(2, '0')
  const localStr = `${year}-${month}-${dayStr}T${String(H).padStart(2, '0')}:${String(Mi).padStart(2, '0')}:00`

  try {
    const utcGuess = new Date(localStr + 'Z')
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    const parts = formatter.formatToParts(utcGuess)
    const fh = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10)
    const fm = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10)
    const deltaMinutes = H * 60 + Mi - (fh * 60 + fm)
    return new Date(utcGuess.getTime() + deltaMinutes * 60 * 1000)
  } catch {
    monday.setUTCHours(11, 0, 0, 0)
    return monday
  }
}
