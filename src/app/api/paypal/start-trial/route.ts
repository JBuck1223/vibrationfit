// Trial checkout counterpart to /api/paypal/capture. The card was saved with a
// vault setup token (no charge); exchange it for a permanent vault token and
// run the same fulfillment with a $0 order and a trialing membership.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isPayPalConfigured } from '@/lib/paypal/client'
import { createPaymentTokenFromSetupToken } from '@/lib/paypal/vault'
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

    const { setupTokenId } = (await request.json()) as { setupTokenId?: string }
    if (!setupTokenId) {
      return NextResponse.json({ error: 'Missing setup token' }, { status: 400 })
    }

    const { data: checkoutSession } = await supabaseAdmin
      .from('paypal_checkout_sessions')
      .select('id, context, status, currency')
      .eq('paypal_order_id', setupTokenId)
      .maybeSingle()
    const context = checkoutSession?.context as PurchaseContext | undefined
    if (!checkoutSession || !context?.trialDays) {
      return NextResponse.json({ error: 'Unknown checkout' }, { status: 404 })
    }

    const card = await createPaymentTokenFromSetupToken(setupTokenId)

    await supabaseAdmin
      .from('paypal_checkout_sessions')
      .update({ status: 'captured', updated_at: new Date().toISOString() })
      .eq('id', checkoutSession.id)

    const result = await fulfillPayPalPurchase({
      paypalOrderId: setupTokenId,
      paypalCaptureId: null,
      amountPaid: 0,
      currency: checkoutSession.currency || 'usd',
      context,
      vault: card,
      requestMeta: {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    })

    if (!result) {
      return NextResponse.json({ error: 'Could not start your trial. Please try again.' }, { status: 500 })
    }

    await supabaseAdmin
      .from('paypal_checkout_sessions')
      .update({ status: 'fulfilled', updated_at: new Date().toISOString() })
      .eq('id', checkoutSession.id)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    return NextResponse.json({
      status: 'COMPLETED',
      orderId: result.orderId,
      redirectUrl: `${appUrl}/checkout/success?order_id=${result.orderId}&gateway=paypal`,
    })
  } catch (error) {
    console.error('[paypal start-trial] error:', error)
    return NextResponse.json({ error: 'Could not save your card. Please try again.' }, { status: 500 })
  }
}
