// Captures an approved PayPal order and runs fulfillment synchronously.
// The PayPal webhook acts as an idempotent backup if this request dies mid-way.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { captureOrder } from '@/lib/paypal/orders'
import { isPayPalConfigured, PayPalApiError } from '@/lib/paypal/client'
import { fulfillPayPalPurchase, type PurchaseContext } from '@/lib/billing/fulfillment'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

export async function POST(request: NextRequest) {
  try {
    if (!isPayPalConfigured()) {
      return NextResponse.json({ error: 'PayPal not configured' }, { status: 500 })
    }

    const { orderID } = (await request.json()) as { orderID?: string }
    if (!orderID) {
      return NextResponse.json({ error: 'Missing orderID' }, { status: 400 })
    }

    // Only capture orders this server created (context row must exist)
    const { data: checkoutSession } = await supabaseAdmin
      .from('paypal_checkout_sessions')
      .select('id, context, status, amount_cents, currency')
      .eq('paypal_order_id', orderID)
      .maybeSingle()
    if (!checkoutSession) {
      return NextResponse.json({ error: 'Unknown order' }, { status: 404 })
    }

    // -----------------------------------------------------------------------
    // Capture
    // -----------------------------------------------------------------------
    let capture
    try {
      capture = await captureOrder(orderID)
    } catch (err) {
      if (err instanceof PayPalApiError && (err.body as any)?.details?.[0]?.issue === 'ORDER_ALREADY_CAPTURED') {
        const { getOrder } = await import('@/lib/paypal/orders')
        const order = await getOrder(orderID)
        const cap = order?.purchase_units?.[0]?.payments?.captures?.[0]
        capture = {
          orderId: orderID,
          captureId: cap?.id || null,
          status: cap?.status || 'COMPLETED',
          amountCents: cap?.amount?.value ? Math.round(parseFloat(cap.amount.value) * 100) : checkoutSession.amount_cents,
          currency: (cap?.amount?.currency_code || checkoutSession.currency || 'USD').toLowerCase(),
          vault: order?.payment_source?.card?.attributes?.vault?.id
            ? {
                vaultId: order.payment_source.card.attributes.vault.id,
                paypalCustomerId: order.payment_source.card.attributes.vault.customer?.id || null,
                brand: order.payment_source.card.brand || null,
                last4: order.payment_source.card.last_digits || null,
                expiry: order.payment_source.card.expiry || null,
              }
            : null,
          raw: order,
        }
      } else {
        throw err
      }
    }

    if (capture.status !== 'COMPLETED') {
      await supabaseAdmin
        .from('paypal_checkout_sessions')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', checkoutSession.id)
      console.error('[paypal capture] capture not completed:', capture.status, capture.raw?.id)
      return NextResponse.json(
        { error: 'Payment was not completed. Please try a different card.' },
        { status: 402 },
      )
    }

    await supabaseAdmin
      .from('paypal_checkout_sessions')
      .update({ status: 'captured', updated_at: new Date().toISOString() })
      .eq('id', checkoutSession.id)

    // -----------------------------------------------------------------------
    // Fulfill synchronously (webhook is the idempotent backup)
    // -----------------------------------------------------------------------
    const context = checkoutSession.context as PurchaseContext
    const result = await fulfillPayPalPurchase({
      paypalOrderId: orderID,
      paypalCaptureId: capture.captureId,
      amountPaid: capture.amountCents,
      currency: capture.currency,
      context,
      vault: capture.vault,
      requestMeta: {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    })

    if (result) {
      await supabaseAdmin
        .from('paypal_checkout_sessions')
        .update({ status: 'fulfilled', updated_at: new Date().toISOString() })
        .eq('id', checkoutSession.id)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    return NextResponse.json({
      status: 'COMPLETED',
      orderId: result?.orderId || null,
      redirectUrl: `${appUrl}/checkout/success?order_id=${result?.orderId || ''}&gateway=paypal`,
    })
  } catch (error) {
    console.error('[paypal capture] error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    const friendly = message.includes('INSTRUMENT_DECLINED')
      ? 'Your card was declined. Please try a different card.'
      : 'Payment failed. Please try again.'
    return NextResponse.json({ error: friendly, details: message }, { status: 500 })
  }
}
