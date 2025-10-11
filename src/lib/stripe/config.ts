// /src/lib/stripe/config.ts
// Stripe configuration and initialization

import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
})

export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  
  // Pricing (should match your Stripe dashboard)
  prices: {
    starter_monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY,
    starter_yearly: process.env.STRIPE_PRICE_STARTER_YEARLY,
    pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
    elite_monthly: process.env.STRIPE_PRICE_ELITE_MONTHLY,
    elite_yearly: process.env.STRIPE_PRICE_ELITE_YEARLY,
  },
  
  // Success/Cancel URLs
  successUrl: process.env.NEXT_PUBLIC_APP_URL + '/billing/success',
  cancelUrl: process.env.NEXT_PUBLIC_APP_URL + '/pricing',
}

// Membership tier configuration
export const MEMBERSHIP_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    interval: 'forever' as const,
    features: [
      'Basic profile',
      '1 life vision',
      'Manual vision creation',
      'Community access'
    ],
    vivaTokens: 100,
    maxVisions: 1,
  },
  starter: {
    name: 'Starter',
    priceMonthly: 19,
    priceYearly: 199,
    interval: 'month' as const,
    features: [
      'Everything in Free',
      'Unlimited visions',
      'VIVA assistant (500 tokens/month)',
      'Assessment tool',
      'Journal entries',
      'Vision board',
      'Email support'
    ],
    vivaTokens: 500,
    maxVisions: null, // unlimited
    isPopular: true,
  },
  pro: {
    name: 'Pro',
    priceMonthly: 49,
    priceYearly: 499,
    interval: 'month' as const,
    features: [
      'Everything in Starter',
      'VIVA assistant (2000 tokens/month)',
      'Audio generation',
      'Priority support',
      'Advanced analytics',
      'Export to PDF',
      'Custom branding'
    ],
    vivaTokens: 2000,
    maxVisions: null,
  },
  elite: {
    name: 'Elite',
    priceMonthly: 99,
    priceYearly: 999,
    interval: 'month' as const,
    features: [
      'Everything in Pro',
      'Unlimited VIVA tokens',
      '1-on-1 coaching sessions (2/month)',
      'White-label option',
      'API access',
      'Custom integrations',
      'Dedicated support'
    ],
    vivaTokens: 999999,
    maxVisions: null,
  },
} as const

export type MembershipTier = keyof typeof MEMBERSHIP_TIERS

