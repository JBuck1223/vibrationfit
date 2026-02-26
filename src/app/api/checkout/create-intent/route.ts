import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const body = await request.json()
    const {
      name,
      email,
      phone,
      password,
      product,
      plan,
      continuity,
      planType,
      packKey,
      promoCode,
      referralSource,
      campaignName,
      cartSessionId,
      visitorId,
      sessionId,
    } = body as {
      name: string
      email: string
      phone: string
      password: string
      product: string
      plan?: string
      continuity?: string
      planType?: string
      packKey?: string
      promoCode?: string
      referralSource?: string
      campaignName?: string
      cartSessionId?: string
      visitorId?: string
      sessionId?: string
    }

    if (!name || !email || !password || !product) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // ------------------------------------------------------------------
    // 1. Create or find the Supabase user
    // ------------------------------------------------------------------
    let userId: string

    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)

    if (existingUser) {
      userId = existingUser.id
      await supabaseAdmin.auth.admin.updateUserById(userId, { password })
    } else {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name, phone },
      })
      if (createError || !newUser?.user) {
        console.error('Failed to create user:', createError)
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
      }
      userId = newUser.user.id
    }

    // Ensure profile row exists
    await supabaseAdmin.from('user_profiles').upsert(
      { user_id: userId, full_name: name, phone: phone || null },
      { onConflict: 'user_id' }
    )

    // Sync name and phone to user_accounts (trigger may have missed full_name split)
    const nameParts = (name || '').trim().split(' ')
    const firstName = nameParts[0] || null
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null
    await supabaseAdmin.from('user_accounts').update({
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
    }).eq('id', userId)

    // ------------------------------------------------------------------
    // 2. Create or find the Stripe customer
    // ------------------------------------------------------------------
    let stripeCustomerId: string | null = null

    const { data: existingSub } = await supabaseAdmin
      .from('customer_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    if (existingSub?.stripe_customer_id) {
      stripeCustomerId = existingSub.stripe_customer_id
    }

    if (!stripeCustomerId) {
      const customers = await stripe.customers.list({ email, limit: 1 })
      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id
        await stripe.customers.update(stripeCustomerId, {
          metadata: { supabase_user_id: userId },
          name,
          phone: phone || undefined,
        })
      }
    }

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email,
        name,
        phone: phone || undefined,
        metadata: { supabase_user_id: userId },
      })
      stripeCustomerId = customer.id
    }

    // ------------------------------------------------------------------
    // 3. Attribution waterfall: create customers SSOT row
    // ------------------------------------------------------------------
    let customerRowId: string | null = null

    const { data: existingCustomerRow } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingCustomerRow) {
      customerRowId = existingCustomerRow.id
      await supabaseAdmin
        .from('customers')
        .update({
          stripe_customer_id: stripeCustomerId,
          last_active_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', customerRowId)
    } else {
      // Fetch visitor first-touch attribution for waterfall
      let visitorData: Record<string, unknown> | null = null
      if (visitorId) {
        const { data } = await supabaseAdmin
          .from('visitors')
          .select('*')
          .eq('id', visitorId)
          .single()
        visitorData = data

        // Link visitor to user
        if (visitorData && !visitorData.user_id) {
          await supabaseAdmin
            .from('visitors')
            .update({ user_id: userId })
            .eq('id', visitorId)
        }
      }

      const { data: newCustomerRow } = await supabaseAdmin
        .from('customers')
        .insert({
          user_id: userId,
          visitor_id: visitorId || null,
          stripe_customer_id: stripeCustomerId,

          first_utm_source: (visitorData?.first_utm_source as string) || null,
          first_utm_medium: (visitorData?.first_utm_medium as string) || null,
          first_utm_campaign: (visitorData?.first_utm_campaign as string) || null,
          first_utm_content: (visitorData?.first_utm_content as string) || null,
          first_utm_term: (visitorData?.first_utm_term as string) || null,
          first_gclid: (visitorData?.first_gclid as string) || null,
          first_fbclid: (visitorData?.first_fbclid as string) || null,
          first_landing_page: (visitorData?.first_landing_page as string) || null,
          first_referrer: (visitorData?.first_referrer as string) || null,
          first_url_params: visitorData?.first_url_params || {},

          first_seen_at: (visitorData?.first_seen_at as string) || new Date().toISOString(),
          email_captured_at: new Date().toISOString(),
          first_purchase_at: new Date().toISOString(),
          last_purchase_at: new Date().toISOString(),
          last_active_at: new Date().toISOString(),

          status: 'customer',
        })
        .select('id')
        .single()

      customerRowId = newCustomerRow?.id || null
    }

    // ------------------------------------------------------------------
    // 4. Resolve product & pricing from database
    // ------------------------------------------------------------------
    const { resolveProduct } = await import('@/lib/billing/products')
    const checkoutProduct = await resolveProduct({ product, plan, continuity, planType, packKey })

    if (!checkoutProduct) {
      return NextResponse.json({ error: 'Invalid product configuration' }, { status: 400 })
    }

    const priceId = checkoutProduct.stripePriceId
    if (!priceId) {
      return NextResponse.json(
        { error: `Stripe price not configured for ${checkoutProduct.key}` },
        { status: 500 }
      )
    }

    // ------------------------------------------------------------------
    // 5. Validate coupon from database
    // ------------------------------------------------------------------
    const { validateCouponCode, calculateDiscount, recordRedemption } = await import('@/lib/billing/coupons')

    let couponResult: Awaited<ReturnType<typeof validateCouponCode>> | null = null
    let discountAmount = 0

    if (promoCode) {
      couponResult = await validateCouponCode(promoCode, {
        userId,
        productKey: product,
        purchaseAmount: checkoutProduct.amount,
      })

      if (couponResult.valid && couponResult.coupon) {
        discountAmount = calculateDiscount(couponResult.coupon, checkoutProduct.amount)
      }
    }

    const fullMetadata: Record<string, string> = {
      ...checkoutProduct.metadata,
      user_id: userId,
      promo_code: promoCode || '',
      referral_source: referralSource || '',
      campaign_name: campaignName || '',
      cart_session_id: cartSessionId || '',
      visitor_id: visitorId || '',
    }

    // ------------------------------------------------------------------
    // 6. Create PaymentIntent or Subscription
    // ------------------------------------------------------------------
    let clientSecret: string

    if (checkoutProduct.mode === 'payment') {
      const intentParams: Stripe.PaymentIntentCreateParams = {
        amount: Math.max(0, checkoutProduct.amount - discountAmount),
        currency: checkoutProduct.currency,
        customer: stripeCustomerId,
        metadata: fullMetadata,
        automatic_payment_methods: { enabled: true },
      }

      const paymentIntent = await stripe.paymentIntents.create(intentParams)
      clientSecret = paymentIntent.client_secret!

      if (couponResult?.valid && couponResult.coupon && couponResult.codeRow) {
        recordRedemption({
          couponId: couponResult.coupon.id,
          couponCodeId: couponResult.codeRow.id,
          userId,
          discountAmount,
          originalAmount: checkoutProduct.amount,
          productKey: product,
        }).catch(err => console.error('Failed to record coupon redemption:', err))
      }
    } else {
      const subParams: Stripe.SubscriptionCreateParams = {
        customer: stripeCustomerId,
        items: [{ price: priceId, quantity: 1 }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: fullMetadata,
      }

      if (couponResult?.valid && couponResult.coupon && discountAmount > 0) {
        const stripeCoupon = await stripe.coupons.create(
          couponResult.coupon.discount_type === 'percent'
            ? { percent_off: couponResult.coupon.discount_value, duration: 'once' }
            : { amount_off: discountAmount, currency: 'usd', duration: 'once' },
        );
        (subParams as any).coupon = stripeCoupon.id
      }

      const subscription = await stripe.subscriptions.create(subParams)
      const invoice = subscription.latest_invoice as any
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent
      clientSecret = paymentIntent.client_secret!

      if (couponResult?.valid && couponResult.coupon && couponResult.codeRow) {
        recordRedemption({
          couponId: couponResult.coupon.id,
          couponCodeId: couponResult.codeRow.id,
          userId,
          discountAmount,
          originalAmount: checkoutProduct.amount,
          productKey: product,
        }).catch(err => console.error('Failed to record coupon redemption:', err))
      }
    }

    // ------------------------------------------------------------------
    // 7. Create order + order_items (wire up the order chain)
    // ------------------------------------------------------------------
    const { data: order } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId,
        customer_id: customerRowId,
        cart_session_id: cartSessionId || null,
        total_amount: checkoutProduct.amount - discountAmount,
        currency: checkoutProduct.currency,
        status: 'pending',
        promo_code: promoCode || null,
        referral_source: referralSource || null,
        campaign_name: campaignName || null,
        metadata: {
          product_key: product,
          plan,
          continuity,
          plan_type: planType,
          visitor_id: visitorId || null,
          session_id: sessionId || null,
        },
      })
      .select('id')
      .single()

    if (order) {
      // Look up the DB product ID for the order_item FK
      const productKey = product === 'intensive'
        ? (planType === 'household' ? 'intensive_household' : 'intensive')
        : product === 'token-pack' ? 'tokens' : product
      const { data: dbProd } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('key', productKey)
        .maybeSingle()

      if (dbProd) {
        const { error: oiErr } = await supabaseAdmin.from('order_items').insert({
          order_id: order.id,
          product_id: dbProd.id,
          quantity: 1,
          amount: checkoutProduct.amount - discountAmount,
          currency: checkoutProduct.currency,
          payment_plan: plan || 'full',
          is_subscription: checkoutProduct.mode === 'subscription',
          promo_code: promoCode || null,
          referral_source: referralSource || null,
          campaign_name: campaignName || null,
          metadata: fullMetadata,
        })
        if (oiErr) console.error('Failed to create order_item:', oiErr)
      }
    }

    // Mark cart as checkout_started if not already
    if (cartSessionId) {
      await supabaseAdmin
        .from('cart_sessions')
        .update({
          status: 'checkout_started',
          user_id: userId,
          email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', cartSessionId)
    }

    // ------------------------------------------------------------------
    // 8. Journey event: purchase_completed + update customers metrics
    // ------------------------------------------------------------------
    await supabaseAdmin.from('journey_events').insert({
      visitor_id: visitorId || null,
      session_id: sessionId || null,
      user_id: userId,
      cart_session_id: cartSessionId || null,
      event_type: 'purchase_completed',
      event_data: {
        order_id: order?.id || null,
        product_key: product,
        amount: checkoutProduct.amount - discountAmount,
        promo_code: promoCode || null,
      },
    })

    // Update customers SSOT with purchase metrics
    if (customerRowId) {
      const { data: custData } = await supabaseAdmin
        .from('customers')
        .select('total_orders, total_spent')
        .eq('id', customerRowId)
        .single()

      await supabaseAdmin
        .from('customers')
        .update({
          total_orders: (custData?.total_orders || 0) + 1,
          total_spent: (custData?.total_spent || 0) + (checkoutProduct.amount - discountAmount),
          last_purchase_at: new Date().toISOString(),
          last_active_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', customerRowId)
    }

    // Mark session as converted
    if (sessionId) {
      await supabaseAdmin
        .from('sessions')
        .update({ converted: true, conversion_type: 'purchase' })
        .eq('id', sessionId)
    }

    // ------------------------------------------------------------------
    // 9. Return to client
    // ------------------------------------------------------------------
    return NextResponse.json({
      clientSecret,
      userId,
      redirectUrl: checkoutProduct.redirectAfterSuccess,
      orderId: order?.id || null,
    })
  } catch (error) {
    console.error('Create intent error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to create checkout intent', details: message }, { status: 500 })
  }
}
