import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function verifyAdmin() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set() {},
        remove() {},
      },
    },
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { error: 'Authentication required', status: 401 }

  const adminEmails = ['buckinghambliss@gmail.com']
  const isAdmin = adminEmails.includes(user.email || '') || user.user_metadata?.is_admin
  if (!isAdmin) return { error: 'Admin access required', status: 403 }

  return { user }
}

/**
 * GET: List all coupons with redemption stats.
 */
export async function GET() {
  const auth = await verifyAdmin()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const admin = getServiceClient()

  const { data: coupons, error } = await admin
    .from('coupons')
    .select(`
      *,
      coupon_codes(id, code, batch_id, max_redemptions, redemption_count, is_active)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get total redemption counts per coupon
  const couponIds = (coupons || []).map((c: any) => c.id)
  let redemptionCounts: Record<string, number> = {}

  if (couponIds.length > 0) {
    const { data: counts } = await admin
      .from('coupon_redemptions')
      .select('coupon_id')
      .in('coupon_id', couponIds)

    redemptionCounts = (counts || []).reduce((acc: Record<string, number>, r: any) => {
      acc[r.coupon_id] = (acc[r.coupon_id] || 0) + 1
      return acc
    }, {})
  }

  const enriched = (coupons || []).map((c: any) => ({
    ...c,
    total_redemptions: redemptionCounts[c.id] || 0,
    codes_count: c.coupon_codes?.length || 0,
    master_code: c.coupon_codes?.find((cc: any) => !cc.batch_id)?.code || null,
  }))

  return NextResponse.json({ coupons: enriched })
}

/**
 * POST: Create a new coupon with an optional master code.
 */
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json()
  const {
    name,
    code,
    discountType,
    discountValue,
    currency,
    minPurchaseAmount,
    maxDiscountAmount,
    eligibleProducts,
    eligibleTiers,
    maxRedemptions,
    maxRedemptionsPerUser,
    validFrom,
    validUntil,
    campaignId,
    metadata,
  } = body

  if (!name || !discountType || !discountValue) {
    return NextResponse.json({ error: 'Name, discount type, and discount value are required' }, { status: 400 })
  }

  if (!['percent', 'fixed'].includes(discountType)) {
    return NextResponse.json({ error: 'Discount type must be percent or fixed' }, { status: 400 })
  }

  if (discountType === 'percent' && (discountValue < 1 || discountValue > 100)) {
    return NextResponse.json({ error: 'Percent discount must be between 1 and 100' }, { status: 400 })
  }

  const admin = getServiceClient()

  const { data: coupon, error: couponError } = await admin
    .from('coupons')
    .insert({
      name,
      discount_type: discountType,
      discount_value: discountValue,
      currency: currency || 'usd',
      min_purchase_amount: minPurchaseAmount || null,
      max_discount_amount: maxDiscountAmount || null,
      eligible_products: eligibleProducts || null,
      eligible_tiers: eligibleTiers || null,
      max_redemptions: maxRedemptions || null,
      max_redemptions_per_user: maxRedemptionsPerUser ?? 1,
      valid_from: validFrom || null,
      valid_until: validUntil || null,
      campaign_id: campaignId || null,
      metadata: metadata || {},
    })
    .select()
    .single()

  if (couponError) {
    return NextResponse.json({ error: couponError.message }, { status: 500 })
  }

  // Create master code if provided
  let masterCode = null
  if (code) {
    const { data: codeRow, error: codeError } = await admin
      .from('coupon_codes')
      .insert({
        coupon_id: coupon.id,
        code: code.trim().toUpperCase(),
      })
      .select()
      .single()

    if (codeError) {
      return NextResponse.json({ error: `Coupon created but code failed: ${codeError.message}` }, { status: 500 })
    }
    masterCode = codeRow
  }

  return NextResponse.json({ coupon, masterCode }, { status: 201 })
}

/**
 * PATCH: Update a coupon.
 */
export async function PATCH(request: NextRequest) {
  const auth = await verifyAdmin()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: 'Coupon ID required' }, { status: 400 })
  }

  const allowedFields: Record<string, string> = {
    name: 'name',
    isActive: 'is_active',
    maxRedemptions: 'max_redemptions',
    maxRedemptionsPerUser: 'max_redemptions_per_user',
    validFrom: 'valid_from',
    validUntil: 'valid_until',
    eligibleProducts: 'eligible_products',
    eligibleTiers: 'eligible_tiers',
    minPurchaseAmount: 'min_purchase_amount',
    maxDiscountAmount: 'max_discount_amount',
    campaignId: 'campaign_id',
  }

  const dbUpdates: Record<string, any> = {}
  for (const [key, dbKey] of Object.entries(allowedFields)) {
    if (key in updates) {
      dbUpdates[dbKey] = updates[key]
    }
  }

  if (Object.keys(dbUpdates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const admin = getServiceClient()
  const { data, error } = await admin
    .from('coupons')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ coupon: data })
}
