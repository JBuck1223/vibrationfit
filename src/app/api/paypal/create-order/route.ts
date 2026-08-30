// Creates a PayPal order for the on-site card fields checkout.
// Amount and product config come entirely from our database (resolveProduct);
// the full checkout context is stashed server-side in paypal_checkout_sessions
// so the capture route can fulfill without trusting the client.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createCardOrder } from '@/lib/paypal/orders'
import { isPayPalConfigured } from '@/lib/paypal/client'
import { resolveProduct } from '@/lib/billing/products'

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

    const body = await request.json()
    const {
      name,
      email,
      phone,
      product,
      plan,
      continuity,
      planType,
      packKey,
      promoCode,
      promoPackage,
      referralSource,
      campaignName,
      cartSessionId,
      visitorId,
      sessionId,
      partnerFirstName,
      partnerLastName,
      partnerEmail,
    } = body as Record<string, string | undefined>

    if (!name || !email || !product) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // -----------------------------------------------------------------------
    // Resolve product + amount from the database
    // -----------------------------------------------------------------------
    const checkoutProduct = await resolveProduct({ product, plan, continuity, planType, packKey })
    if (!checkoutProduct) {
      return NextResponse.json({ error: 'Invalid product configuration' }, { status: 400 })
    }

    if (promoPackage === 'standard_promo') {
      checkoutProduct.amount = 100
    }
    if (promoPackage) {
      checkoutProduct.metadata.promo_package = promoPackage
    }

    // -----------------------------------------------------------------------
    // Coupon validation (redemption is recorded during fulfillment)
    // -----------------------------------------------------------------------
    const { validateCouponCode, calculateDiscount, resolveIntensiveLaunchPromoCode } = await import('@/lib/billing/coupons')
    let discountAmount = 0
    const resolvedPromoCode = resolveIntensiveLaunchPromoCode(promoCode, planType)
    if (resolvedPromoCode) {
      const couponResult = await validateCouponCode(resolvedPromoCode, {
        productKey: product,
        purchaseAmount: checkoutProduct.amount,
      })
      if (couponResult.valid && couponResult.coupon) {
        discountAmount = calculateDiscount(couponResult.coupon, checkoutProduct.amount)
      }
    }

    const chargeAmount = Math.max(0, checkoutProduct.amount - discountAmount)
    if (chargeAmount < 100) {
      // PayPal cannot process $0 orders; $1 launch promos are the floor.
      return NextResponse.json({ error: 'Order total too low to process' }, { status: 400 })
    }

    // -----------------------------------------------------------------------
    // Create the PayPal order (card vaulted on successful capture)
    // -----------------------------------------------------------------------
    const paypalOrder = await createCardOrder({
      amountCents: chargeAmount,
      currency: checkoutProduct.currency,
      description: checkoutProduct.name,
      customId: cartSessionId || sessionId || product,
    })

    // Stash the full context server-side for capture-time fulfillment
    const { error: ctxError } = await supabaseAdmin.from('paypal_checkout_sessions').insert({
      paypal_order_id: paypalOrder.id,
      cart_session_id: cartSessionId || null,
      amount_cents: chargeAmount,
      currency: checkoutProduct.currency,
      status: 'created',
      context: {
        name,
        email,
        phone: phone || '',
        product,
        plan: plan || 'full',
        planType: planType || 'solo',
        continuity: continuity || '28day',
        packKey: packKey || null,
        promoCode: resolvedPromoCode || null,
        referralSource: referralSource || null,
        campaignName: campaignName || null,
        cartSessionId: cartSessionId || null,
        visitorId: visitorId || null,
        sessionId: sessionId || null,
        partnerFirstName: partnerFirstName || null,
        partnerLastName: partnerLastName || null,
        partnerEmail: partnerEmail || null,
        promoPackage: promoPackage || null,
        intensiveLevel: promoPackage === 'premium_promo' || product === 'intensive_premium' ? 'premium' : null,
      },
    })
    if (ctxError) {
      console.error('[paypal create-order] context insert failed:', ctxError)
      return NextResponse.json({ error: 'Failed to initialize checkout' }, { status: 500 })
    }

    // Track checkout start on the cart
    if (cartSessionId) {
      await supabaseAdmin
        .from('cart_sessions')
        .update({ status: 'checkout_started', email, updated_at: new Date().toISOString() })
        .eq('id', cartSessionId)
    }

    return NextResponse.json({ id: paypalOrder.id })
  } catch (error) {
    console.error('[paypal create-order] error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to create order', details: message }, { status: 500 })
  }
}
