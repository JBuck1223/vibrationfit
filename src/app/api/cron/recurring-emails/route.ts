/**
 * Generic Recurring Emails Cron
 *
 * GET /api/cron/recurring-emails  (Vercel cron — runs top of every hour)
 *
 * Queries the recurring_emails table for active rows whose day_of_week and
 * send_hour match the current time in the row's timezone. For each match it
 * inserts a scheduled_messages notification-job row so the existing
 * process-scheduled cron handles delivery via sendBulkNotification.
 *
 * Security: Vercel cron header, CRON_SECRET, or admin session.
 */

export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const CRON_SECRET = process.env.CRON_SECRET

function authorize(request: NextRequest): Promise<boolean> | boolean {
  const isVercelCron =
    request.headers.get('x-vercel-cron') === '1' ||
    request.headers.get('user-agent')?.includes('vercel-cron')
  if (isVercelCron) return true

  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) return true

  const cronSecret = request.headers.get('x-cron-secret')
  if (CRON_SECRET && cronSecret === CRON_SECRET) return true

  if (process.env.NODE_ENV === 'development') return true

  return authorizeAdmin()
}

async function authorizeAdmin(): Promise<boolean> {
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

function getNowInTimezone(tz: string) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  const parts = Object.fromEntries(
    fmt.formatToParts(new Date()).map((p) => [p.type, p.value])
  )

  const dayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  }

  return {
    dayOfWeek: dayMap[parts.weekday] ?? -1,
    hour: parseInt(parts.hour, 10),
    minute: parseInt(parts.minute, 10),
    dateStr: `${parts.year}-${parts.month}-${parts.day}`,
  }
}

async function processRecurringEmails() {
  const supabase = createAdminClient()

  const { data: rows, error } = await supabase
    .from('recurring_emails')
    .select('*')
    .eq('is_active', true)

  if (error) {
    console.error('[recurring-emails] Failed to query recurring_emails:', error.message)
    return { queued: 0, skipped: 0, error: error.message }
  }

  if (!rows || rows.length === 0) {
    return { queued: 0, skipped: 0 }
  }

  let queued = 0
  let skipped = 0

  for (const row of rows) {
    const tz = row.timezone || 'America/New_York'
    const now = getNowInTimezone(tz)

    if (now.dayOfWeek !== row.day_of_week || now.hour !== row.send_hour) {
      skipped++
      continue
    }

    if (row.last_queued_at) {
      const lastDate = new Date(row.last_queued_at)
      const lastFmt = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      const lastParts = Object.fromEntries(
        lastFmt.formatToParts(lastDate).map((p) => [p.type, p.value])
      )
      const lastDateStr = `${lastParts.year}-${lastParts.month}-${lastParts.day}`

      if (lastDateStr === now.dateStr) {
        skipped++
        continue
      }
    }

    const { error: insertErr } = await supabase.from('scheduled_messages').insert({
      message_type: 'email',
      notification_config_slug: row.notification_config_slug,
      notification_variables: row.notification_variables || {},
      scheduled_for: new Date().toISOString(),
      status: 'pending',
      body: 'notification-job',
    })

    if (insertErr) {
      console.error(
        `[recurring-emails] Failed to queue "${row.name}":`,
        insertErr.message
      )
      continue
    }

    await supabase
      .from('recurring_emails')
      .update({ last_queued_at: new Date().toISOString() })
      .eq('id', row.id)

    console.log(`[recurring-emails] Queued "${row.name}" (${row.notification_config_slug})`)
    queued++
  }

  return { queued, skipped }
}

export async function GET(request: NextRequest) {
  const isAuthorized = await authorize(request)
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const results = await processRecurringEmails()
    console.log('[recurring-emails]', results)
    return NextResponse.json({ message: 'Recurring emails processed', ...results })
  } catch (err) {
    console.error('[recurring-emails] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
