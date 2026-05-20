import { createAdminClient } from '@/lib/supabase/admin'
import { OUTBOUND_URL } from '@/lib/urls'
import { getActivityDefinition } from './activities'

const APP_BASE_URL = OUTBOUND_URL

interface ReminderCommitment {
  id: string
  activity_type: string | null
  title: string
  notify_sms: boolean
  notify_email: boolean
  reminder_time: string | null
  reminder_days: number[] | null
}

interface UserAccount {
  id: string
  phone: string | null
  email: string | null
  sms_opt_in: boolean
  email_opt_in: boolean
  timezone: string
}

/**
 * Generates scheduled_messages rows for all reminder-enabled commitments for a user.
 * Supports both SMS and email. Clears existing per-activity MAP reminders first.
 */
export async function scheduleCommitmentReminders(userId: string) {
  const supabase = createAdminClient()

  // Clear existing per-activity MAP reminders for this user
  await supabase
    .from('scheduled_messages')
    .delete()
    .eq('recipient_user_id', userId)
    .eq('related_entity_type', 'map')
    .eq('status', 'pending')

  const { data: commitments } = await supabase
    .from('commitments')
    .select('id, activity_type, title, notify_sms, notify_email, reminder_time, reminder_days')
    .eq('user_id', userId)
    .eq('status', 'active')
    .or('notify_sms.eq.true,notify_email.eq.true')

  if (!commitments || commitments.length === 0) return { scheduled: 0 }

  const { data: account } = await supabase
    .from('user_accounts')
    .select('id, phone, email, sms_opt_in, email_opt_in, timezone')
    .eq('id', userId)
    .single()

  if (!account) return { scheduled: 0 }

  const rows = buildScheduledRows(commitments as ReminderCommitment[], account as UserAccount)
  if (rows.length === 0) return { scheduled: 0 }

  const { error } = await supabase
    .from('scheduled_messages')
    .insert(rows)

  if (error) {
    console.error('Error inserting commitment reminder messages:', error)
    throw error
  }

  return { scheduled: rows.length }
}

function buildScheduledRows(
  commitments: ReminderCommitment[],
  account: UserAccount,
) {
  const rows: Array<Record<string, unknown>> = []
  const now = new Date()
  const weekStart = getMonday(now)

  for (let weekOffset = 0; weekOffset < 2; weekOffset++) {
    for (const commitment of commitments) {
      const activityDef = commitment.activity_type
        ? getActivityDefinition(commitment.activity_type)
        : null
      if (activityDef?.usesPublishedSchedule) continue

      if (!commitment.reminder_time) continue

      const days = commitment.reminder_days
      if (!days || days.length === 0) continue

      for (const dow of days) {
        const scheduledFor = computeScheduleTime(
          weekStart,
          weekOffset,
          dow,
          commitment.reminder_time,
          account.timezone || 'America/New_York',
        )

        if (scheduledFor <= now) continue

        const link = `${APP_BASE_URL}${activityDef?.defaultDeepLink || '/map'}`
        const smsTemplate = activityDef?.smsTemplate || `Time for: ${commitment.title}! {link}`
        const smsBody = smsTemplate.replace('{link}', link)

        // SMS row
        if (commitment.notify_sms && account.sms_opt_in && account.phone) {
          rows.push({
            message_type: 'sms',
            recipient_phone: account.phone,
            recipient_user_id: account.id,
            related_entity_type: 'map',
            related_entity_id: commitment.id,
            subject: null,
            body: smsBody,
            scheduled_for: scheduledFor.toISOString(),
            status: 'pending',
          })
        }

        // Email row
        if (commitment.notify_email && account.email_opt_in !== false && account.email) {
          const emailSubject = `Reminder: ${commitment.title}`
          const emailHtml = buildReminderEmailHtml(commitment.title, link)
          rows.push({
            message_type: 'email',
            recipient_email: account.email,
            recipient_user_id: account.id,
            related_entity_type: 'map',
            related_entity_id: commitment.id,
            subject: emailSubject,
            body: emailHtml,
            text_body: `${commitment.title}\n\n${link}`,
            scheduled_for: scheduledFor.toISOString(),
            status: 'pending',
          })
        }
      }
    }
  }

  return rows
}

function buildReminderEmailHtml(title: string, link: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0; padding:0; background-color:#000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background-color:#0A0A0A; border-radius:16px; border:1px solid #1A1A1A;">
          <tr>
            <td style="padding: 28px 24px;">
              <p style="margin:0 0 8px; font-size:13px; color:#737373; text-transform:uppercase; letter-spacing:0.1em;">MAP Reminder</p>
              <h1 style="margin:0 0 20px; font-size:20px; font-weight:700; color:#ffffff;">${title}</h1>
              <a href="${link}" style="display:inline-block; padding:12px 24px; background-color:#39FF14; color:#000000; font-size:14px; font-weight:600; text-decoration:none; border-radius:10px;">
                Go Now
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 24px 20px;">
              <p style="margin:0; font-size:11px; color:#525252;">
                <a href="${APP_BASE_URL}/account/settings" style="color:#525252; text-decoration:underline;">Manage reminders</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim()
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Computes the UTC Date for a given day-of-week and time in the user's timezone.
 */
function computeScheduleTime(
  weekStart: Date,
  weekOffset: number,
  dayOfWeek: number,
  timeOfDay: string,
  timezone: string,
): Date {
  const mondayDow = 1
  let dayDiff = dayOfWeek - mondayDow
  if (dayDiff < 0) dayDiff += 7

  const targetDate = new Date(weekStart)
  targetDate.setDate(targetDate.getDate() + dayDiff + weekOffset * 7)

  const [hours, minutes] = timeOfDay.split(':').map(Number)

  const year = targetDate.getFullYear()
  const month = String(targetDate.getMonth() + 1).padStart(2, '0')
  const day = String(targetDate.getDate()).padStart(2, '0')
  const h = String(hours).padStart(2, '0')
  const m = String(minutes).padStart(2, '0')

  const localStr = `${year}-${month}-${day}T${h}:${m}:00`

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })

    const utcGuess = new Date(localStr + 'Z')
    const parts = formatter.formatToParts(utcGuess)
    const formattedHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10)
    const formattedMin = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10)

    const correction = hours - formattedHour
    const result = new Date(utcGuess.getTime() + correction * 60 * 60 * 1000)

    if (formattedMin !== minutes) {
      result.setTime(result.getTime() + (minutes - formattedMin) * 60 * 1000)
    }

    return result
  } catch {
    return new Date(localStr + 'Z')
  }
}

/**
 * Re-schedule reminders for all users with active reminder-enabled commitments.
 * Called by the daily cron.
 */
export async function refreshAllMapNotifications() {
  const supabase = createAdminClient()

  const { data: activeCommitments, error } = await supabase
    .from('commitments')
    .select('user_id')
    .eq('status', 'active')
    .or('notify_sms.eq.true,notify_email.eq.true')

  if (error || !activeCommitments) {
    console.error('Error fetching commitments for notification refresh:', error)
    return { refreshed: 0, errors: 0 }
  }

  const uniqueUserIds = [...new Set(activeCommitments.map(c => c.user_id))]
  let refreshed = 0
  let errors = 0

  for (const userId of uniqueUserIds) {
    try {
      await scheduleCommitmentReminders(userId)
      refreshed++
    } catch (err) {
      console.error(`Error refreshing notifications for user ${userId}:`, err)
      errors++
    }
  }

  return { refreshed, errors }
}
