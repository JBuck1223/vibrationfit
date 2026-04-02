import { createAdminClient } from '@/lib/supabase/admin'
import { OUTBOUND_URL } from '@/lib/urls'
import type { UserMap, UserMapItem } from './types'
import { getActivityDefinition } from './activities'

const APP_BASE_URL = OUTBOUND_URL

interface ScheduleParams {
  map: UserMap & { items: UserMapItem[] }
  userId: string
  phone: string
}

/**
 * Generates scheduled_messages rows for all SMS-enabled items in a MAP.
 * Clears existing MAP notifications for this user first.
 */
export async function scheduleMapNotifications({ map, userId, phone }: ScheduleParams) {
  const supabase = createAdminClient()

  // Clear existing MAP notifications for this user
  await supabase
    .from('scheduled_messages')
    .delete()
    .eq('recipient_user_id', userId)
    .eq('related_entity_type', 'map')
    .eq('status', 'pending')

  const smsItems = (map.items ?? []).filter(item => item.notify_sms)
  if (smsItems.length === 0) return { scheduled: 0 }

  const rows = buildScheduledRows(smsItems, map, userId, phone)
  if (rows.length === 0) return { scheduled: 0 }

  const { error } = await supabase
    .from('scheduled_messages')
    .insert(rows)

  if (error) {
    console.error('Error inserting MAP scheduled messages:', error)
    throw error
  }

  return { scheduled: rows.length }
}

function buildScheduledRows(
  items: UserMapItem[],
  map: UserMap,
  userId: string,
  phone: string,
) {
  const rows: Array<Record<string, unknown>> = []
  const now = new Date()

  // Determine the Monday of the current week
  const weekStart = getMonday(now)

  // Schedule for current week and next week (14 days of coverage)
  for (let weekOffset = 0; weekOffset < 2; weekOffset++) {
    for (const item of items) {
      if (!item.time_of_day) continue

      for (const dow of item.days_of_week) {
        const scheduledFor = computeScheduleTime(
          weekStart,
          weekOffset,
          dow,
          item.time_of_day,
          map.timezone,
        )

        // Only schedule future messages
        if (scheduledFor <= now) continue

        const activityDef = getActivityDefinition(item.activity_type)
        const link = `${APP_BASE_URL}${item.deep_link || activityDef?.defaultDeepLink || '/map'}`
        const template = activityDef?.smsTemplate || `Time for: ${item.label}! {link}`
        const body = template.replace('{link}', link)

        rows.push({
          message_type: 'sms',
          recipient_phone: phone,
          recipient_user_id: userId,
          related_entity_type: 'map',
          related_entity_id: map.id,
          subject: null,
          body,
          scheduled_for: scheduledFor.toISOString(),
          status: 'pending',
        })
      }
    }
  }

  return rows
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
  // dayOfWeek: 0=Sun, 1=Mon ... 6=Sat
  // weekStart is Monday (dayOfWeek=1)
  const mondayDow = 1
  let dayDiff = dayOfWeek - mondayDow
  if (dayDiff < 0) dayDiff += 7 // Sunday wraps to end

  const targetDate = new Date(weekStart)
  targetDate.setDate(targetDate.getDate() + dayDiff + weekOffset * 7)

  const [hours, minutes] = timeOfDay.split(':').map(Number)

  // Build an ISO-style string in the user's local date, then convert via timezone offset
  const year = targetDate.getFullYear()
  const month = String(targetDate.getMonth() + 1).padStart(2, '0')
  const day = String(targetDate.getDate()).padStart(2, '0')
  const h = String(hours).padStart(2, '0')
  const m = String(minutes).padStart(2, '0')

  // Use Intl to find the UTC offset for the target date in the user's timezone
  const localStr = `${year}-${month}-${day}T${h}:${m}:00`

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })

    // Create a date at the local time and find what UTC time corresponds
    const utcGuess = new Date(localStr + 'Z')
    const parts = formatter.formatToParts(utcGuess)
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || '0'
    const formattedHour = parseInt(getPart('hour'), 10)
    const hourDiff = formattedHour - utcGuess.getUTCHours()

    // Adjust: if the formatted time in the target TZ differs from what we want,
    // shift the UTC time accordingly
    const wantedHour = hours
    const currentTzHour = formattedHour
    const correction = wantedHour - currentTzHour

    const result = new Date(utcGuess.getTime() + correction * 60 * 60 * 1000)

    // Also correct minutes if needed
    const formattedMin = parseInt(getPart('minute'), 10)
    if (formattedMin !== minutes) {
      result.setTime(result.getTime() + (minutes - formattedMin) * 60 * 1000)
    }

    return result
  } catch {
    // Fallback: treat as UTC
    return new Date(localStr + 'Z')
  }
}

/**
 * Re-schedule notifications for all active MAPs (called by cron).
 */
export async function refreshAllMapNotifications() {
  const supabase = createAdminClient()

  const { data: activeMaps, error } = await supabase
    .from('user_maps')
    .select('*, items:user_map_items(*)')
    .eq('is_active', true)
    .eq('is_draft', false)

  if (error || !activeMaps) {
    console.error('Error fetching active maps for refresh:', error)
    return { refreshed: 0, errors: 0 }
  }

  let refreshed = 0
  let errors = 0

  for (const map of activeMaps) {
    const { data: account } = await supabase
      .from('user_accounts')
      .select('phone, sms_opt_in')
      .eq('id', map.user_id)
      .single()

    if (!account?.phone || !account?.sms_opt_in) continue

    try {
      await scheduleMapNotifications({
        map: map as UserMap & { items: UserMapItem[] },
        userId: map.user_id,
        phone: account.phone,
      })
      refreshed++
    } catch (err) {
      console.error(`Error refreshing notifications for map ${map.id}:`, err)
      errors++
    }
  }

  return { refreshed, errors }
}
