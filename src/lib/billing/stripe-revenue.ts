// ============================================================================
// Stripe revenue — real charges per member for a date range
// ============================================================================
// payment_history is not populated by the webhook, so revenue comes straight
// from the Stripe Charges API: every succeeded charge (subscriptions,
// intensives, token packs) in the range, net of refunds, grouped by customer
// and mapped to app users via customers / customer_subscriptions.

import { stripe } from '@/lib/stripe/config'

export interface StripeRevenueResult {
  /** user_id -> net revenue cents in range */
  byUser: Map<string, number>
  /** revenue from charges whose customer could not be mapped to a user */
  unmappedCents: number
  totalCents: number
  chargesCount: number
  available: boolean
  error?: string
}

export async function fetchStripeRevenueByUser(
  supabase: any,
  startIso: string,
  endIso: string
): Promise<StripeRevenueResult> {
  const result: StripeRevenueResult = {
    byUser: new Map(),
    unmappedCents: 0,
    totalCents: 0,
    chargesCount: 0,
    available: false,
  }

  if (!stripe) {
    result.error = 'STRIPE_SECRET_KEY not configured'
    return result
  }

  try {
    // 1. Stripe customer -> user mapping from both local sources
    const customerToUser = new Map<string, string>()

    const [{ data: customerRows }, { data: subscriptionRows }] = await Promise.all([
      supabase.from('customers').select('user_id, stripe_customer_id').not('stripe_customer_id', 'is', null),
      supabase.from('customer_subscriptions').select('user_id, stripe_customer_id'),
    ])

    for (const row of [...(customerRows || []), ...(subscriptionRows || [])]) {
      if (row.stripe_customer_id && row.user_id) {
        customerToUser.set(row.stripe_customer_id, row.user_id)
      }
    }

    // 2. All succeeded charges in the range, net of refunds
    const created = {
      gte: Math.floor(new Date(startIso).getTime() / 1000),
      lte: Math.floor(new Date(endIso).getTime() / 1000),
    }

    let startingAfter: string | undefined
    do {
      const page = await stripe.charges.list({
        created,
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      })

      for (const charge of page.data) {
        if (charge.status !== 'succeeded' || !charge.paid) continue

        const netCents = (charge.amount_captured ?? charge.amount) - (charge.amount_refunded || 0)
        if (netCents === 0) continue

        result.chargesCount++
        result.totalCents += netCents

        const customerId = typeof charge.customer === 'string' ? charge.customer : charge.customer?.id
        const userId = customerId ? customerToUser.get(customerId) : undefined

        if (userId) {
          result.byUser.set(userId, (result.byUser.get(userId) || 0) + netCents)
        } else {
          result.unmappedCents += netCents
        }
      }

      startingAfter = page.has_more ? page.data[page.data.length - 1]?.id : undefined
    } while (startingAfter)

    result.available = true
    return result
  } catch (err) {
    result.error = err instanceof Error ? err.message : 'Stripe revenue fetch failed'
    return result
  }
}
