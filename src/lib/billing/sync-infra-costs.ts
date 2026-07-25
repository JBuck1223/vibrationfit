// ============================================================================
// Infrastructure cost sync — Vercel hosting, AWS, Supabase
// ============================================================================
// Unlike AI providers, these are fixed/platform costs with no per-user
// attribution. They land in provider_costs_daily so the admin billing
// dashboard shows total business spend, not just AI spend.
//
// - Vercel:   GET https://api.vercel.com/v1/billing/charges (FOCUS v1.3
//             JSONL, 1-day granularity). Requires VERCEL_API_TOKEN and,
//             for team accounts, VERCEL_TEAM_ID.
// - AWS:      Cost Explorer GetCostAndUsage (daily, grouped by service).
//             Requires ce:GetCostAndUsage on the existing AWS credentials.
// - Supabase: no public billing API exists — their invoice endpoints are
//             dashboard-internal. Configure SUPABASE_MONTHLY_COST_USD (plan
//             fee + typical overage) and it is prorated per day.

import type { ProviderSyncResult } from '@/lib/billing/sync-provider-costs'

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
// Vercel hosting (FOCUS billing charges API)
// ----------------------------------------------------------------------------

export async function syncVercelCosts(supabase: any, days: number = 30): Promise<ProviderSyncResult> {
  const token = process.env.VERCEL_API_TOKEN
  if (!token) {
    return { provider: 'vercel_infra', rowsUpserted: 0, skipped: 'VERCEL_API_TOKEN not configured' }
  }

  try {
    const to = new Date()
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000)
    const params = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() })
    if (process.env.VERCEL_TEAM_ID) params.set('teamId', process.env.VERCEL_TEAM_ID)

    const res = await fetch(`https://api.vercel.com/v1/billing/charges?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      throw new Error(`Vercel billing API ${res.status}: ${(await res.text().catch(() => '')).slice(0, 300)}`)
    }

    // FOCUS v1.3 newline-delimited JSON: one charge object per line
    const text = await res.text()
    const daily = new Map<string, { cents: number; sample: any }>()

    for (const line of text.split('\n')) {
      if (!line.trim()) continue
      let charge: any
      try {
        charge = JSON.parse(line)
      } catch {
        continue
      }
      const billed = Number(charge.BilledCost ?? 0)
      if (!billed) continue
      const day = toDay(new Date(charge.ChargePeriodStart || Date.now()))
      const service = charge.ServiceName || 'unknown'
      const key = `${day}|${service}`
      const entry = daily.get(key) || { cents: 0, sample: charge }
      entry.cents += billed * 100
      daily.set(key, entry)
    }

    let rowsUpserted = 0
    for (const [key, entry] of daily) {
      const [day, service] = key.split('|')
      await upsertCostRow(supabase, {
        provider: 'vercel_infra',
        day,
        line_item: service,
        amount_cents: entry.cents,
        raw: entry.sample,
      })
      rowsUpserted++
    }

    return { provider: 'vercel_infra', rowsUpserted }
  } catch (err) {
    return {
      provider: 'vercel_infra',
      rowsUpserted: 0,
      error: err instanceof Error ? err.message : 'unknown error',
    }
  }
}

// ----------------------------------------------------------------------------
// AWS (Cost Explorer, daily unblended cost grouped by service)
// ----------------------------------------------------------------------------

export async function syncAWSCosts(supabase: any, days: number = 30): Promise<ProviderSyncResult> {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    return { provider: 'aws', rowsUpserted: 0, skipped: 'AWS credentials not configured' }
  }

  try {
    // Lazy import keeps the SDK out of routes that never sync AWS
    const { CostExplorerClient, GetCostAndUsageCommand } = await import('@aws-sdk/client-cost-explorer')

    // Cost Explorer only lives in us-east-1
    const client = new CostExplorerClient({ region: 'us-east-1' })

    const end = toDay(new Date())
    const start = toDay(new Date(Date.now() - days * 24 * 60 * 60 * 1000))
    let rowsUpserted = 0
    let nextToken: string | undefined

    do {
      const command = new GetCostAndUsageCommand({
        TimePeriod: { Start: start, End: end },
        Granularity: 'DAILY',
        Metrics: ['UnblendedCost'],
        GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }],
        NextPageToken: nextToken,
      })
      const response = await client.send(command)

      for (const result of response.ResultsByTime || []) {
        const day = result.TimePeriod?.Start
        if (!day) continue
        for (const group of result.Groups || []) {
          const usd = Number(group.Metrics?.UnblendedCost?.Amount ?? 0)
          if (!usd) continue
          await upsertCostRow(supabase, {
            provider: 'aws',
            day,
            line_item: group.Keys?.[0] || 'unknown',
            amount_cents: usd * 100,
            raw: group,
          })
          rowsUpserted++
        }
      }

      nextToken = response.NextPageToken
    } while (nextToken)

    return { provider: 'aws', rowsUpserted }
  } catch (err) {
    return {
      provider: 'aws',
      rowsUpserted: 0,
      error: err instanceof Error ? err.message : 'unknown error',
    }
  }
}

// ----------------------------------------------------------------------------
// Supabase (no public billing API — prorated configured monthly cost)
// ----------------------------------------------------------------------------

export async function syncSupabaseCosts(supabase: any, days: number = 30): Promise<ProviderSyncResult> {
  const monthlyUsd = Number(process.env.SUPABASE_MONTHLY_COST_USD || 0)
  if (!monthlyUsd) {
    return { provider: 'supabase', rowsUpserted: 0, skipped: 'SUPABASE_MONTHLY_COST_USD not configured' }
  }

  try {
    let rowsUpserted = 0
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const day = toDay(date)
      const daysInMonth = new Date(date.getUTCFullYear(), date.getUTCMonth() + 1, 0).getDate()
      await upsertCostRow(supabase, {
        provider: 'supabase',
        day,
        line_item: 'monthly_plan_prorated',
        amount_cents: (monthlyUsd * 100) / daysInMonth,
        raw: { monthly_usd: monthlyUsd, days_in_month: daysInMonth },
      })
      rowsUpserted++
    }
    return { provider: 'supabase', rowsUpserted }
  } catch (err) {
    return {
      provider: 'supabase',
      rowsUpserted: 0,
      error: err instanceof Error ? err.message : 'unknown error',
    }
  }
}
