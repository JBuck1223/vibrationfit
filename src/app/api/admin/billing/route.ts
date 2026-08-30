// ============================================================================
// Admin Billing API — unified AI cost ledger queries
// ============================================================================
// GET /api/admin/billing?type=per-user&start=YYYY-MM-DD&end=YYYY-MM-DD
//   Per-user cost breakdown (by provider and action type, actual vs estimated)
//   joined with real emails/names and membership tier pricing for margin.
//
// GET /api/admin/billing?type=providers&start=...&end=...
//   Provider truth panel: ledger-attributed spend vs provider-billed spend
//   (provider_costs_daily) per provider, with the unattributed gap.

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { createServiceClient } from '@/lib/supabase/service'
import { fetchStripeRevenueByUser } from '@/lib/billing/stripe-revenue'
import { fetchPayPalRevenueByUser } from '@/lib/billing/paypal-revenue'

const PAGE_SIZE = 1000
const MAX_ROWS = 50000

interface LedgerRow {
  user_id: string | null
  provider: string | null
  action_type: string
  calculated_cost_cents: number | null
  actual_cost_cents: number | null
  billable: boolean
  success: boolean
  created_at: string
}

/** Cost used for attribution: reconciled actual when present, else estimate. */
function rowCost(row: LedgerRow): number {
  const actual = Number(row.actual_cost_cents ?? 0)
  return actual > 0 ? actual : Number(row.calculated_cost_cents ?? 0)
}

const GRANT_ACTION_TYPES = new Set([
  'admin_grant', 'admin_deduct', 'subscription_grant', 'renewal_grant',
  'trial_grant', 'token_pack_purchase', 'pack_purchase',
])

async function fetchLedgerRows(supabase: any, startIso: string, endIso: string): Promise<LedgerRow[]> {
  const rows: LedgerRow[] = []
  let from = 0

  while (rows.length < MAX_ROWS) {
    const { data, error } = await supabase
      .from('token_usage')
      .select('user_id, provider, action_type, calculated_cost_cents, actual_cost_cents, billable, success, created_at')
      .gte('created_at', startIso)
      .lte('created_at', endIso)
      .order('created_at', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw new Error(`Ledger query failed: ${error.message}`)
    if (!data || data.length === 0) break

    for (const row of data) {
      if (!GRANT_ACTION_TYPES.has(row.action_type)) rows.push(row)
    }

    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return rows
}

function parseRange(searchParams: URLSearchParams): { startIso: string; endIso: string; days: number } {
  const end = searchParams.get('end')
    ? new Date(`${searchParams.get('end')}T23:59:59.999Z`)
    : new Date()
  const start = searchParams.get('start')
    ? new Date(`${searchParams.get('start')}T00:00:00.000Z`)
    : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date format. Use YYYY-MM-DD.')
  }

  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)))
  return { startIso: start.toISOString(), endIso: end.toISOString(), days }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'per-user'
    const { startIso, endIso, days } = parseRange(searchParams)

    const supabase = createServiceClient()

    if (type === 'per-user') {
      const rows = await fetchLedgerRows(supabase, startIso, endIso)

      interface UserAgg {
        user_id: string | null
        total_cost_cents: number
        actual_cost_cents: number
        estimated_cost_cents: number
        billable_cost_cents: number
        background_cost_cents: number
        actions_count: number
        by_provider: Record<string, number>
        by_action: Record<string, number>
        last_activity: string
      }

      const byUser = new Map<string, UserAgg>()
      for (const row of rows) {
        const key = row.user_id || 'system'
        let agg = byUser.get(key)
        if (!agg) {
          agg = {
            user_id: row.user_id,
            total_cost_cents: 0,
            actual_cost_cents: 0,
            estimated_cost_cents: 0,
            billable_cost_cents: 0,
            background_cost_cents: 0,
            actions_count: 0,
            by_provider: {},
            by_action: {},
            last_activity: row.created_at,
          }
          byUser.set(key, agg)
        }

        const cost = rowCost(row)
        agg.total_cost_cents += cost
        agg.estimated_cost_cents += Number(row.calculated_cost_cents ?? 0)
        agg.actual_cost_cents += Number(row.actual_cost_cents ?? 0)
        if (row.billable) agg.billable_cost_cents += cost
        else agg.background_cost_cents += cost
        agg.actions_count++

        const provider = row.provider || 'unknown'
        agg.by_provider[provider] = (agg.by_provider[provider] || 0) + cost
        agg.by_action[row.action_type] = (agg.by_action[row.action_type] || 0) + cost
        if (row.created_at > agg.last_activity) agg.last_activity = row.created_at
      }

      // Real revenue in the range (net of refunds): Stripe charges (legacy
      // subscribers) plus PayPal charges from our own orders/payment_history.
      // Members with revenue but no AI usage still need to appear in the
      // profitability view.
      const [stripeRevenue, paypalRevenue] = await Promise.all([
        fetchStripeRevenueByUser(supabase, startIso, endIso),
        fetchPayPalRevenueByUser(supabase, startIso, endIso),
      ])

      const revenueUserIds = new Set([
        ...stripeRevenue.byUser.keys(),
        ...paypalRevenue.byUser.keys(),
      ])
      for (const userId of revenueUserIds) {
        if (!byUser.has(userId)) {
          byUser.set(userId, {
            user_id: userId,
            total_cost_cents: 0,
            actual_cost_cents: 0,
            estimated_cost_cents: 0,
            billable_cost_cents: 0,
            background_cost_cents: 0,
            actions_count: 0,
            by_provider: {},
            by_action: {},
            last_activity: startIso,
          })
        }
      }

      // Join account + tier data for real emails and tier labels
      const userIds = [...byUser.keys()].filter((k) => k !== 'system')
      const accounts = new Map<string, any>()

      for (let i = 0; i < userIds.length; i += 200) {
        const batch = userIds.slice(i, i + 200)
        const { data: accountRows, error } = await supabase
          .from('user_accounts')
          .select('id, email, full_name, membership_tier_id, membership_tiers ( name, price_monthly, price_yearly, billing_interval )')
          .in('id', batch)
        if (error) throw new Error(`Account lookup failed: ${error.message}`)
        for (const account of accountRows || []) accounts.set(account.id, account)
      }

      const users = [...byUser.values()]
        .map((agg) => {
          const account = agg.user_id ? accounts.get(agg.user_id) : null
          const tier = account?.membership_tiers || null

          // Real charge revenue when available; tier-prorated as fallback
          let revenueCentsForRange: number
          if (stripeRevenue.available || paypalRevenue.available) {
            revenueCentsForRange = agg.user_id
              ? (stripeRevenue.byUser.get(agg.user_id) || 0) + (paypalRevenue.byUser.get(agg.user_id) || 0)
              : 0
          } else if (tier) {
            revenueCentsForRange =
              tier.billing_interval === 'year' && tier.price_yearly
                ? (Number(tier.price_yearly) / 365) * days
                : (Number(tier.price_monthly || 0) / 30) * days
          } else {
            revenueCentsForRange = 0
          }

          return {
            email: account?.email || (agg.user_id ? `unknown (${agg.user_id.slice(0, 8)})` : 'System'),
            name: account?.full_name || null,
            tier_name: tier?.name || null,
            tier_price_monthly_cents: tier ? Number(tier.price_monthly || 0) : 0,
            revenue_cents_for_range: Math.round(revenueCentsForRange),
            margin_cents: Math.round(revenueCentsForRange - agg.total_cost_cents),
            ...agg,
          }
        })
        .sort((a, b) => b.total_cost_cents - a.total_cost_cents)

      const totals = {
        total_cost_cents: users.reduce((sum, u) => sum + u.total_cost_cents, 0),
        total_revenue_cents: users.reduce((sum, u) => sum + u.revenue_cents_for_range, 0),
        total_actions: users.reduce((sum, u) => sum + u.actions_count, 0),
        users_count: users.filter((u) => u.user_id).length,
      }

      return NextResponse.json({
        users,
        totals,
        revenue_source:
          stripeRevenue.available || paypalRevenue.available
            ? [
                ...(stripeRevenue.available ? ['stripe'] : []),
                ...(paypalRevenue.available ? ['paypal'] : []),
              ].join('+')
            : 'tier_prorated',
        stripe_unmapped_cents: stripeRevenue.available ? stripeRevenue.unmappedCents : null,
        stripe_error: stripeRevenue.error || null,
        paypal_error: paypalRevenue.error || null,
        start: startIso,
        end: endIso,
        days,
        success: true,
      })
    }

    if (type === 'providers') {
      const rows = await fetchLedgerRows(supabase, startIso, endIso)

      // Attributed spend per provider per day from the ledger
      const attributed: Record<string, { total: number; by_day: Record<string, number> }> = {}
      for (const row of rows) {
        const provider = row.provider || 'unknown'
        const day = row.created_at.split('T')[0]
        if (!attributed[provider]) attributed[provider] = { total: 0, by_day: {} }
        const cost = rowCost(row)
        attributed[provider].total += cost
        attributed[provider].by_day[day] = (attributed[provider].by_day[day] || 0) + cost
      }

      // Provider-billed spend from the daily sync. Fetch all rows (not just
      // the range) so lifetime snapshots are always available for context —
      // Mureka and the Gateway only expose running totals, not history.
      const { data: billedRows, error: billedError } = await supabase
        .from('provider_costs_daily')
        .select('provider, day, line_item, amount_cents, fetched_at')
        .order('day', { ascending: true })

      if (billedError) throw new Error(`provider_costs_daily query failed: ${billedError.message}`)

      const startDay = startIso.split('T')[0]
      const endDay = endIso.split('T')[0]

      const billed: Record<string, { total: number; by_day: Record<string, number>; last_synced: string | null }> = {}
      const lifetime: Record<string, number> = {}
      for (const row of billedRows || []) {
        const cents = Number(row.amount_cents || 0)

        // Snapshots are running totals, not daily spend — track the latest
        // one per provider (rows are day-ordered) but exclude from range sums
        if (row.line_item === 'lifetime_used_snapshot') {
          lifetime[row.provider] = cents
          continue
        }

        if (row.day < startDay || row.day > endDay) continue
        if (!billed[row.provider]) billed[row.provider] = { total: 0, by_day: {}, last_synced: null }
        billed[row.provider].total += cents
        billed[row.provider].by_day[row.day] = (billed[row.provider].by_day[row.day] || 0) + cents
        if (!billed[row.provider].last_synced || row.fetched_at > billed[row.provider].last_synced!) {
          billed[row.provider].last_synced = row.fetched_at
        }
      }

      // Infrastructure providers have no per-user ledger rows by design, so
      // an "unattributed gap" is meaningless for them.
      const INFRA_PROVIDERS = new Set(['vercel_infra', 'aws', 'supabase'])

      const providerNames = [...new Set([...Object.keys(attributed), ...Object.keys(billed), ...Object.keys(lifetime)])]
      const providers = providerNames
        .map((name) => {
          const attributedTotal = attributed[name]?.total || 0
          const billedTotal = billed[name]?.total || 0
          const isInfra = INFRA_PROVIDERS.has(name)
          return {
            provider: name,
            kind: isInfra ? 'infrastructure' : 'ai',
            attributed_cents: Math.round(attributedTotal * 100) / 100,
            billed_cents: Math.round(billedTotal * 100) / 100,
            unattributed_cents:
              billed[name] && !isInfra ? Math.round((billedTotal - attributedTotal) * 100) / 100 : null,
            lifetime_billed_cents: lifetime[name] != null ? Math.round(lifetime[name] * 100) / 100 : null,
            attributed_by_day: attributed[name]?.by_day || {},
            billed_by_day: billed[name]?.by_day || {},
            last_synced: billed[name]?.last_synced || null,
          }
        })
        .sort((a, b) => {
          if (a.kind !== b.kind) return a.kind === 'ai' ? -1 : 1
          return (b.attributed_cents || b.billed_cents) - (a.attributed_cents || a.billed_cents)
        })

      // Reconciliation status counts for the range (gateway actuals coverage)
      const { data: reconRows } = await supabase
        .from('token_usage')
        .select('reconciliation_status')
        .eq('provider', 'vercel_gateway')
        .gte('created_at', startIso)
        .lte('created_at', endIso)

      const reconciliation = { pending: 0, matched: 0, discrepancy: 0, not_applicable: 0 }
      for (const row of reconRows || []) {
        const status = row.reconciliation_status as keyof typeof reconciliation
        if (status in reconciliation) reconciliation[status]++
      }

      return NextResponse.json({ providers, reconciliation, start: startIso, end: endIso, days, success: true })
    }

    return NextResponse.json({ error: 'Invalid type parameter (use per-user or providers)' }, { status: 400 })
  } catch (error) {
    console.error('Admin billing error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch billing data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
