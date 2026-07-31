import { formatPrice, formatTokensShort } from '@/lib/billing/config'
import { TIER_TYPES, type MembershipTier } from '@/hooks/useMembershipTiers'

export type CheckoutMode = 'payment' | 'subscription'

export type CheckoutProduct = {
  key: string
  name: string
  description: string
  mode: CheckoutMode
  amount: number
  currency: string
  features: string[]
  redirectAfterSuccess: string
  getPriceEnvKey: () => string | undefined
  metadata: Record<string, string>
}

function tierLookup(tiers: MembershipTier[] | undefined, tierType: string) {
  return tiers?.find(t => t.tier_type === tierType)
}

function getIntensiveProduct(
  paymentPlan: 'full' | '2pay',
  continuityPlan: 'annual' | '28day',
  planType: 'solo' | 'household',
  tiers?: MembershipTier[],
  isPremium?: boolean,
): CheckoutProduct {
  const isSolo = planType === 'solo'

  // Repriced Jul 2026: $97 solo / $147 household, single payment only
  // (2-pay and 3-pay installment plans retired).
  const priceMap: Record<string, { amount: number; envKey: string }> = {
    'solo-full': { amount: 9700, envKey: 'STRIPE_PRICE_INTENSIVE_FULL' },
    'household-full': { amount: 14700, envKey: 'STRIPE_PRICE_HOUSEHOLD_INTENSIVE_FULL' },
    'premium-solo-full': { amount: 300000, envKey: 'STRIPE_PRICE_PREMIUM_INTENSIVE_FULL' },
    'premium-household-full': { amount: 420000, envKey: 'STRIPE_PRICE_PREMIUM_HOUSEHOLD_INTENSIVE_FULL' },
  }

  const intensiveTierType = isPremium ? 'intensive_premium' : TIER_TYPES.INTENSIVE
  const intensiveTier = tierLookup(tiers, intensiveTierType)
  const intensiveTokens = intensiveTier
    ? (intensiveTier.monthly_token_grant || intensiveTier.annual_token_grant)
    : 0

  const continuityTierType = continuityPlan === 'annual'
    ? (isSolo ? TIER_TYPES.ANNUAL : TIER_TYPES.HOUSEHOLD_ANNUAL)
    : (isSolo ? TIER_TYPES.MONTHLY_28DAY : TIER_TYPES.HOUSEHOLD_28DAY)
  const continuityTier = tierLookup(tiers, continuityTierType)
  const continuityFeatures = (continuityTier?.features as string[] | undefined) || []

  // All plans normalize to full pay (retired 2-pay/3-pay links included).
  const priceKey = isPremium ? `premium-${planType}-full` : `${planType}-full`
  const { amount, envKey } = priceMap[priceKey]

  const effectivePaymentPlan = 'full'
  const planLabel = 'One-time payment'

  const productName = isPremium ? 'Premium Activation Intensive' : 'Vision Activation Intensive'
  const productKey = isPremium ? 'intensive_premium' : 'intensive'

  return {
    key: `${isPremium ? 'premium-' : ''}intensive-${planType}-${effectivePaymentPlan}`,
    name: productName,
    description: `${isSolo ? 'Solo' : 'Household'} - ${planLabel}`,
    mode: effectivePaymentPlan === 'full' ? 'payment' : 'subscription',
    amount,
    currency: 'usd',
    features: isPremium
      ? [
          '1:1 or small-group deep dive',
          'Custom vibration / practice plan',
          'Priority or private support',
          intensiveTokens > 0
            ? `${formatTokensShort(intensiveTokens)} VIVA tokens included`
            : 'VIVA tokens included',
          `First month included — Vision Pro Monthly billing starts Day 30`,
          ...continuityFeatures.slice(0, 3),
        ]
      : [
          'Self-paced activation intensive',
          'Group Q&A / community',
          intensiveTokens > 0
            ? `${formatTokensShort(intensiveTokens)} VIVA tokens included`
            : 'VIVA tokens included',
          `First month included — Vision Pro ${continuityPlan === 'annual' ? 'Annual' : 'Monthly'} billing starts Day 30`,
          ...continuityFeatures.slice(0, 5),
        ],
    redirectAfterSuccess: '/intensive/dashboard',
    getPriceEnvKey: () => process.env[envKey],
    metadata: {
      product_type: 'combined_intensive_continuity',
      purchase_type: 'intensive',
      intensive_payment_plan: effectivePaymentPlan,
      continuity_plan: continuityPlan,
      plan_type: planType,
      source: 'custom_checkout',
      ...(isPremium ? { intensive_level: 'premium' } : {}),
    },
  }
}

export type TokenPackKey = 'power' | 'mega' | 'ultra'

const TOKEN_PACKS: Record<TokenPackKey, { name: string; tokens: number; amount: number; envKey: string }> = {
  power: { name: 'Power Pack', tokens: 2_000_000, amount: 9900, envKey: 'STRIPE_PRICE_TOKEN_POWER' },
  mega: { name: 'Mega Pack', tokens: 5_000_000, amount: 19900, envKey: 'STRIPE_PRICE_TOKEN_MEGA' },
  ultra: { name: 'Ultra Pack', tokens: 12_000_000, amount: 39900, envKey: 'STRIPE_PRICE_TOKEN_ULTRA' },
}

function getTokenPackProduct(packKey: TokenPackKey): CheckoutProduct {
  const pack = TOKEN_PACKS[packKey]
  return {
    key: `token-pack-${packKey}`,
    name: pack.name,
    description: `${formatTokensShort(pack.tokens)} VIVA tokens - one-time purchase`,
    mode: 'payment',
    amount: pack.amount,
    currency: 'usd',
    features: [
      `${formatTokensShort(pack.tokens)} VIVA tokens`,
      'Never expires',
      'Use for any VIVA feature',
      'Stacks with existing balance',
    ],
    redirectAfterSuccess: '/tokens?purchase=success',
    getPriceEnvKey: () => process.env[pack.envKey],
    metadata: {
      purchase_type: 'token_pack',
      pack_id: packKey,
      tokens_amount: pack.tokens.toString(),
    },
  }
}

export const ADDON_PRICING = {
  TOKEN_28DAY: 2900,
  TOKEN_ANNUAL: 29000,
  STORAGE_28DAY: 900,
  STORAGE_ANNUAL: 9000,

  TOKEN_GRANT_PER_UNIT: 1_000_000,
  STORAGE_GRANT_PER_UNIT: 100,
} as const

export function resolveCheckoutProduct(
  params: {
    product: string
    plan?: string
    continuity?: string
    planType?: string
    packKey?: string
  },
  tiers?: MembershipTier[],
): CheckoutProduct | null {
  const { product, plan, continuity, planType, packKey } = params

  if (product === 'intensive' || product === 'intensive_premium') {
    // Installment plans retired: any stale 2-pay/3-pay link resolves to full pay.
    return getIntensiveProduct(
      'full',
      (continuity as 'annual' | '28day') || '28day',
      (planType as 'solo' | 'household') || 'solo',
      tiers,
      product === 'intensive_premium',
    )
  }

  if (product === 'token-pack' && packKey) {
    return getTokenPackProduct(packKey as TokenPackKey)
  }

  return null
}

// '28day' = legacy day/28 subscriptions (pre-Jul-2026); 'month' = calendar-month subscriptions
export type AddonInterval = '28day' | 'month' | 'annual'

export function getAddonPriceEnvKey(
  addonType: 'tokens' | 'storage',
  interval: AddonInterval,
): string {
  const map: Record<string, string> = {
    'tokens-28day': 'STRIPE_PRICE_TOKEN_ADDON_28DAY',
    'tokens-month': 'STRIPE_PRICE_TOKEN_ADDON_MONTH',
    'tokens-annual': 'STRIPE_PRICE_TOKEN_ADDON_ANNUAL',
    'storage-28day': 'STRIPE_PRICE_STORAGE_ADDON_28DAY',
    'storage-month': 'STRIPE_PRICE_STORAGE_ADDON_MONTH',
    'storage-annual': 'STRIPE_PRICE_STORAGE_ADDON_ANNUAL',
  }
  return map[`${addonType}-${interval}`]
}

export function getAddonPriceId(
  addonType: 'tokens' | 'storage',
  interval: AddonInterval,
): string | undefined {
  const envKey = getAddonPriceEnvKey(addonType, interval)
  return process.env[envKey]
}

export function getAddonUnitPrice(
  addonType: 'tokens' | 'storage',
  interval: AddonInterval,
): number {
  if (addonType === 'tokens') {
    return interval === 'annual' ? ADDON_PRICING.TOKEN_ANNUAL : ADDON_PRICING.TOKEN_28DAY
  }
  return interval === 'annual' ? ADDON_PRICING.STORAGE_ANNUAL : ADDON_PRICING.STORAGE_28DAY
}

export function getAddonDescription(
  addonType: 'tokens' | 'storage',
  quantity: number,
  interval: AddonInterval,
): string {
  const unitPrice = getAddonUnitPrice(addonType, interval)
  const total = formatPrice(unitPrice * quantity)
  const intervalLabel = interval === '28day' ? 'every 28 days' : interval === 'month' ? 'per month' : 'per year'

  if (addonType === 'tokens') {
    return `${formatTokensShort(ADDON_PRICING.TOKEN_GRANT_PER_UNIT * quantity)} tokens ${intervalLabel} for ${total}`
  }
  return `${ADDON_PRICING.STORAGE_GRANT_PER_UNIT * quantity}GB storage ${intervalLabel} for ${total}`
}
