import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe/config'
import { getOrCreateStripeCustomer } from '@/lib/stripe/customer'
import Stripe from 'stripe'

const OFFER_COUPON_ID = 'vision_pro_reactivation_50off'
const TRIAL_DAYS = 28

async function getOrCreateOfferCoupon(): Promise<string> {
  if (!stripe) throw new Error('Stripe not configured')

  try {
    await stripe.coupons.retrieve(OFFER_COUPON_ID)
    return OFFER_COUPON_ID
  } catch {
    await stripe.coupons.create({
      id: OFFER_COUPON_ID,
      percent_off: 50,
      duration: 'forever',
      name: 'Special Reactivation Offer - 50% Off',
    })
    return OFFER_COUPON_ID
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const supabase = await createClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const user = session?.user

    if (sessionError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body as { action: 'setup' | 'activate' }

    const customerId = await getOrCreateStripeCustomer(
      user.id,
      user.email || '',
      { name: user.user_metadata?.full_name }
    )

    if (action === 'setup') {
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        metadata: { user_id: user.id, purpose: 'reactivation_offer' },
      })

      return NextResponse.json({ clientSecret: setupIntent.client_secret })
    }

    if (action === 'activate') {
      const { data: existingSub } = await supabase
        .from('customer_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .maybeSingle()

      if (existingSub) {
        return NextResponse.json(
          { error: 'You already have an active subscription.' },
          { status: 400 }
        )
      }

      const pms = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
        limit: 1,
      })

      const paymentMethodId = pms.data[0]?.id
      if (!paymentMethodId) {
        return NextResponse.json(
          { error: 'No payment method found. Please add a card first.' },
          { status: 400 }
        )
      }

      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      })

      const couponId = await getOrCreateOfferCoupon()

      const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_28DAY
      if (!priceId) {
        return NextResponse.json({ error: 'Price not configured' }, { status: 500 })
      }

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId, quantity: 1 }],
        trial_period_days: TRIAL_DAYS,
        default_payment_method: paymentMethodId,
        coupon: couponId,
        metadata: {
          product_type: 'vision_pro_continuity',
          tier_type: 'vision_pro_28day',
          source: 'reactivation_offer',
          billing_starts_day: String(TRIAL_DAYS),
        },
      })

      const admin = createAdminClient()

      const { data: tier } = await supabase
        .from('membership_tiers')
        .select('id')
        .eq('tier_type', 'vision_pro_28day')
        .single()

      if (tier) {
        await admin.from('customer_subscriptions').insert({
          user_id: user.id,
          membership_tier_id: tier.id,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          stripe_price_id: priceId,
          status: 'trialing',
          current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
          current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
          trial_start: new Date().toISOString(),
          trial_end: new Date(Date.now() + (TRIAL_DAYS * 24 * 60 * 60 * 1000)).toISOString(),
        })

        await admin.from('user_accounts').update({
          membership_tier_id: tier.id,
        }).eq('id', user.id)
      }

      const trialEndDate = new Date(Date.now() + (TRIAL_DAYS * 24 * 60 * 60 * 1000))

      return NextResponse.json({
        success: true,
        subscriptionId: subscription.id,
        trialEnd: trialEndDate.toISOString(),
        amount: 4950,
        interval: '28 days',
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Reactivate offer error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process offer' },
      { status: 500 }
    )
  }
}
