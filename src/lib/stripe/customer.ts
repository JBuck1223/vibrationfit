// /src/lib/stripe/customer.ts
// Stripe customer management utilities

import { stripe } from './config'
import { createClient } from '@/lib/supabase/server'

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe not configured - missing STRIPE_SECRET_KEY')
  }

  const supabase = await createClient()
  
  // Check if user already has a subscription with a customer ID
  const { data: existingSubscription } = await supabase
    .from('customer_subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single()

  if (existingSubscription?.stripe_customer_id) {
    return existingSubscription.stripe_customer_id
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      supabase_user_id: userId,
    },
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

