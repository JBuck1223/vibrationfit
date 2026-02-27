// /src/lib/stripe/customer.ts
// Stripe customer management utilities

import { stripe } from './config'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

/**
 * Find an existing Stripe customer by email, or create one.
 * Checks Supabase first (fast), then searches Stripe by email to avoid duplicates.
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  extra?: { name?: string; phone?: string }
): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe not configured - missing STRIPE_SECRET_KEY')
  }

  const supabase = await createClient()

  const { data: existingSubscription } = await supabase
    .from('customer_subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (existingSubscription?.stripe_customer_id) {
    return existingSubscription.stripe_customer_id
  }

  return findOrCreateStripeCustomerByEmail(email, {
    ...extra,
    metadata: { supabase_user_id: userId },
  })
}

/**
 * Standalone helper: find or create a Stripe customer by email.
 * Usable from webhooks and other contexts that don't have a server Supabase client.
 */
export async function findOrCreateStripeCustomerByEmail(
  email: string,
  opts?: { name?: string; phone?: string; metadata?: Record<string, string> }
): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe not configured - missing STRIPE_SECRET_KEY')
  }

  const existing = await stripe.customers.list({ email, limit: 1 })
  if (existing.data.length > 0) {
    const cust = existing.data[0]
    const updates: Stripe.CustomerUpdateParams = {}
    if (opts?.name && !cust.name) updates.name = opts.name
    if (opts?.phone && !cust.phone) updates.phone = opts.phone
    if (opts?.metadata) {
      updates.metadata = { ...((cust.metadata as Record<string, string>) || {}), ...opts.metadata }
    }
    if (Object.keys(updates).length > 0) {
      await stripe.customers.update(cust.id, updates).catch(() => {})
    }
    return cust.id
  }

  const customer = await stripe.customers.create({
    email,
    name: opts?.name || undefined,
    phone: opts?.phone || undefined,
    metadata: opts?.metadata || {},
  })
  return customer.id
}

/**
 * Create a checkout session for a subscription
 */
export async function createCheckoutSession({
  userId,
  email,
  priceId,
  tierType,
  promoCode,
  trialDays,
  referrerId,
  successUrl,
  cancelUrl,
}: {
  userId: string
  email: string
  priceId: string
  tierType: string
  promoCode?: string
  trialDays?: number
  referrerId?: string | null
  successUrl: string
  cancelUrl: string
}) {
  if (!stripe) {
    throw new Error('Stripe not configured - missing STRIPE_SECRET_KEY')
  }

  const customerId = await getOrCreateStripeCustomer(userId, email)

  const metadata: any = {
    user_id: userId,
    tier_type: tierType,
  }

  // Add referrer if present
  if (referrerId) {
    metadata.referrer_id = referrerId
  }

  const sessionParams: any = {
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    subscription_data: {
      metadata,
    },
  }

  // Add trial period if specified
  if (trialDays && trialDays > 0) {
    sessionParams.subscription_data.trial_period_days = trialDays
  }

  // Add promo code if provided
  if (promoCode) {
    sessionParams.discounts = [
      {
        coupon: promoCode,
      },
    ]
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  return session
}

/**
 * Create a customer portal session
 */
export async function createPortalSession(customerId: string, returnUrl: string) {
  if (!stripe) {
    throw new Error('Stripe not configured - missing STRIPE_SECRET_KEY')
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}

/**
 * Cancel a subscription at period end
 */
export async function cancelSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe not configured - missing STRIPE_SECRET_KEY')
  }

  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })

  return subscription
}

/**
 * Resume a canceled subscription
 */
export async function resumeSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe not configured - missing STRIPE_SECRET_KEY')
  }

  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  })

  return subscription
}

/**
 * Create a checkout session for a one-time token pack purchase
 */
export async function createTokenPackCheckoutSession({
  userId,
  email,
  priceId,
  packId,
  tokensAmount,
  successUrl,
  cancelUrl,
}: {
  userId: string
  email: string
  priceId: string
  packId: string
  tokensAmount: number
  successUrl: string
  cancelUrl: string
}) {
  if (!stripe) {
    throw new Error('Stripe not configured - missing STRIPE_SECRET_KEY')
  }

  const customerId = await getOrCreateStripeCustomer(userId, email)

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment', // One-time payment, not subscription
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      user_id: userId,
      pack_id: packId,
      tokens_amount: tokensAmount.toString(),
      purchase_type: 'token_pack',
    },
  })

  return session
}

/**
 * Create a checkout session for a flexible one-time pack purchase
 */
export async function createFlexiblePackCheckoutSession({
  userId,
  email,
  productKey,
  packKey,
  packName,
  packDescription,
  unitAmount,
  currency,
  quantity,
  stripeProductId,
  grantAmount,
  grantUnit,
  successUrl,
  cancelUrl,
}: {
  userId: string
  email: string
  productKey: string
  packKey: string
  packName: string
  packDescription?: string | null
  unitAmount: number
  currency: string
  quantity: number
  stripeProductId?: string
  grantAmount: number
  grantUnit: string
  successUrl: string
  cancelUrl: string
}) {
  if (!stripe) {
    throw new Error('Stripe not configured - missing STRIPE_SECRET_KEY')
  }

  const customerId = await getOrCreateStripeCustomer(userId, email)

  const priceData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData = stripeProductId
    ? {
        currency,
        unit_amount: unitAmount,
        product: stripeProductId,
      }
    : {
        currency,
        unit_amount: unitAmount,
        product_data: {
          name: packName,
          description: packDescription || undefined,
        },
      }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: priceData,
        quantity,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      user_id: userId,
      purchase_type: 'flex_pack',
      product_key: productKey,
      pack_key: packKey,
      quantity: quantity.toString(),
      grant_amount: grantAmount.toString(),
      grant_unit: grantUnit,
    },
  })

  return session
}

/**
 * Create a checkout session for $499 Vision Activation Intensive
 */
export async function createIntensiveCheckoutSession({
  userId,
  email,
  priceId,
  paymentPlan,
  continuityPlan,
  successUrl,
  cancelUrl,
}: {
  userId: string | null
  email: string
  priceId: string
  paymentPlan: 'full' | '2pay' | '3pay'
  continuityPlan?: 'annual' | '28day'
  successUrl: string
  cancelUrl: string
}) {
  if (!stripe) {
    throw new Error('Stripe not configured - missing STRIPE_SECRET_KEY')
  }

  // For guest checkout, don't create customer yet - let Stripe handle it
  const sessionParams: any = {
    mode: 'payment', // One-time payment
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      user_id: userId || 'guest',
      purchase_type: 'intensive',
      payment_plan: paymentPlan,
      continuity_preference: continuityPlan || 'annual',
    },
  }

  // If user is logged in, use existing customer
  if (userId) {
    const customerId = await getOrCreateStripeCustomer(userId, email)
    sessionParams.customer = customerId
  } else {
    // Guest checkout - collect email in Stripe
    sessionParams.customer_email = email !== 'guest@example.com' ? email : undefined
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  return session
}

