// Shared helpers for charging existing members via their vaulted PayPal card.
// Used by household add-member, plan changes, pack purchases, and the admin
// "charge now" control. All amounts come from our database.

import { chargeVaultedCard, PayPalCaptureResult } from '@/lib/paypal/orders'

type ServiceClient = any

export type VaultMethod = {
  id: string
  vaultId: string
  brand: string | null
  last4: string | null
}

export type PayPalSubRow = {
  id: string
  user_id: string
  provider: string | null
  status: string
  amount_cents: number | null
  billing_interval_days: number | null
  next_billing_at: string | null
  current_period_end: string | null
  payment_method_id: string | null
  membership_tier_id: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  stripe_price_id: string | null
  membership_tiers: {
    id: string
    tier_type: string | null
    name: string | null
    billing_interval: string | null
    plan_category: string | null
    included_seats: number | null
    max_household_members: number | null
    price_monthly: number | null
    price_yearly: number | null
  } | null
}

/**
 * The user's active membership subscription (either provider), skipping
 * intensive installment schedules. Most recent first.
 */
export async function getActiveMembershipSubscription(
  serviceClient: ServiceClient,
  userId: string,
): Promise<PayPalSubRow | null> {
  const { data: subs } = await serviceClient
    .from('customer_subscriptions')
    .select(`
      id, user_id, provider, status, amount_cents, billing_interval_days,
      next_billing_at, current_period_end, payment_method_id, membership_tier_id,
      stripe_customer_id, stripe_subscription_id, stripe_price_id,
      membership_tiers (
        id, tier_type, name, billing_interval, plan_category,
        included_seats, max_household_members, price_monthly, price_yearly
      )
    `)
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(5)

  const membership = (subs || []).find((s: any) => {
    const cat = s.membership_tiers?.plan_category
    return cat !== 'intensive'
  })
  return (membership as PayPalSubRow) || null
}

export function isPayPalSubscription(sub: PayPalSubRow): boolean {
  return sub.provider === 'paypal' || !sub.stripe_subscription_id
}

/**
 * Resolve the vaulted card to charge: the subscription's payment method if
 * set, otherwise the user's default active card.
 */
export async function getVaultMethod(
  serviceClient: ServiceClient,
  userId: string,
  paymentMethodId?: string | null,
): Promise<VaultMethod | null> {
  if (paymentMethodId) {
    const { data: pm } = await serviceClient
      .from('payment_methods')
      .select('id, paypal_vault_id, brand, last4, status')
      .eq('id', paymentMethodId)
      .maybeSingle()
    if (pm?.paypal_vault_id && pm.status === 'active') {
      return { id: pm.id, vaultId: pm.paypal_vault_id, brand: pm.brand, last4: pm.last4 }
    }
  }

  const { data: fallback } = await serviceClient
    .from('payment_methods')
    .select('id, paypal_vault_id, brand, last4')
    .eq('user_id', userId)
    .eq('provider', 'paypal')
    .eq('status', 'active')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (fallback?.paypal_vault_id) {
    return { id: fallback.id, vaultId: fallback.paypal_vault_id, brand: fallback.brand, last4: fallback.last4 }
  }
  return null
}

/**
 * Fraction of the current billing cycle remaining (0..1) for day-based
 * proration. Trialing subs return 0 — nothing has been paid yet, so
 * mid-cycle additions start billing at the first renewal.
 */
export function remainingCycleFraction(sub: {
  status: string
  next_billing_at: string | null
  billing_interval_days: number | null
}): number {
  if (sub.status === 'trialing') return 0
  if (!sub.next_billing_at || !sub.billing_interval_days) return 0
  const remainingMs = new Date(sub.next_billing_at).getTime() - Date.now()
  const cycleMs = sub.billing_interval_days * 24 * 60 * 60 * 1000
  if (remainingMs <= 0 || cycleMs <= 0) return 0
  return Math.min(1, remainingMs / cycleMs)
}

/**
 * Charge a member's vaulted card and record it in payment_history.
 * Throws on decline / API failure (after recording the failed attempt).
 */
export async function chargeMemberVault(params: {
  serviceClient: ServiceClient
  userId: string
  subscriptionId?: string | null
  vault: VaultMethod
  amountCents: number
  description: string
  /** Idempotency key for PayPal */
  requestId: string
  metadata?: Record<string, unknown>
}): Promise<PayPalCaptureResult> {
  const { serviceClient } = params

  let charge: PayPalCaptureResult | null = null
  let chargeError: unknown = null
  try {
    charge = await chargeVaultedCard({
      vaultId: params.vault.vaultId,
      amountCents: params.amountCents,
      description: params.description,
      customId: params.subscriptionId ? `sub:${params.subscriptionId}` : `user:${params.userId}`,
      requestId: params.requestId,
    })
  } catch (err) {
    chargeError = err
  }

  if (!charge || charge.status !== 'COMPLETED') {
    await serviceClient.from('payment_history').insert({
      user_id: params.userId,
      subscription_id: params.subscriptionId || null,
      provider: 'paypal',
      amount: params.amountCents,
      currency: 'usd',
      status: 'failed',
      description: `${params.description} (failed)`,
      metadata: {
        ...(params.metadata || {}),
        paypal_response: charge?.raw || String(chargeError) || null,
      },
    })
    const msg = (chargeError as any)?.message || `Charge status: ${charge?.status || 'FAILED'}`
    throw new Error(`Card charge failed: ${msg}`)
  }

  await serviceClient.from('payment_history').insert({
    user_id: params.userId,
    subscription_id: params.subscriptionId || null,
    provider: 'paypal',
    paypal_order_id: charge.orderId,
    paypal_capture_id: charge.captureId,
    amount: params.amountCents,
    currency: charge.currency || 'usd',
    status: 'succeeded',
    description: params.description,
    paid_at: new Date().toISOString(),
    metadata: params.metadata || null,
  })

  return charge
}

/**
 * Apply per-cycle grants for a subscription's active add-ons. Seats grant
 * nothing (capacity only). Token add-ons re-grant every cycle. Storage
 * add-ons keep a single persistent user_storage row while the addon is
 * active (mirrors the Stripe storage-addon behavior).
 */
export async function applySubscriptionAddonGrants(
  serviceClient: ServiceClient,
  sub: { id: string; user_id: string },
  paypalOrderId: string | null,
) {
  const { data: addons } = await serviceClient
    .from('subscription_addons')
    .select('id, addon_type, quantity, unit_amount_cents, grant_amount, grant_unit')
    .eq('subscription_id', sub.id)
    .eq('status', 'active')

  if (!addons || addons.length === 0) return

  for (const addon of addons) {
    const quantity = addon.quantity || 1

    if (addon.addon_type === 'tokens' && addon.grant_amount > 0) {
      const { recordTokenPackPurchase } = await import('@/lib/tokens/transactions')
      await recordTokenPackPurchase(
        sub.user_id,
        'token_addon',
        addon.grant_amount * quantity,
        (addon.unit_amount_cents || 0) * quantity,
        paypalOrderId || '',
        '',
        {
          source: 'subscription_addon',
          provider: 'paypal',
          subscription_addon_id: addon.id,
          quantity,
        },
        serviceClient,
      )
    } else if (addon.addon_type === 'storage' && addon.grant_amount > 0) {
      const { data: existing } = await serviceClient
        .from('user_storage')
        .select('id')
        .eq('subscription_id', sub.id)
        .eq('metadata->>subscription_addon_id', addon.id)
        .maybeSingle()
      if (!existing) {
        const { error: storageErr } = await serviceClient.from('user_storage').insert({
          user_id: sub.user_id,
          quota_gb: addon.grant_amount * quantity,
          subscription_id: sub.id,
          metadata: {
            storage_addon: true,
            provider: 'paypal',
            subscription_addon_id: addon.id,
            quantity,
          },
        })
        if (storageErr) console.error('[vault-billing] storage addon grant failed:', storageErr)
      }
    }
  }
}

/**
 * Charge a DB-driven membership renewal immediately and advance the billing
 * period — the same steps the daily cron performs for a due subscription.
 * Used by the admin "charge now" control (testing, past_due recovery).
 */
export async function chargeRenewalNow(
  serviceClient: ServiceClient,
  subscriptionId: string,
): Promise<{ chargedCents: number; nextBillingAt: string }> {
  const { data: sub } = await serviceClient
    .from('customer_subscriptions')
    .select(`
      id, user_id, status, amount_cents, billing_interval_days, next_billing_at,
      payment_method_id, provider,
      renewal_discount_type, renewal_discount_value, renewal_discount_cycles_remaining,
      membership_tiers ( id, name, plan_category )
    `)
    .eq('id', subscriptionId)
    .maybeSingle()

  if (!sub) throw new Error('Subscription not found')
  if (sub.provider !== 'paypal') throw new Error('Charge now is only available for PayPal subscriptions')
  const tier = (sub as any).membership_tiers
  if (tier?.plan_category === 'intensive') throw new Error('Use the cron for installment schedules')
  if (!sub.amount_cents || sub.amount_cents <= 0) throw new Error('Subscription has no renewal amount')

  const vault = await getVaultMethod(serviceClient, sub.user_id, sub.payment_method_id)
  if (!vault) throw new Error('No active payment method on file')

  const description = `${tier?.name || 'Vision Pro Membership'} — renewal (admin charge)`
  const charge = await chargeMemberVault({
    serviceClient,
    userId: sub.user_id,
    subscriptionId: sub.id,
    vault,
    amountCents: sub.amount_cents,
    description,
    requestId: `admin-charge-${sub.id}-${Date.now()}`,
    metadata: { source: 'admin_charge_now' },
  })

  const intervalDays = sub.billing_interval_days || 28
  const periodEnd = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000)

  await serviceClient
    .from('customer_subscriptions')
    .update({
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
      next_billing_at: periodEnd.toISOString(),
      failure_count: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sub.id)

  if (tier?.id) {
    const { error: grantError } = await serviceClient.rpc('grant_tokens_for_tier', {
      p_user_id: sub.user_id,
      p_tier_id: tier.id,
      p_subscription_id: sub.id,
    })
    if (grantError) console.error('[vault-billing] token grant failed:', grantError)
  }

  await tickRenewalDiscount(serviceClient, sub as any).catch(err =>
    console.error('[vault-billing] renewal discount tick failed:', err),
  )

  await applySubscriptionAddonGrants(serviceClient, sub, charge.orderId).catch(err =>
    console.error('[vault-billing] addon grants failed:', err),
  )

  return { chargedCents: sub.amount_cents, nextBillingAt: periodEnd.toISOString() }
}

export type RenewalDiscountFields = {
  renewal_discount_type: 'percent' | 'fixed' | null
  renewal_discount_value: number | null
  renewal_discount_cycles_remaining: number | null
}

/**
 * Apply a subscription's active renewal discount to a full-price amount.
 * A discount is active while its type/value are set and cycles_remaining is
 * either null (forever) or > 0.
 */
export function applyRenewalDiscount(fullPriceCents: number, sub: RenewalDiscountFields): number {
  if (!sub.renewal_discount_type || !sub.renewal_discount_value) return fullPriceCents
  if (sub.renewal_discount_cycles_remaining !== null && sub.renewal_discount_cycles_remaining <= 0) {
    return fullPriceCents
  }
  const discount = sub.renewal_discount_type === 'percent'
    ? Math.round(fullPriceCents * sub.renewal_discount_value / 100)
    : sub.renewal_discount_value
  return Math.max(0, fullPriceCents - discount)
}

/**
 * After a successful renewal charge, count down a cycle-limited discount.
 * When the last discounted cycle is used up, clear the discount fields and
 * restore amount_cents to full price (tier base + add-ons).
 */
export async function tickRenewalDiscount(
  serviceClient: ServiceClient,
  sub: { id: string } & RenewalDiscountFields,
): Promise<void> {
  if (!sub.renewal_discount_type || sub.renewal_discount_cycles_remaining === null) return

  const remaining = sub.renewal_discount_cycles_remaining - 1
  if (remaining > 0) {
    await serviceClient
      .from('customer_subscriptions')
      .update({ renewal_discount_cycles_remaining: remaining, updated_at: new Date().toISOString() })
      .eq('id', sub.id)
    return
  }

  await serviceClient
    .from('customer_subscriptions')
    .update({
      renewal_discount_type: null,
      renewal_discount_value: null,
      renewal_discount_cycles_remaining: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sub.id)
  await recomputeSubscriptionAmount(serviceClient, sub.id)
}

/**
 * Recompute a subscription's renewal amount: tier base price + all active
 * add-on rows, then any active renewal discount. Keeps amount_cents
 * consistent after any addon or plan change.
 */
export async function recomputeSubscriptionAmount(
  serviceClient: ServiceClient,
  subscriptionId: string,
): Promise<number | null> {
  const { data: sub } = await serviceClient
    .from('customer_subscriptions')
    .select(`
      id, renewal_discount_type, renewal_discount_value, renewal_discount_cycles_remaining,
      membership_tiers ( price_monthly, price_yearly, billing_interval )
    `)
    .eq('id', subscriptionId)
    .maybeSingle()
  if (!sub) return null

  const tier = (sub as any).membership_tiers
  const base = tier?.billing_interval === 'year'
    ? (tier?.price_yearly || 0)
    : (tier?.price_monthly || 0)

  const { data: addons } = await serviceClient
    .from('subscription_addons')
    .select('quantity, unit_amount_cents')
    .eq('subscription_id', subscriptionId)
    .eq('status', 'active')

  const addonTotal = (addons || []).reduce(
    (sum: number, a: any) => sum + (a.quantity || 0) * (a.unit_amount_cents || 0),
    0,
  )

  const total = applyRenewalDiscount(base + addonTotal, sub as unknown as RenewalDiscountFields)
  await serviceClient
    .from('customer_subscriptions')
    .update({ amount_cents: total, updated_at: new Date().toISOString() })
    .eq('id', subscriptionId)
  return total
}
