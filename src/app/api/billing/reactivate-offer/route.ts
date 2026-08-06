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

// Stripe API 2025-03-31.basil moved `current_period_start`/`current_period_end`
// off the Subscription object and onto each subscription item. Read from the
// item first, fall back to the (now-legacy) top-level field, then to null.
function billingPeriod(subscription: Stripe.Subscription): {
  start: string | null
  end: string | null
} {
  const item = subscription.items?.data?.[0] as any
  const sub = subscription as any
  const startUnix = item?.current_period_start ?? sub.current_period_start
  const endUnix = item?.current_period_end ?? sub.current_period_end
  const toIso = (unix: unknown): string | null => {
    const n = Number(unix)
    return Number.isFinite(n) && n > 0 ? new Date(n * 1000).toISOString() : null
  }
  return { start: toIso(startUnix), end: toIso(endUnix) }
}

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const supabase = await createClient()
    // Use getUser() (not getSession()): it validates with the Supabase Auth
    // server and refreshes an expired access token. getSession() returns null
    // for long-standing members whose access token has lapsed, which surfaced
    // as a spurious "Unauthorized" when they tried to claim the offer.
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({})) as {
      action?: 'create' | 'finalize' | 'log_error'
      subscriptionId?: string
      plan?: PlanKey
      detail?: Record<string, unknown>
    }
    const { action, subscriptionId, plan } = body

    // Capture client-side payment failures (especially mobile 3-D Secure
    // breakage) so they surface in the server logs. Fire-and-forget from the
    // client; never touches Stripe so it can't itself fail.
    if (action === 'log_error') {
      console.error('[reactivate-offer] client payment failure', {
        userId: user.id,
        email: user.email,
        subscriptionId,
        plan,
        userAgent: request.headers.get('user-agent') ?? undefined,
        ...body.detail,
      })
      return NextResponse.json({ ok: true })
    }

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
      // Only block if the member has a subscription that is GENUINELY active in
      // Stripe. Our DB rows can go stale (e.g. trials that lapsed when no card
      // was attached still show `trialing` here), so we verify against Stripe
      // and self-heal the stale row instead of trusting it blindly.
      const { data: existingSubs } = await supabase
        .from('customer_subscriptions')
        .select('id, stripe_subscription_id')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])

      const reconcile = createAdminClient()
      let hasLiveSubscription = false

      for (const row of existingSubs ?? []) {
        if (!row.stripe_subscription_id) {
          hasLiveSubscription = true
          continue
        }
        try {
          const liveSub = await stripe.subscriptions.retrieve(row.stripe_subscription_id)
          if (liveSub.status === 'active' || liveSub.status === 'trialing') {
            hasLiveSubscription = true
          } else {
            await reconcile
              .from('customer_subscriptions')
              .update({ status: liveSub.status as any })
              .eq('id', row.id)
          }
        } catch {
          // Subscription no longer exists in Stripe — mark it canceled so it
          // never blocks the offer again.
          await reconcile
            .from('customer_subscriptions')
            .update({ status: 'canceled' as any })
            .eq('id', row.id)
        }
      }

      if (hasLiveSubscription) {
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
        const period = billingPeriod(subscription)
        await admin.from('customer_subscriptions').upsert(
          {
            user_id: user.id,
            membership_tier_id: tier.id,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            stripe_price_id: priceId,
            status: subscription.status as any,
            current_period_start: period.start,
            current_period_end: period.end,
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
        // Stripe caps `expand` at 4 levels, so we can't reach the PaymentIntent
        // through the invoice's payments collection here. `default_payment_method`
        // is set automatically once the first invoice is paid (we use
        // save_default_payment_method: 'on_subscription'); fall back to the
        // invoice's PaymentIntent id and retrieve it separately if needed.
        expand: ['default_payment_method', 'latest_invoice.payments'],
      })

      if (subscription.customer !== customerId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const invoice = subscription.latest_invoice as Stripe.Invoice | null

      // The card that just paid — prefer the subscription default. If it isn't
      // populated yet, resolve it from the first invoice payment's PaymentIntent.
      let paymentMethodId = paymentMethodIdFrom(subscription.default_payment_method)
      if (!paymentMethodId) {
        const paymentIntentRef = (invoice as any)?.payments?.data?.[0]?.payment?.payment_intent
        const paymentIntentId = paymentMethodIdFrom(paymentIntentRef)
        if (paymentIntentId) {
          const pi = await stripe.paymentIntents.retrieve(paymentIntentId)
          paymentMethodId = paymentMethodIdFrom(pi.payment_method)
        }
      }

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
            current_period_start: billingPeriod(subscription).start,
            current_period_end: billingPeriod(subscription).end,
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
        nextBilling: billingPeriod(subscription).end,
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
