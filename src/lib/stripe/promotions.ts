// /src/lib/stripe/promotions.ts
// Coupon and promotion management

import { stripe } from './config'

/**
 * Create a coupon in Stripe
 */
export async function createCoupon({
  code,
  percentOff,
  amountOff,
  duration,
  durationInMonths,
  maxRedemptions,
}: {
  code: string
  percentOff?: number // e.g., 20 for 20% off
  amountOff?: number // in cents, e.g., 1000 for $10 off
  duration: 'forever' | 'once' | 'repeating'
  durationInMonths?: number // Required if duration is 'repeating'
  maxRedemptions?: number
}) {
  if (!stripe) {
    throw new Error('Stripe not configured - missing STRIPE_SECRET_KEY')
  }

  const coupon = await stripe.coupons.create({
    id: code,
    percent_off: percentOff,
    amount_off: amountOff,
    currency: amountOff ? 'usd' : undefined,
    duration,
    duration_in_months: durationInMonths,
    max_redemptions: maxRedemptions,
  })

  return coupon
}

/**
 * Validate and retrieve a coupon
 */
export async function validateCoupon(code: string) {
  if (!stripe) {
    throw new Error('Stripe not configured - missing STRIPE_SECRET_KEY')
  }

  try {
    const coupon = await stripe.coupons.retrieve(code)
    
    if (!coupon.valid) {
      return { valid: false, error: 'Coupon is no longer valid' }
    }

    if (coupon.max_redemptions && coupon.times_redeemed >= coupon.max_redemptions) {
      return { valid: false, error: 'Coupon has been fully redeemed' }
    }

    return { 
      valid: true, 
      coupon,
      discount: coupon.percent_off 
        ? `${coupon.percent_off}% off`
        : `$${(coupon.amount_off! / 100).toFixed(2)} off`
    }
  } catch (error) {
    return { valid: false, error: 'Invalid coupon code' }
  }
}

/**
 * Apply a promotion code to a checkout session
 */
export async function createCheckoutWithPromo({
  userId,
  email,
  priceId,
  tierType,
  promoCode,
  trialDays,
  successUrl,
  cancelUrl,
}: {
  userId: string
  email: string
  priceId: string
  tierType: string
  promoCode?: string
  trialDays?: number
  successUrl: string
  cancelUrl: string
}) {
  if (!stripe) {
    throw new Error('Stripe not configured - missing STRIPE_SECRET_KEY')
  }

  const { getOrCreateStripeCustomer } = await import('./customer')
  const customerId = await getOrCreateStripeCustomer(userId, email)

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
    metadata: {
      user_id: userId,
      tier_type: tierType,
    },
    subscription_data: {
      metadata: {
        user_id: userId,
        tier_type: tierType,
      },
    },
  }

  // Add trial period if specified
  if (trialDays && trialDays > 0) {
    sessionParams.subscription_data.trial_period_days = trialDays
  }

  // Add promo code if provided
  if (promoCode) {
    // Validate the promo code first
    const validation = await validateCoupon(promoCode)
    
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid promo code')
    }

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
 * Create a promotion code (customer-facing code that applies a coupon)
 */
export async function createPromotionCode({
  couponId,
  code,
  maxRedemptions,
  expiresAt,
}: {
  couponId: string
  code: string
  maxRedemptions?: number
  expiresAt?: Date
}) {
  if (!stripe) {
    throw new Error('Stripe not configured - missing STRIPE_SECRET_KEY')
  }

  const promotionCode = await stripe.promotionCodes.create({
    coupon: couponId,
    code,
    max_redemptions: maxRedemptions,
    expires_at: expiresAt ? Math.floor(expiresAt.getTime() / 1000) : undefined,
  } as any)

  return promotionCode
}

// ============================================================================
// PREDEFINED PROMOTIONS
// ============================================================================

export const COMMON_PROMOTIONS = {
  // Launch promotions
  LAUNCH50: {
    percentOff: 50,
    duration: 'once' as const,
    description: '50% off first month',
  },
  LAUNCH25: {
    percentOff: 25,
    duration: 'repeating' as const,
    durationInMonths: 3,
    description: '25% off for 3 months',
  },

  // Referral promotions
  REFER20: {
    percentOff: 20,
    duration: 'forever' as const,
    description: '20% off forever (referral reward)',
  },

  // Seasonal promotions
  NEWYEAR2025: {
    percentOff: 30,
    duration: 'once' as const,
    description: '30% off first month (New Year)',
  },

  // VIP promotions
  VIP50: {
    percentOff: 50,
    duration: 'forever' as const,
    description: '50% off forever (VIP)',
    maxRedemptions: 10,
  },
}

/**
 * Helper to create all predefined promotions
 */
export async function seedPromotions() {
  if (!stripe) {
    throw new Error('Stripe not configured - missing STRIPE_SECRET_KEY')
  }

  const results = []

  for (const [code, config] of Object.entries(COMMON_PROMOTIONS)) {
    try {
      const coupon = await createCoupon({
        code: code.toLowerCase(),
        percentOff: config.percentOff,
        duration: config.duration,
        durationInMonths: (config as any).durationInMonths,
        maxRedemptions: (config as any).maxRedemptions,
      })
      
      results.push({ code, success: true, coupon })
    } catch (error: any) {
      if (error.code === 'resource_already_exists') {
        results.push({ code, success: true, message: 'Already exists' })
      } else {
        results.push({ code, success: false, error: error.message })
      }
    }
  }

  return results
}

