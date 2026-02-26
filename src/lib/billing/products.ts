import { createClient as createServerClient } from '@/lib/supabase/server'
import { formatPrice, formatTokensShort } from '@/lib/billing/config'

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
  stripePriceId: string | null
  stripePriceEnvKey: string | null
  metadata: Record<string, string>
}

export type AddonPrice = {
  priceId: string
  productId: string
  addonType: 'tokens' | 'storage'
  billingInterval: '28day' | 'annual'
  unitAmount: number
  currency: string
  grantAmount: number
  grantUnit: string
  stripePriceId: string | null
  stripePriceEnvKey: string | null
}

type SupabaseClient = Awaited<ReturnType<typeof createServerClient>>

async function getSupabase(client?: SupabaseClient): Promise<SupabaseClient> {
  return client || await createServerClient()
}

/**
 * Resolve a checkout product from the database.
 * Replaces the hardcoded resolveCheckoutProduct() in checkout/products.ts.
 */
export async function resolveProduct(
  params: {
    product: string
    plan?: string
    continuity?: string
    planType?: string
    packKey?: string
  },
  supabase?: SupabaseClient,
): Promise<CheckoutProduct | null> {
  const { product, plan, continuity, planType, packKey } = params

  if (product === 'intensive') {
    return resolveIntensiveProduct(
      (plan as 'full' | '2pay' | '3pay') || 'full',
      (continuity as 'annual' | '28day') || 'annual',
      (planType as 'solo' | 'household') || 'solo',
      supabase,
    )
  }

  if (product === 'token-pack' && packKey) {
    return resolveTokenPackProduct(packKey, supabase)
  }

  return null
}

async function resolveIntensiveProduct(
  paymentPlan: 'full' | '2pay' | '3pay',
  continuityPlan: 'annual' | '28day',
  planTypeStr: 'solo' | 'household',
  supabase?: SupabaseClient,
): Promise<CheckoutProduct | null> {
  const sb = await getSupabase(supabase)
  const isSolo = planTypeStr === 'solo'
  const productKey = isSolo ? 'intensive' : 'intensive_household'

  const { data: dbProduct } = await sb
    .from('products')
    .select('id, key, name')
    .eq('key', productKey)
    .eq('is_active', true)
    .maybeSingle()

  if (!dbProduct) return null

  const { data: prices } = await sb
    .from('product_prices')
    .select('unit_amount, currency, metadata, stripe_price_id')
    .eq('product_id', dbProduct.id)
    .eq('is_active', true)

  if (!prices || prices.length === 0) return null

  const price = prices.find(
    (p: any) => p.metadata?.payment_plan === paymentPlan && p.metadata?.plan_type === planTypeStr,
  )
  if (!price) return null

  const planLabel =
    paymentPlan === 'full' ? 'One-time payment'
    : paymentPlan === '2pay' ? '2 payments'
    : '3 payments'

  const intensiveTierType = isSolo ? 'intensive_trial' : 'household_intensive'
  const { data: intensiveTier } = await sb
    .from('membership_tiers')
    .select('monthly_token_grant, annual_token_grant, storage_quota_gb, features')
    .eq('tier_type', intensiveTierType)
    .eq('is_active', true)
    .maybeSingle()
  const intensiveTokens = intensiveTier?.monthly_token_grant || intensiveTier?.annual_token_grant || 0

  const continuityTierType = continuityPlan === 'annual'
    ? (isSolo ? 'annual' : 'household_annual')
    : (isSolo ? 'monthly_28day' : 'household_28day')
  const { data: continuityTier } = await sb
    .from('membership_tiers')
    .select('features')
    .eq('tier_type', continuityTierType)
    .eq('is_active', true)
    .maybeSingle()
  const continuityFeatures = (continuityTier?.features as string[] | null) || []

  const stripePriceEnvKey = (price.metadata as any)?.stripe_price_env || null
  const stripePriceId = price.stripe_price_id || (stripePriceEnvKey ? process.env[stripePriceEnvKey] : null) || null

  return {
    key: `intensive-${planTypeStr}-${paymentPlan}`,
    name: dbProduct.name,
    description: `${isSolo ? 'Solo' : 'Household'} - ${planLabel}`,
    mode: paymentPlan === 'full' ? 'payment' : 'subscription',
    amount: price.unit_amount,
    currency: price.currency || 'usd',
    features: [
      'Full Activation Intensive experience',
      `${formatTokensShort(intensiveTokens)} VIVA tokens included`,
      `Vision Pro ${continuityPlan === 'annual' ? 'Annual' : '28-Day'} starts billing Day 56`,
      ...continuityFeatures.slice(0, 5),
    ],
    redirectAfterSuccess: '/intensive/start',
    stripePriceId,
    stripePriceEnvKey,
    metadata: {
      product_type: 'combined_intensive_continuity',
      purchase_type: 'intensive',
      intensive_payment_plan: paymentPlan,
      continuity_plan: continuityPlan,
      plan_type: planTypeStr,
      source: 'custom_checkout',
    },
  }
}

async function resolveTokenPackProduct(
  packKey: string,
  supabase?: SupabaseClient,
): Promise<CheckoutProduct | null> {
  const sb = await getSupabase(supabase)

  const { data: dbProduct } = await sb
    .from('products')
    .select('id, key, name')
    .eq('key', 'tokens')
    .eq('is_active', true)
    .maybeSingle()

  if (!dbProduct) return null

  const { data: prices } = await sb
    .from('product_prices')
    .select('unit_amount, currency, metadata, stripe_price_id')
    .eq('product_id', dbProduct.id)
    .eq('is_active', true)

  if (!prices || prices.length === 0) return null

  const price = prices.find((p: any) => p.metadata?.pack_key === packKey)
  if (!price) return null

  const meta = price.metadata as any
  const grantAmount = meta?.grant_amount || 0
  const packName = meta?.pack_name || 'Token Pack'
  const features = meta?.features || [
    `${formatTokensShort(grantAmount)} VIVA tokens`,
    'Never expires',
    'Use for any VIVA feature',
    'Stacks with existing balance',
  ]

  const stripePriceEnvKey = meta?.stripe_price_env || null
  const stripePriceId = price.stripe_price_id || (stripePriceEnvKey ? process.env[stripePriceEnvKey] : null) || null

  return {
    key: `token-pack-${packKey}`,
    name: packName,
    description: `${formatTokensShort(grantAmount)} VIVA tokens - one-time purchase`,
    mode: 'payment',
    amount: price.unit_amount,
    currency: price.currency || 'usd',
    features,
    redirectAfterSuccess: '/dashboard/tokens?purchase=success',
    stripePriceId,
    stripePriceEnvKey,
    metadata: {
      purchase_type: 'token_pack',
      pack_id: packKey,
      tokens_amount: grantAmount.toString(),
    },
  }
}

/**
 * Get an add-on price record from the database.
 * Used by add-to-subscription and charge-saved-method APIs.
 */
export async function getAddonPrice(
  addonType: 'tokens' | 'storage',
  billingInterval: '28day' | 'annual',
  supabase?: SupabaseClient,
): Promise<AddonPrice | null> {
  const sb = await getSupabase(supabase)
  const productKey = addonType === 'tokens' ? 'tokens' : 'storage'
  const addonKey = `${addonType === 'tokens' ? 'token' : 'storage'}_addon_${billingInterval}`

  const { data: dbProduct } = await sb
    .from('products')
    .select('id')
    .eq('key', productKey)
    .eq('is_active', true)
    .maybeSingle()

  if (!dbProduct) return null

  const { data: prices } = await sb
    .from('product_prices')
    .select('id, product_id, unit_amount, currency, metadata, stripe_price_id')
    .eq('product_id', dbProduct.id)
    .eq('is_active', true)

  if (!prices) return null

  const price = prices.find((p: any) => p.metadata?.addon_key === addonKey)
  if (!price) return null

  const meta = price.metadata as any
  const stripePriceEnvKey = meta?.stripe_price_env || null
  const stripePriceId = price.stripe_price_id || (stripePriceEnvKey ? process.env[stripePriceEnvKey] : null) || null

  return {
    priceId: price.id,
    productId: dbProduct.id,
    addonType,
    billingInterval,
    unitAmount: price.unit_amount,
    currency: price.currency || 'usd',
    grantAmount: meta?.grant_amount || 0,
    grantUnit: meta?.grant_unit || (addonType === 'tokens' ? 'tokens' : 'storage_gb'),
    stripePriceId,
    stripePriceEnvKey,
  }
}

/**
 * Get the unit price for an add-on from the database.
 * Convenience wrapper around getAddonPrice.
 */
export async function getAddonUnitPrice(
  addonType: 'tokens' | 'storage',
  billingInterval: '28day' | 'annual',
  supabase?: SupabaseClient,
): Promise<number> {
  const addonPrice = await getAddonPrice(addonType, billingInterval, supabase)
  return addonPrice?.unitAmount || 0
}

/**
 * Format an add-on description from DB data.
 */
export async function getAddonDescription(
  addonType: 'tokens' | 'storage',
  quantity: number,
  billingInterval: '28day' | 'annual',
  supabase?: SupabaseClient,
): Promise<string> {
  const addon = await getAddonPrice(addonType, billingInterval, supabase)
  if (!addon) return ''

  const total = formatPrice(addon.unitAmount * quantity)
  const intervalLabel = billingInterval === '28day' ? 'every 28 days' : 'per year'

  if (addonType === 'tokens') {
    return `${formatTokensShort(addon.grantAmount * quantity)} tokens ${intervalLabel} for ${total}`
  }
  return `${addon.grantAmount * quantity}GB storage ${intervalLabel} for ${total}`
}

/**
 * Resolve the Stripe price ID for an add-on. Checks DB first, then env var.
 */
export async function resolveStripePriceId(
  addonType: 'tokens' | 'storage',
  billingInterval: '28day' | 'annual',
  supabase?: SupabaseClient,
): Promise<string | undefined> {
  const addon = await getAddonPrice(addonType, billingInterval, supabase)
  return addon?.stripePriceId || undefined
}
