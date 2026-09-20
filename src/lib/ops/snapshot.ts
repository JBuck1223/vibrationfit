import { createAdminClient } from '@/lib/supabase/admin'
import { daysAgoIso, isoRange, todayIso, weekStartIso, yearStartIso } from './periods'

const CLIENT_ID = 'vibrationfit'

function calendarMrr(tier: {
  price_monthly?: number | null
  price_yearly?: number | null
  billing_interval?: string | null
}, billingIntervalDays?: number | null) {
  const monthly = Number(tier.price_monthly || 0)
  const yearly = Number(tier.price_yearly || 0)
  if (billingIntervalDays === 28 || (tier.billing_interval === 'day')) {
    return (monthly / 100) * (365 / 28) / 12
  }
  if (tier.billing_interval === 'year') return yearly / 12 / 100
  if (tier.billing_interval === 'month') return monthly / 100
  return monthly / 100
}

async function paidCents(fromDay: string) {
  const { from, to } = isoRange(fromDay)
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('status', 'paid')
    .gte('paid_at', from)
    .lte('paid_at', to)
  if (error) throw new Error(error.message)
  return (data || []).reduce((s, r) => s + Number(r.total_amount || 0), 0)
}

export async function buildVibrationFitSnapshot() {
  const supabase = createAdminClient()
  const today = todayIso()
  const notes: string[] = []

  const [centsToday, centsWeek, cents30, centsYtd, subs, tickets] = await Promise.all([
    paidCents(today),
    paidCents(weekStartIso()),
    paidCents(daysAgoIso(29)),
    paidCents(yearStartIso()),
    supabase
      .from('customer_subscriptions')
      .select('status, billing_interval_days, membership_tiers(price_monthly, price_yearly, billing_interval)')
      .in('status', ['active', 'trialing']),
    supabase
      .from('support_tickets')
      .select('status, priority')
      .in('status', ['open', 'in_progress', 'waiting_reply']),
  ])
  if (subs.error) throw new Error(subs.error.message)
  if (tickets.error) throw new Error(tickets.error.message)

  let mrr = 0
  for (const row of subs.data || []) {
    const raw = row.membership_tiers as
      | {
          price_monthly?: number
          price_yearly?: number
          billing_interval?: string
        }
      | {
          price_monthly?: number
          price_yearly?: number
          billing_interval?: string
        }[]
      | null
    const tier = Array.isArray(raw) ? raw[0] : raw
    if (!tier) continue
    mrr += calendarMrr(tier, row.billing_interval_days as number | null)
  }

  const open = tickets.data || []
  const urgent = open.filter((t) => t.priority === 'urgent' || t.priority === 'high').length
  if (urgent > 0) notes.push(`${urgent} high/urgent support tickets need a reply.`)

  const dollars = (cents: number) => cents / 100
  const metric = (
    key: string,
    period: 'today' | 'week' | '30d' | 'ytd' | 'mtd' | 'current',
    value: number,
    unit: 'usd' | 'count',
    label: string,
    ownerVisible: boolean,
    source: string
  ) => ({ key, period, value, unit, label, ownerVisible, source })

  return {
    clientId: CLIENT_ID,
    capturedAt: new Date().toISOString(),
    timezone: 'America/New_York',
    metrics: [
      metric('revenue', 'today', dollars(centsToday), 'usd', 'Revenue', true, 'orders.total_amount'),
      metric('revenue', 'week', dollars(centsWeek), 'usd', 'Revenue', true, 'orders.total_amount'),
      metric('revenue', '30d', dollars(cents30), 'usd', 'Revenue', true, 'orders.total_amount'),
      metric('revenue', 'ytd', dollars(centsYtd), 'usd', 'Revenue', true, 'orders.total_amount'),
      metric('members.active', 'current', (subs.data || []).length, 'count', 'Active members', true, 'customer_subscriptions'),
      metric('members.mrr', 'current', mrr, 'usd', 'Calendar MRR', true, 'customer_subscriptions + membership_tiers (28-day corrected)'),
      metric('tickets.open', 'current', open.length, 'count', 'Open support tickets', true, 'support_tickets'),
      metric('tickets.urgent', 'current', urgent, 'count', 'Urgent tickets', true, 'support_tickets'),
    ],
    health: { ok: notes.length === 0, notes },
  }
}
