/**
 * Admin Sync Subscriptions API
 *
 * POST /api/admin/sync-subscriptions
 *   Body: { userId }
 *
 * Pulls active subscriptions from Stripe for a user and creates missing
 * customer_subscriptions DB rows. This backfills data that should have been
 * created by the webhook but was silently lost.
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { createAdminClient, verifyAdminAccess } from '@/lib/supabase/admin'

interface SyncResult {
  stripeSubscriptionId: string
  action: 'created' | 'already_exists' | 'skipped'
  tierType: string | null
  status: string
  error?: string
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const { userId } = await request.json()

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  const adminDb = createAdminClient()

  // Verify user exists
  const { data: user, error: userError } = await adminDb
    .from('user_accounts')
    .select('id, email, full_name, membership_tier_id')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Find the Stripe customer ID from the user's orders
  const { data: orders } = await adminDb
    .from('orders')
    .select('id, stripe_payment_intent_id')
    .eq('user_id', userId)
    .not('stripe_payment_intent_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(5)

  let stripeCustomerId: string | null = null

  for (const order of orders || []) {
    if (stripeCustomerId) break
    try {
      const pi = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id!)
      if (typeof pi.customer === 'string') {
        stripeCustomerId = pi.customer
      }
    } catch {
      // payment intent may no longer exist
    }
  }

  if (!stripeCustomerId) {
    return NextResponse.json(
      { error: 'Could not find Stripe customer ID for this user. They may not have any Stripe payments.' },
      { status: 404 },
    )
  }

  // Get all Stripe subscriptions for this customer
  const stripeSubs = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: 'all',
    limit: 50,
  })

  if (stripeSubs.data.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'No subscriptions found in Stripe for this customer.',
      synced: 0,
      results: [],
    })
  }

  // Get existing DB subscriptions to avoid duplicates
  const { data: existingSubs } = await adminDb
    .from('customer_subscriptions')
    .select('stripe_subscription_id')
    .eq('user_id', userId)

  const existingStripeIds = new Set(
    (existingSubs || []).map(s => s.stripe_subscription_id).filter(Boolean)
  )

  // Pre-fetch all membership tiers for resolution
  const { data: allTiers } = await adminDb
    .from('membership_tiers')
    .select('id, tier_type, name, is_active')

  const tierByType = new Map(
    (allTiers || []).map(t => [t.tier_type, t])
  )

  // Pre-fetch product_prices for price ID -> tier resolution
  const { data: productPrices } = await adminDb
    .from('product_prices')
    .select('stripe_price_id, product_id, products(key, product_type)')
    .not('stripe_price_id', 'is', null)

  const priceToProductKey = new Map<string, string>()
  for (const pp of productPrices || []) {
    if (pp.stripe_price_id && (pp as any).products?.key) {
      priceToProductKey.set(pp.stripe_price_id, (pp as any).products.key)
    }
  }

  // Find the user's most recent order to link synced subscriptions to
  const latestOrderId = orders?.[0]?.id || null

  const results: SyncResult[] = []
  let syncedCount = 0
  let latestActiveTierId: string | null = null

  for (const ss of stripeSubs.data) {
    // Skip subscriptions already tracked in DB
    if (existingStripeIds.has(ss.id)) {
      results.push({
        stripeSubscriptionId: ss.id,
        action: 'already_exists',
        tierType: ss.metadata?.tier_type || null,
        status: ss.status,
      })
      continue
    }

    // Skip fully canceled subscriptions — no need to backfill
    if (ss.status === 'canceled') {
      results.push({
        stripeSubscriptionId: ss.id,
        action: 'skipped',
        tierType: ss.metadata?.tier_type || null,
        status: ss.status,
      })
      continue
    }

    // Resolve the membership tier
    let tier: { id: string; tier_type: string; name: string } | null = null

    // Strategy 1: metadata.tier_type from the Stripe subscription
    const metaTierType = ss.metadata?.tier_type
    if (metaTierType && tierByType.has(metaTierType)) {
      tier = tierByType.get(metaTierType)!
    }

    // Strategy 2: match the price ID to a product, then infer the tier_type
    if (!tier && ss.items.data.length > 0) {
      const priceId = ss.items.data[0].price.id
      const productKey = priceToProductKey.get(priceId)
      if (productKey && tierByType.has(productKey)) {
        tier = tierByType.get(productKey)!
      }
    }

    // Strategy 3: infer from Stripe price interval
    if (!tier && ss.items.data.length > 0) {
      const interval = ss.items.data[0].price.recurring?.interval
      if (interval === 'year') {
        tier = tierByType.get('vision_pro_annual') || null
      } else if (interval === 'month' || interval === 'day') {
        tier = tierByType.get('vision_pro_28day') || null
      }
    }

    if (!tier) {
      results.push({
        stripeSubscriptionId: ss.id,
        action: 'skipped',
        tierType: metaTierType || null,
        status: ss.status,
        error: `Could not resolve membership tier (metadata.tier_type: ${metaTierType || 'none'})`,
      })
      continue
    }

    // Build the insert payload
    const periodStart = (ss as any).current_period_start
      ? new Date((ss as any).current_period_start * 1000).toISOString()
      : null
    const periodEnd = (ss as any).current_period_end
      ? new Date((ss as any).current_period_end * 1000).toISOString()
      : null
    const trialStart = (ss as any).trial_start
      ? new Date((ss as any).trial_start * 1000).toISOString()
      : null
    const trialEnd = (ss as any).trial_end
      ? new Date((ss as any).trial_end * 1000).toISOString()
      : null

    try {
      const { error: insertError } = await adminDb
        .from('customer_subscriptions')
        .insert({
          user_id: userId,
          membership_tier_id: tier.id,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: ss.id,
          stripe_price_id: ss.items.data[0]?.price?.id || null,
          status: ss.status as any,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          cancel_at_period_end: ss.cancel_at_period_end,
          trial_start: trialStart,
          trial_end: trialEnd,
          order_id: latestOrderId,
        })

      if (insertError) {
        results.push({
          stripeSubscriptionId: ss.id,
          action: 'skipped',
          tierType: tier.tier_type,
          status: ss.status,
          error: insertError.message,
        })
        continue
      }

      // Track the tier of the latest active subscription for updating user_accounts
      if (['active', 'trialing'].includes(ss.status)) {
        latestActiveTierId = tier.id
      }

      syncedCount++
      results.push({
        stripeSubscriptionId: ss.id,
        action: 'created',
        tierType: tier.tier_type,
        status: ss.status,
      })
    } catch (err: any) {
      results.push({
        stripeSubscriptionId: ss.id,
        action: 'skipped',
        tierType: tier.tier_type,
        status: ss.status,
        error: err?.message || 'Insert failed',
      })
    }
  }

  // Set membership_tier_id on user_accounts if we synced an active subscription
  // and the user doesn't already have one set
  if (latestActiveTierId && !user.membership_tier_id) {
    await adminDb
      .from('user_accounts')
      .update({ membership_tier_id: latestActiveTierId })
      .eq('id', userId)
  }

  return NextResponse.json({
    success: true,
    stripeCustomerId,
    synced: syncedCount,
    total: stripeSubs.data.length,
    results,
  })
}
