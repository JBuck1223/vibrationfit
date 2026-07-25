// One-off: backfill 180 days of OpenAI billed costs into provider_costs_daily
// and sanity-check Stripe revenue mapping. Run:
//   node --env-file=.env.local scripts/database/backfill-provider-costs.mjs
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ---------- OpenAI Costs API: 180-day backfill ----------
async function backfillOpenAI() {
  const adminKey = process.env.OPENAI_ADMIN_KEY
  if (!adminKey) {
    console.log('OpenAI: OPENAI_ADMIN_KEY not set, skipping')
    return
  }

  const startTime = Math.floor((Date.now() - 180 * 24 * 60 * 60 * 1000) / 1000)
  let page
  let rows = 0
  let totalUsd = 0

  do {
    const params = new URLSearchParams({
      start_time: String(startTime),
      bucket_width: '1d',
      limit: '180',
    })
    params.append('group_by', 'line_item')
    if (page) params.set('page', page)

    const res = await fetch(`https://api.openai.com/v1/organization/costs?${params}`, {
      headers: { Authorization: `Bearer ${adminKey}` },
    })
    if (!res.ok) {
      console.log(`OpenAI Costs API error ${res.status}:`, (await res.text()).slice(0, 300))
      return
    }

    const body = await res.json()
    for (const bucket of body.data || []) {
      const day = new Date(bucket.start_time * 1000).toISOString().split('T')[0]
      for (const item of bucket.results || []) {
        const usd = Number(item.amount?.value ?? 0)
        totalUsd += usd
        const { error } = await supabase.from('provider_costs_daily').upsert(
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
        if (error) {
          console.log('upsert error:', error.message)
          return
        }
        rows++
      }
    }
    page = body.has_more ? body.next_page : undefined
  } while (page)

  console.log(`OpenAI: upserted ${rows} daily line-item rows, total billed $${totalUsd.toFixed(2)} over 180 days`)
}

// ---------- Stripe: sanity-check revenue mapping (last 30 days) ----------
async function checkStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.log('Stripe: STRIPE_SECRET_KEY not set, skipping')
    return
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  const [{ data: customers }, { data: subs }] = await Promise.all([
    supabase.from('customers').select('user_id, stripe_customer_id').not('stripe_customer_id', 'is', null),
    supabase.from('customer_subscriptions').select('user_id, stripe_customer_id'),
  ])
  const map = new Map()
  for (const r of [...(customers || []), ...(subs || [])]) {
    if (r.stripe_customer_id && r.user_id) map.set(r.stripe_customer_id, r.user_id)
  }
  console.log(`Stripe: ${map.size} customer->user mappings in DB`)

  const created = { gte: Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000) }
  let startingAfter
  let total = 0
  let mapped = 0
  let count = 0
  do {
    const pageOpts = { created, limit: 100 }
    if (startingAfter) pageOpts.starting_after = startingAfter
    const pageRes = await stripe.charges.list(pageOpts)
    for (const c of pageRes.data) {
      if (c.status !== 'succeeded' || !c.paid) continue
      const net = (c.amount_captured ?? c.amount) - (c.amount_refunded || 0)
      if (net === 0) continue
      count++
      total += net
      const cust = typeof c.customer === 'string' ? c.customer : c.customer?.id
      if (cust && map.has(cust)) mapped += net
    }
    startingAfter = pageRes.has_more ? pageRes.data[pageRes.data.length - 1]?.id : undefined
  } while (startingAfter)

  console.log(
    `Stripe last 30d: ${count} charges, $${(total / 100).toFixed(2)} net revenue, ` +
      `$${(mapped / 100).toFixed(2)} mapped to members (${total > 0 ? Math.round((mapped / total) * 100) : 0}%)`
  )
}

await backfillOpenAI()
await checkStripe()
