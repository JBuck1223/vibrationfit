// /src/lib/stripe/config.ts
// Stripe configuration and initialization

import Stripe from 'stripe'

// Create Stripe instance only if secret key is available
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
      typescript: true,
    })
  : null

export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  
  // HORMOZI PRICING MODEL
  prices: {
    // $499 Vision Activation Intensive (mandatory entry)
    intensive_full: process.env.STRIPE_PRICE_INTENSIVE_FULL, // $499 one-time
    intensive_2pay: process.env.STRIPE_PRICE_INTENSIVE_2PAY, // $249.50 × 2
    intensive_3pay: process.env.STRIPE_PRICE_INTENSIVE_3PAY, // $166.33 × 3
    
    // Vision Pro Annual (default continuity)
    annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL, // $999/year (5M tokens upfront)
    
    // Vision Pro 28-Day (downsell continuity)
    monthly_28day: process.env.NEXT_PUBLIC_STRIPE_PRICE_28DAY, // $99 every 28 days (375k tokens/cycle)
    
    // Token Packs (existing)
    token_power: process.env.STRIPE_PRICE_TOKEN_POWER, // 2M - $99
    token_mega: process.env.STRIPE_PRICE_TOKEN_MEGA, // 5M - $199
    token_ultra: process.env.STRIPE_PRICE_TOKEN_ULTRA, // 12M - $399
    
    // Token Subscription Add-on ($29/1M per cycle)
    token_addon_28day: process.env.STRIPE_PRICE_TOKEN_ADDON_28DAY,
    token_addon_annual: process.env.STRIPE_PRICE_TOKEN_ADDON_ANNUAL,
    
    // Storage Subscription Add-on ($9/100GB per cycle)
    storage_addon_28day: process.env.STRIPE_PRICE_STORAGE_ADDON_28DAY,
    storage_addon_annual: process.env.STRIPE_PRICE_STORAGE_ADDON_ANNUAL,
  },
  
  // Success/Cancel URLs
  successUrl: process.env.NEXT_PUBLIC_APP_URL + '/billing/success',
  cancelUrl: process.env.NEXT_PUBLIC_APP_URL + '/#pricing',
  intensiveSuccessUrl: process.env.NEXT_PUBLIC_APP_URL + '/intensive/dashboard',
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

