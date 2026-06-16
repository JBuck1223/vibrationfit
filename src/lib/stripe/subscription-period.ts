import type Stripe from 'stripe'

export type SubscriptionPeriod = {
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  trialStart: string | null
  trialEnd: string | null
}

type PeriodFields = {
  current_period_start?: number
  current_period_end?: number
  trial_start?: number
  trial_end?: number
}

function epochToIso(epoch: number | null | undefined): string | null {
  if (!epoch) return null
  return new Date(epoch * 1000).toISOString()
}

/** Main membership line item — excludes token/storage add-ons. */
export function getMainSubscriptionItem(
  sub: Stripe.Subscription,
): Stripe.SubscriptionItem | null {
  const items = sub.items?.data ?? []
  if (items.length === 0) return null

  return (
    items.find(item => {
      const meta = item.price?.metadata || {}
      return meta.addon_type !== 'tokens' && meta.addon_type !== 'storage'
    }) ?? items[0]
  )
}

/**
 * Stripe Basil/Clover moved billing periods from Subscription to SubscriptionItem.
 * Read item-level dates first, with legacy top-level fallback.
 */
export function getSubscriptionPeriod(sub: Stripe.Subscription): SubscriptionPeriod {
  const item = getMainSubscriptionItem(sub) as (Stripe.SubscriptionItem & PeriodFields) | null
  const legacy = sub as Stripe.Subscription & PeriodFields

  return {
    currentPeriodStart: epochToIso(item?.current_period_start ?? legacy.current_period_start),
    currentPeriodEnd: epochToIso(item?.current_period_end ?? legacy.current_period_end),
    trialStart: epochToIso(legacy.trial_start),
    trialEnd: epochToIso(legacy.trial_end),
  }
}

export function getNextBillingDate(options: {
  status?: string | null
  currentPeriodEnd?: string | null
  trialEnd?: string | null
  upcomingInvoicePeriodEnd?: string | null
  nextPaymentAttempt?: string | null
}): string | null {
  const {
    status,
    currentPeriodEnd,
    trialEnd,
    upcomingInvoicePeriodEnd,
    nextPaymentAttempt,
  } = options

  if (nextPaymentAttempt) return nextPaymentAttempt
  if (upcomingInvoicePeriodEnd) return upcomingInvoicePeriodEnd
  if (status === 'trialing' && trialEnd) return trialEnd
  return currentPeriodEnd ?? trialEnd ?? null
}
