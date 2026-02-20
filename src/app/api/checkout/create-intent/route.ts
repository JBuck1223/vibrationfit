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
    // 3. Resolve product & pricing
    // ------------------------------------------------------------------
    const { resolveCheckoutProduct } = await import('@/lib/checkout/products')
    const checkoutProduct = resolveCheckoutProduct({ product, plan, continuity, planType, packKey })

    if (!checkoutProduct) {
      return NextResponse.json({ error: 'Invalid product configuration' }, { status: 400 })
    }

    const priceId = checkoutProduct.getPriceEnvKey()
    if (!priceId) {
      return NextResponse.json(
        { error: `Stripe price not configured for ${checkoutProduct.key}` },
        { status: 500 }
      )
    }

    // Apply promo code if provided
    let couponId: string | undefined
    if (promoCode) {
      try {
        const promoCodes = await stripe.promotionCodes.list({ code: promoCode, active: true, limit: 1 })
        if (promoCodes.data.length > 0) {
          couponId = (promoCodes.data[0] as any).coupon.id
        } else {
          try {
            await stripe.coupons.retrieve(promoCode)
            couponId = promoCode
          } catch {
            // Invalid code -- proceed without discount
          }
        }
      } catch {
        // Proceed without discount
      }
    }

    const fullMetadata: Record<string, string> = {
      ...checkoutProduct.metadata,
      user_id: userId,
      promo_code: promoCode || '',
      referral_source: referralSource || '',
      campaign_name: campaignName || '',
    }

    // ------------------------------------------------------------------
    // 4. Create PaymentIntent or Subscription
    // ------------------------------------------------------------------
    let clientSecret: string

    if (checkoutProduct.mode === 'payment') {
      const intentParams: Stripe.PaymentIntentCreateParams = {
        amount: checkoutProduct.amount,
        currency: checkoutProduct.currency,
        customer: stripeCustomerId,
        metadata: fullMetadata,
        automatic_payment_methods: { enabled: true },
      }

      if (couponId) {
        const coupon = await stripe.coupons.retrieve(couponId)
        if (coupon.percent_off) {
          intentParams.amount = Math.round(checkoutProduct.amount * (1 - coupon.percent_off / 100))
        } else if (coupon.amount_off) {
          intentParams.amount = Math.max(0, checkoutProduct.amount - coupon.amount_off)
        }
      }

      const paymentIntent = await stripe.paymentIntents.create(intentParams)
      clientSecret = paymentIntent.client_secret!
    } else {
      // Subscription mode (installment plans)
      const subParams: Stripe.SubscriptionCreateParams = {
        customer: stripeCustomerId,
        items: [{ price: priceId, quantity: 1 }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: fullMetadata,
      }

      if (couponId) {
        (subParams as any).coupon = couponId
      }

      const subscription = await stripe.subscriptions.create(subParams)
      const invoice = subscription.latest_invoice as any
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent
      clientSecret = paymentIntent.client_secret!
    }

    // ------------------------------------------------------------------
    // 5. Return to client
    // ------------------------------------------------------------------
    return NextResponse.json({
      clientSecret,
      userId,
      redirectUrl: checkoutProduct.redirectAfterSuccess,
    })
  } catch (error) {
    console.error('Create intent error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to create checkout intent', details: message }, { status: 500 })
  }
}
