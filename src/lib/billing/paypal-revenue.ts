// ============================================================================
// PayPal revenue — real charges per member for a date range, from our own DB
// ============================================================================
// PayPal money lands in two tables:
//   - orders (provider = 'paypal'): checkout purchases, pack purchases, and
//     vault charges that create an order row. Refunds live in metadata.refunds
//     and flip status to 'refunded'.
//   - payment_history (provider = 'paypal', status = 'succeeded'): every vault
//     charge (renewals, prorations, intensives). Some of these also have an
//     orders row for the same capture — dedupe on paypal_capture_id/order_id.

export interface PayPalRevenueResult {
  /** user_id -> net revenue cents in range */
  byUser: Map<string, number>
  totalCents: number
  chargesCount: number
  available: boolean
  error?: string
}

function orderRefundedCents(order: { status: string; total_amount: number; metadata: any }): number {
  const refunds = order.metadata?.refunds
  if (Array.isArray(refunds) && refunds.length > 0) {
    return refunds.reduce((sum: number, r: any) => sum + Number(r?.amount || 0), 0)
  }
  if (order.metadata?.refund_amount) return Number(order.metadata.refund_amount)
  // Dashboard refunds arrive via webhook with no metadata — treat as full
  if (order.status === 'refunded') return Number(order.total_amount || 0)
  return 0
}

export async function fetchPayPalRevenueByUser(
  supabase: any,
  startIso: string,
  endIso: string
): Promise<PayPalRevenueResult> {
  const result: PayPalRevenueResult = {
    byUser: new Map(),
    totalCents: 0,
    chargesCount: 0,
    available: false,
  }

  try {
    const [{ data: orderRows, error: ordersError }, { data: historyRows, error: historyError }] =
      await Promise.all([
        supabase
          .from('orders')
          .select('user_id, total_amount, status, metadata, paypal_order_id, paypal_capture_id, paid_at')
          .eq('provider', 'paypal')
          .gte('paid_at', startIso)
          .lte('paid_at', endIso),
        supabase
          .from('payment_history')
          .select('user_id, amount, status, paypal_order_id, paypal_capture_id, paid_at')
          .eq('provider', 'paypal')
          .eq('status', 'succeeded')
          .gte('paid_at', startIso)
          .lte('paid_at', endIso),
      ])

    if (ordersError) throw new Error(`orders query failed: ${ordersError.message}`)
    if (historyError) throw new Error(`payment_history query failed: ${historyError.message}`)

    const add = (userId: string | null, cents: number) => {
      if (cents === 0) return
      result.chargesCount++
      result.totalCents += cents
      if (userId) result.byUser.set(userId, (result.byUser.get(userId) || 0) + cents)
    }

    const seenCaptures = new Set<string>()
    for (const order of orderRows || []) {
      if (order.status === 'failed' || order.status === 'created') continue
      if (order.paypal_capture_id) seenCaptures.add(order.paypal_capture_id)
      if (order.paypal_order_id) seenCaptures.add(order.paypal_order_id)
      const netCents = Number(order.total_amount || 0) - orderRefundedCents(order)
      add(order.user_id, netCents)
    }

    // Vault charges without a matching orders row (renewals, prorations)
    for (const row of historyRows || []) {
      if (row.paypal_capture_id && seenCaptures.has(row.paypal_capture_id)) continue
      if (row.paypal_order_id && seenCaptures.has(row.paypal_order_id)) continue
      add(row.user_id, Number(row.amount || 0))
    }

    result.available = true
    return result
  } catch (err) {
    result.error = err instanceof Error ? err.message : 'PayPal revenue fetch failed'
    return result
  }
}
