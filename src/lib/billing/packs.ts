import { createClient as createServerClient } from '@/lib/supabase/server'

export type PackProductKey = 'tokens' | 'storage'
export type PackGrantUnit = 'tokens' | 'storage_gb'

export type BillingPack = {
  productId: string
  productKey: PackProductKey
  productName: string
  packKey: string
  name: string
  description?: string | null
  unitAmount: number
  currency: string
  grantAmount: number
  grantUnit: PackGrantUnit
  highlights: string[]
  isPopular: boolean
  sortOrder: number
  stripePriceId?: string | null
  stripeProductId?: string | null
}

type SupabaseClient = any

const ALLOWED_PRODUCT_KEYS: PackProductKey[] = ['tokens', 'storage']

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === 'string')
  }
  return []
}

function mapPriceToPack(
  product: { id: string; key: string; name: string; metadata?: Record<string, any> },
  price: { unit_amount: number; currency: string; metadata?: Record<string, any>; stripe_price_id?: string | null }
): BillingPack | null {
  const metadata = (price.metadata || {}) as Record<string, any>
  const packKey = typeof metadata.pack_key === 'string' ? metadata.pack_key : null
  if (!packKey) {
    return null
  }

  const productKey = product.key as PackProductKey
  if (!ALLOWED_PRODUCT_KEYS.includes(productKey)) {
    return null
  }

  const grantAmountRaw =
    metadata.grant_amount ?? metadata.tokens_amount ?? metadata.storage_gb
  const grantAmount = toNumber(grantAmountRaw)
  if (!grantAmount || grantAmount <= 0) {
    return null
  }

  const grantUnit =
    (metadata.grant_unit as PackGrantUnit | undefined) ||
    (productKey === 'tokens' ? 'tokens' : 'storage_gb')

  const packName =
    (typeof metadata.pack_name === 'string' && metadata.pack_name.trim() !== '')
      ? metadata.pack_name
      : product.name

  const sortOrder = toNumber(metadata.sort_order) || 0
  const stripeProductId =
    (product.metadata?.stripe_product_id as string | undefined) || null

  return {
    productId: product.id,
    productKey,
    productName: product.name,
    packKey,
    name: packName,
    description: typeof metadata.description === 'string' ? metadata.description : null,
    unitAmount: price.unit_amount,
    currency: price.currency || 'usd',
    grantAmount,
    grantUnit,
    highlights: toStringArray(metadata.highlights),
    isPopular: metadata.is_popular === true,
    sortOrder,
    stripePriceId: price.stripe_price_id || null,
    stripeProductId,
  }
}

export async function listActivePacks(
  productKey: PackProductKey,
  supabaseClient?: SupabaseClient
): Promise<BillingPack[]> {
  const supabase = supabaseClient || await createServerClient()
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, key, name, metadata')
    .eq('key', productKey)
    .eq('is_active', true)
    .maybeSingle()

  if (productError || !product) {
    return []
  }

  const { data: prices, error: pricesError } = await supabase
    .from('product_prices')
    .select('unit_amount, currency, metadata, stripe_price_id')
    .eq('product_id', product.id)
    .eq('is_active', true)

  if (pricesError || !prices) {
    return []
  }

  return prices
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((price: any) => mapPriceToPack(product, price))
    .filter((pack: BillingPack | null): pack is BillingPack => Boolean(pack))
    .sort((a: BillingPack, b: BillingPack) => a.sortOrder - b.sortOrder)
}

export async function getActivePackByKey(
  productKey: PackProductKey,
  packKey: string,
  supabaseClient?: SupabaseClient
): Promise<BillingPack | null> {
  const packs = await listActivePacks(productKey, supabaseClient)
  const match = packs.find((pack) => pack.packKey === packKey)
  return match || null
}
