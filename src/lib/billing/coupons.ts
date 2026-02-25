import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import crypto from 'crypto'

type SupabaseClient = Awaited<ReturnType<typeof createServerClient>>

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export type CouponRow = {
  id: string
  name: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  currency: string
  min_purchase_amount: number | null
  max_discount_amount: number | null
  eligible_products: string[] | null
  eligible_tiers: string[] | null
  max_redemptions: number | null
  max_redemptions_per_user: number
  valid_from: string | null
  valid_until: string | null
  is_active: boolean
  campaign_id: string | null
  metadata: Record<string, any>
}

export type CouponCodeRow = {
  id: string
  coupon_id: string
  code: string
  batch_id: string | null
  max_redemptions: number | null
  redemption_count: number
  is_active: boolean
}

export type ValidationContext = {
  userId?: string
  productKey?: string
  purchaseAmount?: number
  tierType?: string
}

export type ValidationResult = {
  valid: boolean
  coupon?: CouponRow
  codeRow?: CouponCodeRow
  discountAmount?: number
  discountType?: 'percent' | 'fixed'
  discountValue?: number
  name?: string
  error?: string
}

/**
 * Validate a coupon code against database rules.
 */
export async function validateCouponCode(
  code: string,
  context: ValidationContext = {},
  supabase?: SupabaseClient,
): Promise<ValidationResult> {
  const sb = supabase || await createServerClient()
  const upperCode = code.trim().toUpperCase()

  // 1. Find the code
  const { data: codeRow } = await sb
    .from('coupon_codes')
    .select('*')
    .eq('code', upperCode)
    .eq('is_active', true)
    .maybeSingle()

  if (!codeRow) {
    return { valid: false, error: 'Invalid promo code' }
  }

  // 2. Find the parent coupon
  const { data: coupon } = await sb
    .from('coupons')
    .select('*')
    .eq('id', codeRow.coupon_id)
    .eq('is_active', true)
    .maybeSingle()

  if (!coupon) {
    return { valid: false, error: 'This promotion is no longer available' }
  }

  const now = new Date()

  // 3. Date range check
  if (coupon.valid_from && new Date(coupon.valid_from) > now) {
    return { valid: false, error: 'This promotion has not started yet' }
  }
  if (coupon.valid_until && new Date(coupon.valid_until) < now) {
    return { valid: false, error: 'This promotion has expired' }
  }

  // 4. Global redemption limit (coupon-level)
  if (coupon.max_redemptions !== null) {
    const { count } = await sb
      .from('coupon_redemptions')
      .select('id', { count: 'exact', head: true })
      .eq('coupon_id', coupon.id)

    if ((count || 0) >= coupon.max_redemptions) {
      return { valid: false, error: 'This promotion has been fully redeemed' }
    }
  }

  // 5. Per-code redemption limit
  const codeLimit = codeRow.max_redemptions ?? coupon.max_redemptions
  if (codeLimit !== null && codeRow.redemption_count >= codeLimit) {
    return { valid: false, error: 'This code has been fully redeemed' }
  }

  // 6. Per-user redemption limit
  if (context.userId && coupon.max_redemptions_per_user > 0) {
    const { count } = await sb
      .from('coupon_redemptions')
      .select('id', { count: 'exact', head: true })
      .eq('coupon_id', coupon.id)
      .eq('user_id', context.userId)

    if ((count || 0) >= coupon.max_redemptions_per_user) {
      return { valid: false, error: 'You have already used this promotion' }
    }
  }

  // 7. Product eligibility
  if (coupon.eligible_products && coupon.eligible_products.length > 0 && context.productKey) {
    if (!coupon.eligible_products.includes(context.productKey)) {
      return { valid: false, error: 'This code is not valid for this product' }
    }
  }

  // 8. Tier eligibility
  if (coupon.eligible_tiers && coupon.eligible_tiers.length > 0 && context.tierType) {
    if (!coupon.eligible_tiers.includes(context.tierType)) {
      return { valid: false, error: 'This code is not valid for your plan' }
    }
  }

  // 9. Min purchase amount
  if (coupon.min_purchase_amount !== null && context.purchaseAmount !== undefined) {
    if (context.purchaseAmount < coupon.min_purchase_amount) {
      return { valid: false, error: `Minimum purchase of $${(coupon.min_purchase_amount / 100).toFixed(2)} required` }
    }
  }

  // Calculate discount amount for preview
  const discountAmount = context.purchaseAmount
    ? calculateDiscount(coupon, context.purchaseAmount)
    : undefined

  return {
    valid: true,
    coupon,
    codeRow,
    discountAmount,
    discountType: coupon.discount_type,
    discountValue: coupon.discount_value,
    name: coupon.name,
  }
}

/**
 * Calculate the discount amount in cents.
 */
export function calculateDiscount(coupon: CouponRow, purchaseAmount: number): number {
  let discount: number

  if (coupon.discount_type === 'percent') {
    discount = Math.round(purchaseAmount * coupon.discount_value / 100)
  } else {
    discount = coupon.discount_value
  }

  if (coupon.max_discount_amount !== null) {
    discount = Math.min(discount, coupon.max_discount_amount)
  }

  return Math.min(discount, purchaseAmount)
}

/**
 * Record a coupon redemption and increment the code's redemption count.
 * Uses the service role client to bypass RLS.
 */
export async function recordRedemption(params: {
  couponId: string
  couponCodeId: string
  userId: string
  discountAmount: number
  originalAmount: number
  productKey?: string
  orderId?: string
  subscriptionId?: string
}): Promise<void> {
  const admin = getServiceClient()

  await admin.from('coupon_redemptions').insert({
    coupon_id: params.couponId,
    coupon_code_id: params.couponCodeId,
    user_id: params.userId,
    discount_amount: params.discountAmount,
    original_amount: params.originalAmount,
    product_key: params.productKey || null,
    order_id: params.orderId || null,
    subscription_id: params.subscriptionId || null,
  })

  // Increment the code's redemption counter
  const { data: currentCode } = await admin
    .from('coupon_codes')
    .select('redemption_count')
    .eq('id', params.couponCodeId)
    .single()

  if (currentCode) {
    await admin
      .from('coupon_codes')
      .update({ redemption_count: currentCode.redemption_count + 1 })
      .eq('id', params.couponCodeId)
  }
}

/**
 * Generate bulk unique coupon codes for a campaign.
 */
export async function generateBulkCodes(params: {
  couponId: string
  count: number
  prefix?: string
  batchId?: string
}): Promise<{ codes: string[]; batchId: string }> {
  const admin = getServiceClient()
  const batchId = params.batchId || crypto.randomUUID()
  const prefix = params.prefix ? params.prefix.toUpperCase() + '-' : ''
  const codes: string[] = []

  const rows = []
  for (let i = 0; i < params.count; i++) {
    const suffix = crypto.randomBytes(4).toString('hex').toUpperCase()
    const code = `${prefix}${suffix}`
    codes.push(code)
    rows.push({
      coupon_id: params.couponId,
      code,
      batch_id: batchId,
      is_active: true,
    })
  }

  // Insert in batches of 500 to avoid payload limits
  const BATCH_SIZE = 500
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error } = await admin.from('coupon_codes').insert(batch)
    if (error) {
      throw new Error(`Failed to generate codes: ${error.message}`)
    }
  }

  return { codes, batchId }
}
