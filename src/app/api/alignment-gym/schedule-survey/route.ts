// POST /api/alignment-gym/schedule-survey
// Stores Alignment Gym weekly live session scheduling preferences (support ticket + admin ping).

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse, after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAdminNotification, notifyAdminSMS } from '@/lib/admin/notifications'

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const
type Weekday = (typeof WEEKDAYS)[number]

const START_TIMES = ['8:00 am', '11:00 am', '5:00 pm', '6:30 pm', '7:00 pm', '8:00 pm'] as const
type StartTime = (typeof START_TIMES)[number]

const WEEKDAY_SET = new Set<string>(WEEKDAYS)
const START_TIME_SET = new Set<string>(START_TIMES)

function parseWeekdays(raw: unknown): Weekday[] {
  if (!Array.isArray(raw)) return []
  const out: Weekday[] = []
  for (const item of raw) {
    if (typeof item === 'string' && WEEKDAY_SET.has(item) && !out.includes(item as Weekday)) {
      out.push(item as Weekday)
    }
  }
  return out
}

function parseStartTimes(raw: unknown): StartTime[] {
  if (!Array.isArray(raw)) return []
  const out: StartTime[] = []
  for (const item of raw) {
    if (typeof item === 'string' && START_TIME_SET.has(item) && !out.includes(item as StartTime)) {
      out.push(item as StartTime)
    }
  }
  return out
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body?.website) {
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let email: string | null = null
    let userId: string | null = null

    if (user) {
      userId = user.id
      const { data: account } = await supabase
        .from('user_accounts')
        .select('email')
        .eq('id', user.id)
        .maybeSingle()
      email = (account?.email as string | undefined)?.trim() || user.email?.trim() || null
    }

    if (!email) {
      const guest = typeof body.guest_email === 'string' ? body.guest_email.trim() : ''
      if (!guest || !guest.includes('@')) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 })
      }
      email = guest
    }

    const timezone = typeof body.timezone === 'string' ? body.timezone.trim() : ''
    const timezoneOther = typeof body.timezone_other === 'string' ? body.timezone_other.trim() : ''

    if (!timezone || (timezone === 'OTHER' && !timezoneOther)) {
      return NextResponse.json({ error: 'Time zone is required' }, { status: 400 })
    }

    const weekdays = parseWeekdays(body.weekdays)
    const startTimes = parseStartTimes(body.start_times)

    if (weekdays.length === 0) {
      return NextResponse.json({ error: 'Select at least one weekday' }, { status: 400 })
    }
    if (startTimes.length === 0) {
      return NextResponse.json({ error: 'Select at least one start time' }, { status: 400 })
    }

    const tzLabel = timezone === 'OTHER' ? timezoneOther : timezone

    const description = [
      'Alignment Gym member scheduling survey (weekly Life Operating System live session).',
      '',
      `1. Time zone: ${tzLabel}`,
      `2. Weekdays that work for a 60-minute live session: ${weekdays.join(', ')}`,
      `3. Preferred start times in your time zone: ${startTimes.join(', ')}`,
      '',
      userId ? `User ID: ${userId}` : 'Submitted while not logged in',
      `Contact email: ${email}`,
    ].join('\n')

    const adminClient = createAdminClient()
    const { data: ticket, error } = await adminClient
      .from('support_tickets')
      .insert({
        user_id: userId,
        guest_email: email,
        subject: 'Alignment Gym survey: weekly live session times',
        description,
        category: 'other',
        priority: 'normal',
      })
      .select('id')
      .single()

    if (error) {
      console.error('[alignment-gym/schedule-survey] insert error:', error)
      return NextResponse.json({ error: 'Failed to save responses' }, { status: 500 })
    }

    // Do not block the client; keep process alive until DB + SMS complete (Next tracks the promise).
    after(() =>
      Promise.all([
        createAdminNotification({
          type: 'support_ticket',
          title: 'Alignment Gym scheduling survey submitted',
          body: email ?? undefined,
          metadata: {
            ticketId: ticket?.id,
            timezone: tzLabel,
            weekdays,
            start_times: startTimes,
            userId,
          },
          link: '/admin/crm/support/board',
        }),
        notifyAdminSMS(
          `Alignment Gym scheduling survey: ${email ?? 'unknown'} (${tzLabel}). Open support board in admin.`,
        ),
      ]).catch((err) => {
        console.error('[alignment-gym/schedule-survey] admin notification / SMS:', err)
      })
    )

    return NextResponse.json({ ok: true, ticketId: ticket?.id }, { status: 201 })
  } catch (e) {
    console.error('[alignment-gym/schedule-survey]', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
