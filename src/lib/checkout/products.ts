import { formatPrice, formatTokensShort } from '@/lib/billing/config'
import type { MembershipTier } from '@/hooks/useMembershipTiers'

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
  paymentPlan: 'full' | '2pay' | '3pay',
  continuityPlan: 'annual' | '28day',
  planType: 'solo' | 'household',
  tiers?: MembershipTier[],
): CheckoutProduct {
  const isSolo = planType === 'solo'

  const priceMap: Record<string, { envKey: string }> = {
    'solo-full': { envKey: 'STRIPE_PRICE_INTENSIVE_FULL' },
    'solo-2pay': { envKey: 'STRIPE_PRICE_INTENSIVE_2PAY' },
    'solo-3pay': { envKey: 'STRIPE_PRICE_INTENSIVE_3PAY' },
    'household-full': { envKey: 'STRIPE_PRICE_HOUSEHOLD_INTENSIVE_FULL' },
    'household-2pay': { envKey: 'STRIPE_PRICE_HOUSEHOLD_INTENSIVE_2PAY' },
    'household-3pay': { envKey: 'STRIPE_PRICE_HOUSEHOLD_INTENSIVE_3PAY' },
  }

  const intensiveTier = tierLookup(tiers, isSolo ? 'intensive_trial' : 'household_intensive')
  const intensiveTokens = intensiveTier
    ? (intensiveTier.monthly_token_grant || intensiveTier.annual_token_grant)
    : 0
  const intensivePrice = intensiveTier?.price_monthly ?? 0
  const perInstallment = paymentPlan === '2pay' ? Math.round(intensivePrice / 2)
    : paymentPlan === '3pay' ? Math.round(intensivePrice / 3)
    : intensivePrice

  const continuityTierType = continuityPlan === 'annual'
    ? (isSolo ? 'annual' : 'household_annual')
    : (isSolo ? 'monthly_28day' : 'household_28day')
  const continuityTier = tierLookup(tiers, continuityTierType)
  const continuityFeatures = (continuityTier?.features as string[] | undefined) || []

  const priceKey = `${planType}-${paymentPlan}`
  const { envKey } = priceMap[priceKey]

  const planLabel = paymentPlan === 'full'
    ? 'One-time payment'
    : paymentPlan === '2pay'
      ? '2 payments'
      : '3 payments'

  return {
    key: `intensive-${planType}-${paymentPlan}`,
    name: 'Vision Activation Intensive',
    description: `${isSolo ? 'Solo' : 'Household'} - ${planLabel}`,
    mode: paymentPlan === 'full' ? 'payment' : 'subscription',
    amount: perInstallment,
    currency: 'usd',
    features: [
      'Full Activation Intensive experience',
      intensiveTokens > 0
        ? `${formatTokensShort(intensiveTokens)} VIVA tokens included`
        : 'VIVA tokens included',
      `Vision Pro ${continuityPlan === 'annual' ? 'Annual' : '28-Day'} starts billing Day 56`,
      ...continuityFeatures.slice(0, 5),
    ],
    redirectAfterSuccess: '/intensive/dashboard',
    getPriceEnvKey: () => process.env[envKey],
    metadata: {
      product_type: 'combined_intensive_continuity',
      purchase_type: 'intensive',
      intensive_payment_plan: paymentPlan,
      continuity_plan: continuityPlan,
      plan_type: planType,
      source: 'custom_checkout',
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
    redirectAfterSuccess: '/dashboard/tokens?purchase=success',
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

  if (product === 'intensive') {
    return getIntensiveProduct(
      (plan as 'full' | '2pay' | '3pay') || 'full',
      (continuity as 'annual' | '28day') || 'annual',
      (planType as 'solo' | 'household') || 'solo',
      tiers,
    )
  }

  if (product === 'token-pack' && packKey) {
    return getTokenPackProduct(packKey as TokenPackKey)
  }

  return null
}

export function getAddonPriceEnvKey(
  addonType: 'tokens' | 'storage',
  interval: '28day' | 'annual',
): string {
  const map: Record<string, string> = {
    'tokens-28day': 'STRIPE_PRICE_TOKEN_ADDON_28DAY',
    'tokens-annual': 'STRIPE_PRICE_TOKEN_ADDON_ANNUAL',
    'storage-28day': 'STRIPE_PRICE_STORAGE_ADDON_28DAY',
    'storage-annual': 'STRIPE_PRICE_STORAGE_ADDON_ANNUAL',
  }
  return map[`${addonType}-${interval}`]
}

export function getAddonPriceId(
  addonType: 'tokens' | 'storage',
  interval: '28day' | 'annual',
): string | undefined {
  const envKey = getAddonPriceEnvKey(addonType, interval)
  return process.env[envKey]
}

export function getAddonUnitPrice(
  addonType: 'tokens' | 'storage',
  interval: '28day' | 'annual',
): number {
  if (addonType === 'tokens') {
    return interval === '28day' ? ADDON_PRICING.TOKEN_28DAY : ADDON_PRICING.TOKEN_ANNUAL
  }
  return interval === '28day' ? ADDON_PRICING.STORAGE_28DAY : ADDON_PRICING.STORAGE_ANNUAL
}

export function getAddonDescription(
  addonType: 'tokens' | 'storage',
  quantity: number,
  interval: '28day' | 'annual',
): string {
  const unitPrice = getAddonUnitPrice(addonType, interval)
  const total = formatPrice(unitPrice * quantity)
  const intervalLabel = interval === '28day' ? 'every 28 days' : 'per year'

  if (addonType === 'tokens') {
    return `${formatTokensShort(ADDON_PRICING.TOKEN_GRANT_PER_UNIT * quantity)} tokens ${intervalLabel} for ${total}`
  }
  return `${ADDON_PRICING.STORAGE_GRANT_PER_UNIT * quantity}GB storage ${intervalLabel} for ${total}`
}
