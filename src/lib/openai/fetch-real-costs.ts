// ============================================================================
// Fetch Real Costs from OpenAI API
// ============================================================================
// Uses the OpenAI Costs API (org-level daily totals) to store provider-billed
// spend in provider_costs_daily and report variance against the token_usage
// ledger.
//
// Requirements: OPENAI_ADMIN_KEY (an organization Admin API key). The regular
// project API key returns 401 on /v1/organization/* endpoints.
//
// Note: OpenAI cannot attribute costs to individual requests or end users —
// per-user attribution always comes from the token_usage ledger. This module
// exists purely to verify the ledger against what OpenAI actually billed.
// (The old per-row proportional scaling hack was removed: it fabricated
// per-request "actual" costs and, post-gateway-migration, would have smeared
// OpenAI org costs across Vercel AI Gateway rows.)

interface OpenAICostBucket {
  start_time: number
  end_time: number
  results: {
    amount?: { value: number; currency: string }
    line_item?: string | null
    project_id?: string | null
  }[]
}

/**
 * Fetch daily cost buckets from the OpenAI Costs API.
 */
export async function fetchOpenAICosts(
  startDate: Date,
  endDate: Date
): Promise<OpenAICostBucket[] | null> {
  const adminKey = process.env.OPENAI_ADMIN_KEY

  if (!adminKey) {
    throw new Error('OPENAI_ADMIN_KEY not configured (org Admin API key required for the Costs API)')
  }

  try {
    const buckets: OpenAICostBucket[] = []
    let page: string | undefined

    do {
      const params = new URLSearchParams({
        start_time: String(Math.floor(startDate.getTime() / 1000)),
        end_time: String(Math.floor(endDate.getTime() / 1000)),
        bucket_width: '1d',
        limit: '180',
      })
      params.append('group_by', 'line_item')
      if (page) params.set('page', page)

      const response = await fetch(`https://api.openai.com/v1/organization/costs?${params}`, {
        headers: {
          'Authorization': `Bearer ${adminKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(`OpenAI Costs API error: ${response.status} - ${JSON.stringify(error)}`)
      }

      const data = await response.json()
      buckets.push(...(data.data || []))
      page = data.has_more ? data.next_page : undefined
    } while (page)

    return buckets
  } catch (error) {
    console.error('Error fetching OpenAI costs:', error)
    return null
  }
}

/**
 * Sync OpenAI daily billed costs into provider_costs_daily and report
 * variance against the ledger's attributed (estimated) OpenAI spend.
 */
export async function updateRealCosts(
  supabase: any,
  startDate: Date,
  endDate: Date
): Promise<{
  updated: number
  totalActualCost: number
  totalAttributedCost: number
  variancePercent: number
  errors: string[]
}> {
  const result = {
    updated: 0,
    totalActualCost: 0, // cents, from OpenAI billing
    totalAttributedCost: 0, // cents, from token_usage ledger
    variancePercent: 0,
    errors: [] as string[],
  }

  try {
    const buckets = await fetchOpenAICosts(startDate, endDate)

    if (!buckets || buckets.length === 0) {
      result.errors.push('No cost data returned from OpenAI')
      return result
    }

    // Store daily line-item totals in provider_costs_daily
    for (const bucket of buckets) {
      const day = new Date(bucket.start_time * 1000).toISOString().split('T')[0]
      for (const item of bucket.results || []) {
        const usd = Number(item.amount?.value || 0)
        result.totalActualCost += usd * 100

        const { error: upsertError } = await supabase
          .from('provider_costs_daily')
          .upsert(
            {
              provider: 'openai',
              day,
              line_item: item.line_item || '',
              amount_cents: Math.round(usd * 100 * 10000) / 10000,
              raw: item,
              fetched_at: new Date().toISOString(),
            },
            { onConflict: 'provider,day,line_item' }
          )

        if (upsertError) {
          result.errors.push(`Failed to store ${day}/${item.line_item}: ${upsertError.message}`)
        } else {
          result.updated++
        }
      }
    }

    // Attributed OpenAI spend from the ledger for the same window
    const { data: ledgerRows, error: ledgerError } = await supabase
      .from('token_usage')
      .select('calculated_cost_cents, actual_cost_cents')
      .eq('provider', 'openai')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (ledgerError) {
      result.errors.push(`Ledger fetch error: ${ledgerError.message}`)
    } else {
      result.totalAttributedCost = (ledgerRows || []).reduce(
        (sum: number, r: any) => sum + Number(r.actual_cost_cents ?? r.calculated_cost_cents ?? 0),
        0
      )
    }

    result.variancePercent =
      result.totalActualCost > 0
        ? ((result.totalActualCost - result.totalAttributedCost) / result.totalActualCost) * 100
        : 0

    console.log(
      `OpenAI cost sync: billed $${(result.totalActualCost / 100).toFixed(2)}, ` +
        `attributed $${(result.totalAttributedCost / 100).toFixed(2)}, ` +
        `variance ${result.variancePercent.toFixed(1)}%`
    )

    return result
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    return result
  }
}
