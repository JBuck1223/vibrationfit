// PayPal webhook — signature-verified, idempotent backup for the capture route.
// Register the endpoint in the PayPal developer dashboard and set PAYPAL_WEBHOOK_ID.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyWebhookSignature } from '@/lib/paypal/webhooks'
import { getOrder } from '@/lib/paypal/orders'
import { fulfillPayPalPurchase, type PurchaseContext } from '@/lib/billing/fulfillment'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  const verified = await verifyWebhookSignature({ headers: request.headers, rawBody })
  if (!verified) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(rawBody)
  const eventType: string = event.event_type
  const resource = event.resource || {}

  try {
    switch (eventType) {
      // ----------------------------------------------------------------------
      // Backup fulfillment if the capture route died before finishing
      // ----------------------------------------------------------------------
      case 'PAYMENT.CAPTURE.COMPLETED': {
        const paypalOrderId: string | undefined =
          resource?.supplementary_data?.related_ids?.order_id
        if (!paypalOrderId) break

        const { data: checkoutSession } = await supabaseAdmin
          .from('paypal_checkout_sessions')
          .select('id, context, status')
          .eq('paypal_order_id', paypalOrderId)
          .maybeSingle()
        // Not one of our checkout orders (e.g. a cron renewal charge) — the
        // cron records those itself.
        if (!checkoutSession || checkoutSession.status === 'fulfilled') break

        const order = await getOrder(paypalOrderId)
        const card = order?.payment_source?.card
        const vaultAttrs = card?.attributes?.vault

        const result = await fulfillPayPalPurchase({
          paypalOrderId,
          paypalCaptureId: resource.id || null,
          amountPaid: resource?.amount?.value
            ? Math.round(parseFloat(resource.amount.value) * 100)
            : 0,
          currency: (resource?.amount?.currency_code || 'USD').toLowerCase(),
          context: checkoutSession.context as PurchaseContext,
          vault: vaultAttrs?.id
            ? {
                vaultId: vaultAttrs.id,
                paypalCustomerId: vaultAttrs.customer?.id || null,
                brand: card?.brand || null,
                last4: card?.last_digits || null,
                expiry: card?.expiry || null,
              }
            : null,
        })

        if (result) {
          await supabaseAdmin
            .from('paypal_checkout_sessions')
            .update({ status: 'fulfilled', updated_at: new Date().toISOString() })
            .eq('id', checkoutSession.id)
        }
        break
      }

      // ----------------------------------------------------------------------
      // Keep order status in sync when refunds happen in the PayPal dashboard
      // ----------------------------------------------------------------------
      case 'PAYMENT.CAPTURE.REFUNDED': {
        const captureId: string | undefined =
          resource?.links?.find((l: any) => l.rel === 'up')?.href?.split('/').pop()
        const refundId: string | undefined = resource?.id
        if (!captureId) break

        await supabaseAdmin
          .from('orders')
          .update({
            status: 'refunded',
            paypal_refund_id: refundId || null,
            updated_at: new Date().toISOString(),
          })
          .eq('paypal_capture_id', captureId)
        break
      }

      // ----------------------------------------------------------------------
      // Vault token lifecycle (capture route stores it synchronously; this
      // handles delayed vaulting and revocations)
      // ----------------------------------------------------------------------
      case 'VAULT.PAYMENT-TOKEN.CREATED': {
        const vaultId: string | undefined = resource?.id
        if (!vaultId) break
        await supabaseAdmin
          .from('payment_methods')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('paypal_vault_id', vaultId)
        break
      }

      case 'VAULT.PAYMENT-TOKEN.DELETED': {
        const vaultId: string | undefined = resource?.id
        if (!vaultId) break
        await supabaseAdmin
          .from('payment_methods')
          .update({ status: 'revoked', is_default: false, updated_at: new Date().toISOString() })
          .eq('paypal_vault_id', vaultId)
        break
      }

      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[paypal webhook] handler error:', eventType, error)
    // 500 so PayPal retries
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
