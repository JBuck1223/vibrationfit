/**
 * Admin Refund API
 *
 * POST /api/admin/refund - Process a full, partial, or line-item refund via Stripe
 *   Body: { orderId, amount?, reason?, itemIds? }
 *   - amount: optional cents amount for partial refund (omit for full refund)
 *   - reason: optional Stripe refund reason
 *   - itemIds: optional array of order_item IDs to refund specific line items
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { createAdminNotification, notifyAdminSMS } from '@/lib/admin/notifications'

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const { orderId, amount, reason, itemIds } = await request.json()

  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
  }

  const adminDb = createAdminClient()

  const { data: order, error: orderError } = await adminDb
    .from('orders')
    .select('id, user_id, total_amount, currency, status, stripe_payment_intent_id, stripe_checkout_session_id, metadata')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  if (order.status === 'refunded') {
    return NextResponse.json({ error: 'Order is already fully refunded' }, { status: 400 })
  }

  let paymentIntentId = order.stripe_payment_intent_id

  if (!paymentIntentId && order.stripe_checkout_session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(order.stripe_checkout_session_id)
      paymentIntentId = session.payment_intent as string
    } catch {
      // fall through
    }
  }

  if (!paymentIntentId) {
    return NextResponse.json(
      { error: 'No payment intent found for this order. Refund must be processed directly in Stripe.' },
      { status: 400 },
    )
  }

  // Line-item refund: calculate amount from selected items
  let refundAmount: number
  let isPartial: boolean
  let refundedItemIds: string[] = []

  if (itemIds && Array.isArray(itemIds) && itemIds.length > 0) {
    const { data: items, error: itemsError } = await adminDb
      .from('order_items')
      .select('id, amount, completion_status, products(name)')
      .eq('order_id', orderId)
      .in('id', itemIds)

    if (itemsError || !items || items.length === 0) {
      return NextResponse.json({ error: 'No matching line items found' }, { status: 400 })
    }

    const alreadyRefunded = items.filter(i => i.completion_status === 'refunded')
    if (alreadyRefunded.length > 0) {
      const names = alreadyRefunded.map(i => (i as any).products?.name || i.id.slice(0, 8)).join(', ')
      return NextResponse.json({ error: `Already refunded: ${names}` }, { status: 400 })
    }

    refundAmount = items.reduce((sum, i) => sum + (i.amount || 0), 0)
    refundedItemIds = items.map(i => i.id)

    const { data: allItems } = await adminDb
      .from('order_items')
      .select('id, completion_status')
      .eq('order_id', orderId)

    const nonRefundedAfter = (allItems || []).filter(
      i => i.completion_status !== 'refunded' && !refundedItemIds.includes(i.id)
    )
    isPartial = nonRefundedAfter.length > 0
  } else {
    refundAmount = amount || order.total_amount
    isPartial = !!(amount && amount < order.total_amount)
  }

  if (refundAmount <= 0) {
    return NextResponse.json({ error: 'Refund amount must be greater than zero' }, { status: 400 })
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: refundAmount,
      reason: (reason as 'duplicate' | 'fraudulent' | 'requested_by_customer') || 'requested_by_customer',
    })

    const existingRefunds = order.metadata?.refunds || []
    const refundRecord = {
      refund_id: refund.id,
      amount: refundAmount,
      item_ids: refundedItemIds.length > 0 ? refundedItemIds : null,
      type: refundedItemIds.length > 0 ? 'line_item' : (isPartial ? 'partial' : 'full'),
      refunded_at: new Date().toISOString(),
      refunded_by: auth.user.id,
    }

    const newStatus = isPartial ? 'paid' : 'refunded'
    await adminDb
      .from('orders')
      .update({
        status: newStatus,
        metadata: {
          ...(order.metadata || {}),
          refund_id: refund.id,
          refund_amount: refundAmount,
          refund_type: refundedItemIds.length > 0 ? 'line_item' : (isPartial ? 'partial' : 'full'),
          refunded_at: new Date().toISOString(),
          refunded_by: auth.user.id,
          refunds: [...existingRefunds, refundRecord],
        },
      })
      .eq('id', orderId)

    if (refundedItemIds.length > 0) {
      await adminDb
        .from('order_items')
        .update({
          completion_status: 'refunded',
          refunded_at: new Date().toISOString(),
        })
        .in('id', refundedItemIds)
    } else if (!isPartial) {
      await adminDb
        .from('order_items')
        .update({
          completion_status: 'refunded',
          refunded_at: new Date().toISOString(),
        })
        .eq('order_id', orderId)
    }

    const { data: account } = await adminDb
      .from('user_accounts')
      .select('email, full_name, first_name')
      .eq('id', order.user_id)
      .single()

    const customerName = account?.full_name || account?.first_name || account?.email || 'Unknown'
    const amountStr = `$${(refundAmount / 100).toFixed(2)}`
    const refundTypeLabel = refundedItemIds.length > 0
      ? `Line item refund (${refundedItemIds.length} item${refundedItemIds.length > 1 ? 's' : ''})`
      : (isPartial ? 'Partial' : 'Full')

    createAdminNotification({
      type: 'refund',
      title: `Refund Processed: ${customerName}`,
      body: `${refundTypeLabel} refund of ${amountStr} for order ${orderId.slice(0, 8)}...`,
      metadata: { orderId, userId: order.user_id, amount: refundAmount, refundId: refund.id, itemIds: refundedItemIds },
      link: '/admin/orders',
    }).catch(err => console.error('Refund admin notification error:', err))

    notifyAdminSMS(
      `Refund processed: ${customerName} - ${refundTypeLabel.toLowerCase()} refund of ${amountStr}`,
    ).catch(err => console.error('Refund SMS notification error:', err))

    return NextResponse.json({
      success: true,
      refundId: refund.id,
      amount: refundAmount,
      type: refundedItemIds.length > 0 ? 'line_item' : (isPartial ? 'partial' : 'full'),
      status: refund.status,
      itemIds: refundedItemIds,
    })
  } catch (err: any) {
    console.error('Stripe refund error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to process refund' },
      { status: 500 },
    )
  }
}
