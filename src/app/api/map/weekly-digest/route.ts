import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateMapDigestEmail } from '@/lib/email/templates/map-weekly-digest'
import { parseReminderTimeToParts } from '@/lib/map/reminder-time'
import { OUTBOUND_URL } from '@/lib/urls'

export const maxDuration = 60

const APP_BASE_URL = OUTBOUND_URL
const CRON_SECRET = process.env.CRON_SECRET

/**
 * GET  /api/map/weekly-digest  (Vercel cron — Monday 11:00 UTC)
 * POST /api/map/weekly-digest  (manual trigger with CRON_SECRET)
 *
 * Schedules weekly MAP digest messages (email + SMS) for users with active
 * commitments. Respects weekly digest toggles on the active MAP (user_maps):
 * map_weekly_reminder_email, map_weekly_reminder_sms, map_weekly_reminder_time
 * (local Monday send time with user_maps.timezone, falling back to
 * user_accounts.timezone). Plus global sms_opt_in / email_opt_in on user_accounts.
 */
export async function GET(request: NextRequest) {
  if (!(await authorize(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return scheduleWeeklyDigests()
}

export async function POST(request: NextRequest) {
  if (!(await authorize(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return scheduleWeeklyDigests()
}

async function authorize(request: NextRequest): Promise<boolean> {
  const isVercelCron =
    request.headers.get('x-vercel-cron') === '1' ||
    request.headers.get('user-agent')?.includes('vercel-cron')
  if (isVercelCron) return true

  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) return true

  const cronSecret = request.headers.get('x-cron-secret')
  if (CRON_SECRET && cronSecret === CRON_SECRET) return true

  if (process.env.NODE_ENV === 'development') return true

  const supabaseAuth = await createClient()
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser()
  if (!user) return false

  const { data: account } = await supabaseAuth
    .from('user_accounts')
    .select('role')
    .eq('id', user.id)
    .single()

  return account?.role === 'admin' || account?.role === 'super_admin'
}

async function scheduleWeeklyDigests() {
  try {
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
        if (smsErr) {
          console.error(`MAP weekly digest SMS insert failed for ${account.id}:`, smsErr)
        } else {
          scheduledSms++
        }
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
        if (emailErr) {
          console.error(`MAP weekly digest email insert failed for ${account.id}:`, emailErr)
        } else {
          scheduledEmail++
        }
      }
    }

    return NextResponse.json({
      message: `Scheduled ${scheduledSms} SMS + ${scheduledEmail} email weekly digests`,
      scheduledSms,
      scheduledEmail,
    })
  } catch (err) {
    console.error('Error in /api/map/weekly-digest:', err)
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
  if (cadence.kind === 'biweekly') return 'every 2 weeks'
  if (cadence.kind === 'every_4_weeks' || cadence.kind === 'monthly') return 'every 4 weeks'
  return 'weekly'
}

/**
 * Compute the next Monday at the user's preferred local time, expressed as UTC.
 * If today is Monday and the send time has not passed yet, uses today.
 */
function getNextMondayMorning(timezone: string, reminderTime: string | null): Date {
  const { hour: H, minute: Mi } = parseReminderTimeToParts(reminderTime)
  const now = new Date()
  const day = now.getUTCDay()
  const daysSinceMonday = day === 0 ? 6 : day - 1

  const thisMonday = new Date(now)
  thisMonday.setUTCDate(thisMonday.getUTCDate() - daysSinceMonday)

  let candidate = mondayAtLocalTimeUtc(thisMonday, H, Mi, timezone)
  if (candidate <= now) {
    thisMonday.setUTCDate(thisMonday.getUTCDate() + 7)
    candidate = mondayAtLocalTimeUtc(thisMonday, H, Mi, timezone)
  }
  return candidate
}

function mondayAtLocalTimeUtc(
  mondayUtcDate: Date,
  hour: number,
  minute: number,
  timezone: string,
): Date {
  const year = mondayUtcDate.getUTCFullYear()
  const month = String(mondayUtcDate.getUTCMonth() + 1).padStart(2, '0')
  const dayStr = String(mondayUtcDate.getUTCDate()).padStart(2, '0')
  const localStr = `${year}-${month}-${dayStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`

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
    const deltaMinutes = hour * 60 + minute - (fh * 60 + fm)
    return new Date(utcGuess.getTime() + deltaMinutes * 60 * 1000)
  } catch {
    const fallback = new Date(mondayUtcDate)
    fallback.setUTCHours(11, 0, 0, 0)
    return fallback
  }
}
