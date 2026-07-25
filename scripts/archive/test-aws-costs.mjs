// One-off: test AWS Cost Explorer access and backfill 180 days into
// provider_costs_daily. Run:
//   node --env-file=.env.local scripts/database/test-aws-costs.mjs
import { createClient } from '@supabase/supabase-js'
import { CostExplorerClient, GetCostAndUsageCommand } from '@aws-sdk/client-cost-explorer'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const client = new CostExplorerClient({ region: 'us-east-1' })
const toDay = (d) => d.toISOString().split('T')[0]

const end = toDay(new Date())
const start = toDay(new Date(Date.now() - 180 * 24 * 60 * 60 * 1000))

let rows = 0
let totalUsd = 0
let nextToken

try {
  do {
    const res = await client.send(
      new GetCostAndUsageCommand({
        TimePeriod: { Start: start, End: end },
        Granularity: 'DAILY',
        Metrics: ['UnblendedCost'],
        GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }],
        NextPageToken: nextToken,
      })
    )

    for (const result of res.ResultsByTime || []) {
      const day = result.TimePeriod?.Start
      if (!day) continue
      for (const group of result.Groups || []) {
        const usd = Number(group.Metrics?.UnblendedCost?.Amount ?? 0)
        if (!usd) continue
        totalUsd += usd
        const { error } = await supabase.from('provider_costs_daily').upsert(
          {
            provider: 'aws',
            day,
            line_item: group.Keys?.[0] || 'unknown',
            amount_cents: Math.round(usd * 100 * 10000) / 10000,
            raw: group,
            fetched_at: new Date().toISOString(),
          },
          { onConflict: 'provider,day,line_item' }
        )
        if (error) throw new Error(`upsert: ${error.message}`)
        rows++
      }
    }
    nextToken = res.NextPageToken
  } while (nextToken)

  console.log(`AWS: upserted ${rows} daily service rows, total $${totalUsd.toFixed(2)} over 180 days`)
} catch (err) {
  console.log('AWS Cost Explorer error:', err.name || '', err.message)
}
