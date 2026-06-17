import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe/config'
import { getOrCreateStripeCustomer } from '@/lib/stripe/customer'
import Stripe from 'stripe'

const OFFER_COUPON_ID = 'vision_pro_reactivation_50off'

type PlanKey = '28day' | 'annual'

const PLANS: Record<PlanKey, { priceEnv: string; tierType: string }> = {
  '28day': { priceEnv: 'NEXT_PUBLIC_STRIPE_PRICE_28DAY', tierType: 'vision_pro_28day' },
  annual: { priceEnv: 'NEXT_PUBLIC_STRIPE_PRICE_ANNUAL', tierType: 'vision_pro_annual' },
}

function resolvePlan(plan?: string): { priceId?: string; tierType: string } {
  const def = PLANS[(plan as PlanKey)] ?? PLANS['28day']
  return { priceId: process.env[def.priceEnv], tierType: def.tierType }
}

// Map a Stripe price id back to our tier type so `finalize` works for either plan.
function tierTypeForPrice(priceId?: string): string {
  if (priceId && priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL) {
    return 'vision_pro_annual'
  }
  return 'vision_pro_28day'
}

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

function paymentMethodIdFrom(value: unknown): string | undefined {
  if (!value) return undefined
  return typeof value === 'string' ? value : (value as { id?: string }).id
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

    const body = await request.json().catch(() => ({})) as {
      action?: 'create' | 'finalize'
      subscriptionId?: string
      plan?: PlanKey
    }
    const { action, subscriptionId, plan } = body

    const customerId = await getOrCreateStripeCustomer(
      user.id,
      user.email || '',
      { name: user.user_metadata?.full_name }
    )

    // ========================================================================
    // CREATE: build an incomplete subscription whose first invoice is due now.
    // This produces a real PaymentIntent the customer confirms on the client.
    // With save_default_payment_method the confirmed card is attached to the
    // customer and saved as the subscription's default payment method.
    // ========================================================================
    if (action === 'create') {
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

      const { priceId, tierType } = resolvePlan(plan)
      if (!priceId) {
        return NextResponse.json({ error: 'Price not configured' }, { status: 500 })
      }

      const couponId = await getOrCreateOfferCoupon()

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId, quantity: 1 }],
        discounts: couponId ? [{ coupon: couponId }] : undefined,
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
          payment_method_types: ['card'],
        },
        // Stripe API 2025-09-30.clover removed `invoice.payment_intent`; the
        // first-payment client secret now lives on `invoice.confirmation_secret`.
        expand: ['latest_invoice.confirmation_secret'],
        metadata: {
          product_type: 'vision_pro_continuity',
          tier_type: tierType,
          source: 'reactivation_offer',
        },
      })

      const invoice = subscription.latest_invoice as Stripe.Invoice | null
      const clientSecret =
        (invoice as any)?.confirmation_secret?.client_secret ||
        ((invoice as any)?.payment_intent as Stripe.PaymentIntent | undefined)?.client_secret

      if (!clientSecret) {
        return NextResponse.json(
          { error: 'Failed to initialize payment' },
          { status: 500 }
        )
      }

      // Persist the subscription as `incomplete` up front so Stripe webhooks
      // (invoice.payment_succeeded / customer.subscription.updated) can locate
      // the row once the charge clears.
      const admin = createAdminClient()
      const { data: tier } = await supabase
        .from('membership_tiers')
        .select('id')
        .eq('tier_type', tierType)
        .single()

      if (tier) {
        await admin.from('customer_subscriptions').upsert(
          {
            user_id: user.id,
            membership_tier_id: tier.id,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            stripe_price_id: priceId,
            status: subscription.status as any,
            current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
          },
          { onConflict: 'stripe_subscription_id' }
        )
      }

      return NextResponse.json({
        clientSecret,
        subscriptionId: subscription.id,
        amount: (invoice as any)?.amount_due ?? null,
      })
    }

    // ========================================================================
    // FINALIZE: called after the client confirms the PaymentIntent.
    // Guarantees the payment method is attached to the customer + set as the
    // default for future renewals, syncs the DB row, and grants initial tokens.
    // ========================================================================
    if (action === 'finalize') {
      if (!subscriptionId) {
        return NextResponse.json({ error: 'Missing subscription' }, { status: 400 })
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        // `latest_invoice.payment_intent` was removed in 2025-09-30.clover; the
        // PaymentIntent is reachable via the invoice's payments collection.
        expand: [
          'latest_invoice.payments.data.payment.payment_intent',
          'default_payment_method',
        ],
      })

      if (subscription.customer !== customerId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const invoice = subscription.latest_invoice as Stripe.Invoice | null
      const paymentIntent = (invoice as any)?.payments?.data?.[0]?.payment
        ?.payment_intent as Stripe.PaymentIntent | undefined

      // The card that just paid — prefer the subscription default, fall back to
      // the PaymentIntent's payment method.
      const paymentMethodId =
        paymentMethodIdFrom(subscription.default_payment_method) ||
        paymentMethodIdFrom(paymentIntent?.payment_method)

      // CRITICAL: ensure the card is attached to the customer and is their
      // default for invoices, so every future renewal can be billed. This is
      // the failure mode that previously left subscriptions unbillable.
      if (paymentMethodId) {
        try {
          await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId })
        } catch {
          // Already attached (the expected case) — ignore.
        }

        await stripe.customers.update(customerId, {
          invoice_settings: { default_payment_method: paymentMethodId },
        })

        if (!subscription.default_payment_method) {
          await stripe.subscriptions
            .update(subscriptionId, { default_payment_method: paymentMethodId })
            .catch(() => {})
        }
      }

      const admin = createAdminClient()
      const priceId =
        subscription.items.data[0]?.price?.id || process.env.NEXT_PUBLIC_STRIPE_PRICE_28DAY
      const tierType = tierTypeForPrice(priceId)

      const { data: tier } = await supabase
        .from('membership_tiers')
        .select('id')
        .eq('tier_type', tierType)
        .single()

      // Upsert keeps this resilient even if the `create` row was missed.
      if (tier) {
        await admin.from('customer_subscriptions').upsert(
          {
            user_id: user.id,
            membership_tier_id: tier.id,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            stripe_price_id: priceId,
            status: subscription.status as any,
            current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
          },
          { onConflict: 'stripe_subscription_id' }
        )

        await admin
          .from('user_accounts')
          .update({ membership_tier_id: tier.id })
          .eq('id', user.id)
      }

      // Grant the initial token allotment once the first payment has cleared.
      // The first invoice has billing_reason `subscription_create`, which the
      // webhook deliberately skips, so we grant it here (guarded against dupes).
      const isPaid = subscription.status === 'active' || subscription.status === 'trialing'
      if (isPaid && priceId) {
        const { data: subRow } = await admin
          .from('customer_subscriptions')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .maybeSingle()

        if (subRow?.id) {
          const { count } = await admin
            .from('token_transactions')
            .select('*', { count: 'exact', head: true })
            .eq('subscription_id', subRow.id)
            .eq('action_type', 'subscription_grant')

          if (!count) {
            const { error: grantError } = await admin.rpc('grant_tokens_by_stripe_price_id', {
              p_user_id: user.id,
              p_stripe_price_id: priceId,
              p_subscription_id: subRow.id,
            })
            if (grantError) {
              console.error('Reactivate offer: token grant failed', grantError)
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        subscriptionId: subscription.id,
        status: subscription.status,
        nextBilling: new Date((subscription as any).current_period_end * 1000).toISOString(),
        amountPaid: (invoice as any)?.amount_paid ?? null,
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
