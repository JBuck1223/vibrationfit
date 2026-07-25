// ============================================================================
// Daily provider billing sync — source of truth for AI spend
// ============================================================================
// Pulls billed costs from each vendor's billing API into provider_costs_daily
// so the admin billing dashboard can compare attributed spend (token_usage
// ledger) against what providers actually charged.
//
// - OpenAI:  GET /v1/organization/costs (requires OPENAI_ADMIN_KEY, an org
//            Admin API key — the regular project key returns 401)
// - Gateway: GET /v1/credits (balance + lifetime used; daily spend is the
//            delta between consecutive snapshots)
// - Mureka:  GET /v1/account/billing (account balance snapshot; consumption
//            is the delta between consecutive snapshots)

import { GATEWAY_BASE_URL } from '@/lib/ai/gateway'

export interface ProviderSyncResult {
  provider: string
  rowsUpserted: number
  skipped?: string
  error?: string
}

function toDay(date: Date): string {
  return date.toISOString().split('T')[0]
}

async function upsertCostRow(
  supabase: any,
  row: { provider: string; day: string; line_item: string; amount_cents: number; raw?: any }
): Promise<void> {
  const { error } = await supabase
    .from('provider_costs_daily')
    .upsert(
      {
        provider: row.provider,
        day: row.day,
        line_item: row.line_item,
        amount_cents: Math.round(row.amount_cents * 10000) / 10000,
        raw: row.raw ?? null,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: 'provider,day,line_item' }
    )
  if (error) throw new Error(`upsert ${row.provider}/${row.day}/${row.line_item}: ${error.message}`)
}

// ----------------------------------------------------------------------------
// OpenAI Costs API (org-level daily totals, grouped by line item)
// ----------------------------------------------------------------------------

export async function syncOpenAICosts(supabase: any, days: number = 7): Promise<ProviderSyncResult> {
  const adminKey = process.env.OPENAI_ADMIN_KEY
  if (!adminKey) {
    return { provider: 'openai', rowsUpserted: 0, skipped: 'OPENAI_ADMIN_KEY not configured' }
  }

  const startTime = Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000)
  let rowsUpserted = 0
  let page: string | undefined

  try {
    do {
      const params = new URLSearchParams({
        start_time: String(startTime),
        bucket_width: '1d',
        limit: String(days),
      })
      params.append('group_by', 'line_item')
      if (page) params.set('page', page)

      const res = await fetch(`https://api.openai.com/v1/organization/costs?${params}`, {
        headers: { Authorization: `Bearer ${adminKey}` },
      })

      if (!res.ok) {
        throw new Error(`OpenAI Costs API ${res.status}: ${await res.text().catch(() => '')}`)
      }

      const body = await res.json()
      for (const bucket of body.data || []) {
        const day = toDay(new Date(bucket.start_time * 1000))
        for (const result of bucket.results || []) {
          const usd = Number(result.amount?.value ?? 0)
          await upsertCostRow(supabase, {
            provider: 'openai',
            day,
            line_item: result.line_item || '',
            amount_cents: usd * 100,
            raw: result,
          })
          rowsUpserted++
        }
      }

      page = body.has_more ? body.next_page : undefined
    } while (page)

    return { provider: 'openai', rowsUpserted }
  } catch (err) {
    return {
      provider: 'openai',
      rowsUpserted,
      error: err instanceof Error ? err.message : 'unknown error',
    }
  }
}

// ----------------------------------------------------------------------------
// Vercel AI Gateway credits (lifetime spend snapshot -> daily delta)
// ----------------------------------------------------------------------------

export async function syncGatewayCredits(supabase: any): Promise<ProviderSyncResult> {
  const apiKey = process.env.AI_GATEWAY_API_KEY
  if (!apiKey) {
    return { provider: 'vercel_gateway', rowsUpserted: 0, skipped: 'AI_GATEWAY_API_KEY not configured' }
  }

  try {
    const res = await fetch(`${GATEWAY_BASE_URL}/credits`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!res.ok) {
      throw new Error(`Gateway credits API ${res.status}: ${await res.text().catch(() => '')}`)
    }

    const body = await res.json()
    const totalUsedUsd = Number(body.total_used ?? 0)
    const today = toDay(new Date())
    let rowsUpserted = 0

    // Snapshot of lifetime spend (used to compute the next day's delta)
    await upsertCostRow(supabase, {
      provider: 'vercel_gateway',
      day: today,
      line_item: 'lifetime_used_snapshot',
      amount_cents: totalUsedUsd * 100,
      raw: body,
    })
    rowsUpserted++

    // Daily spend = today's lifetime total minus the most recent prior snapshot
    const { data: prior } = await supabase
      .from('provider_costs_daily')
      .select('day, amount_cents')
      .eq('provider', 'vercel_gateway')
      .eq('line_item', 'lifetime_used_snapshot')
      .lt('day', today)
      .order('day', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (prior) {
      const deltaCents = Math.max(0, totalUsedUsd * 100 - Number(prior.amount_cents))
      await upsertCostRow(supabase, {
        provider: 'vercel_gateway',
        day: today,
        line_item: 'daily_spend',
        amount_cents: deltaCents,
        raw: { from_snapshot_day: prior.day },
      })
      rowsUpserted++
    }

    return { provider: 'vercel_gateway', rowsUpserted }
  } catch (err) {
    return {
      provider: 'vercel_gateway',
      rowsUpserted: 0,
      error: err instanceof Error ? err.message : 'unknown error',
    }
  }
}

// ----------------------------------------------------------------------------
// Mureka account billing (balance snapshot -> daily consumption delta)
// ----------------------------------------------------------------------------

export async function syncMurekaBilling(supabase: any): Promise<ProviderSyncResult> {
  const apiKey = process.env.MUREKA_API_KEY
  if (!apiKey) {
    return { provider: 'mureka', rowsUpserted: 0, skipped: 'MUREKA_API_KEY not configured' }
  }

  try {
    const res = await fetch(`${process.env.MUREKA_API_URL || 'https://api.mureka.ai'}/v1/account/billing`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!res.ok) {
      throw new Error(`Mureka billing API ${res.status}: ${await res.text().catch(() => '')}`)
    }

    const body = await res.json()
    // Mureka reports balance in cents already
    const balanceCents = Number(body.balance ?? 0)
    const totalRechargeCents = Number(body.total_recharge ?? 0)
    // Lifetime consumption = everything ever added minus what remains
    const lifetimeSpendCents = totalRechargeCents > 0 ? totalRechargeCents - balanceCents : 0
    const today = toDay(new Date())
    let rowsUpserted = 0

    await upsertCostRow(supabase, {
      provider: 'mureka',
      day: today,
      line_item: 'lifetime_used_snapshot',
      amount_cents: lifetimeSpendCents,
      raw: body,
    })
    rowsUpserted++

    const { data: prior } = await supabase
      .from('provider_costs_daily')
      .select('day, amount_cents')
      .eq('provider', 'mureka')
      .eq('line_item', 'lifetime_used_snapshot')
      .lt('day', today)
      .order('day', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (prior) {
      const deltaCents = Math.max(0, lifetimeSpendCents - Number(prior.amount_cents))
      await upsertCostRow(supabase, {
        provider: 'mureka',
        day: today,
        line_item: 'daily_spend',
        amount_cents: deltaCents,
        raw: { from_snapshot_day: prior.day },
      })
      rowsUpserted++
    }

    return { provider: 'mureka', rowsUpserted }
  } catch (err) {
    return {
      provider: 'mureka',
      rowsUpserted: 0,
      error: err instanceof Error ? err.message : 'unknown error',
    }
  }
}
