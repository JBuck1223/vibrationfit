import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe/config'
import type Stripe from 'stripe'

function mapTierToResponse(tier: any): any {
  if (!tier) return null
  return {
    id: tier.id,
    name: tier.name,
    description: tier.description,
    tierType: tier.tier_type,
    priceMonthly: tier.price_monthly,
    priceYearly: tier.price_yearly,
    billingInterval: tier.billing_interval,
    monthlyTokenGrant: tier.monthly_token_grant,
    annualTokenGrant: tier.annual_token_grant,
    storageQuotaGb: tier.storage_quota_gb,
    features: tier.features,
    planCategory: tier.plan_category,
    isHouseholdPlan: tier.is_household_plan,
    includedSeats: tier.included_seats,
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const user = session?.user

    if (sessionError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let subscription: any = (await supabase
      .from('customer_subscriptions')
      .select(`
        *,
        tier:membership_tiers(*)
      `)
      .eq('user_id', user.id)
      .or('status.eq.active,status.eq.trialing,status.eq.past_due')
      .order('current_period_end', { ascending: false })
      .limit(1)
      .maybeSingle()).data

    // If no subscription in DB but Stripe is configured, try to sync from Stripe (e.g. webhook missed or old signup)
    if (!subscription && stripe && user.email) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 }).catch(() => ({ data: [] }))
      const customerId = customers.data[0]?.id
      if (customerId) {
        const stripeSubs = await stripe.subscriptions.list({
          customer: customerId,
          status: 'all',
          limit: 10,
        }).catch(() => ({ data: [] }))
        const stripeSub = stripeSubs.data.find(
          (s) => s.status === 'active' || s.status === 'trialing' || s.status === 'past_due'
        )
        if (stripeSub) {
          const mainItem = stripeSub.items.data.find(
            (item) => !(item.price.metadata?.addon_type === 'tokens' || item.price.metadata?.addon_type === 'storage')
          ) || stripeSub.items.data[0]
          const priceId = mainItem?.price.id
          if (priceId) {
            const admin = createAdminClient()
            const { data: tierByPrice } = await admin
              .from('membership_tiers')
              .select('id')
              .eq('stripe_price_id', priceId)
              .maybeSingle()
            if (tierByPrice) {
              await admin.from('customer_subscriptions').upsert({
                user_id: user.id,
                membership_tier_id: tierByPrice.id,
                stripe_customer_id: customerId,
                stripe_subscription_id: stripeSub.id,
                stripe_price_id: priceId,
                status: stripeSub.status,
                current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
                current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
                cancel_at_period_end: stripeSub.cancel_at_period_end,
                trial_start: stripeSub.trial_start ? new Date(stripeSub.trial_start * 1000).toISOString() : null,
                trial_end: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000).toISOString() : null,
              }, {
                onConflict: 'stripe_subscription_id',
                ignoreDuplicates: false,
              })
              const refetched = (await supabase
                .from('customer_subscriptions')
                .select(`
                  *,
                  tier:membership_tiers(*)
                `)
                .eq('user_id', user.id)
                .eq('stripe_subscription_id', stripeSub.id)
                .maybeSingle()).data
              subscription = refetched
            }
          }
        }
      }
    }

    if (!subscription) {
      return NextResponse.json({
        subscription: null,
        addons: [],
        upcomingInvoice: null,
        defaultPaymentMethod: null,
      })
    }

    // If subscription exists but tier is null (e.g. RLS hides inactive tier), fetch tier with admin for display
    let tierData = subscription.tier ? mapTierToResponse(subscription.tier) : null
    if (!tierData && subscription.membership_tier_id) {
      try {
        const admin = createAdminClient()
        const { data: tierRow } = await admin
          .from('membership_tiers')
          .select('*')
          .eq('id', subscription.membership_tier_id)
          .single()
        tierData = mapTierToResponse(tierRow)
      } catch {
        // keep tierData null
      }
    }

    let addons: any[] = []
    let upcomingInvoice: any = null
    let defaultPaymentMethod: any = null

    if (stripe && subscription.stripe_customer_id) {
      const tasks: Promise<void>[] = []

      // Fetch active add-ons from Stripe subscription line items
      if (subscription.stripe_subscription_id) {
        tasks.push(
          stripe.subscriptions.retrieve(subscription.stripe_subscription_id).then(stripeSub => {
            addons = stripeSub.items.data
              .filter(item => {
                const meta = item.price.metadata || {}
                return meta.addon_type === 'tokens' || meta.addon_type === 'storage'
              })
              .map(item => ({
                id: item.id,
                priceId: item.price.id,
                addonType: item.price.metadata?.addon_type || 'unknown',
                quantity: item.quantity || 1,
                unitAmount: item.price.unit_amount || 0,
                currency: item.price.currency || 'usd',
                interval: item.price.recurring?.interval || null,
                intervalCount: item.price.recurring?.interval_count || null,
                productName: typeof item.price.product === 'string'
                  ? item.price.product
                  : (item.price.product as Stripe.Product)?.name || 'Add-on',
              }))
          }).catch(() => { /* non-critical */ })
        )

        // Fetch upcoming invoice
        tasks.push(
          stripe.invoices.createPreview({ customer: subscription.stripe_customer_id }).then(inv => {
            upcomingInvoice = {
              amountDue: inv.amount_due,
              currency: inv.currency,
              periodEnd: inv.period_end
                ? new Date(inv.period_end * 1000).toISOString()
                : null,
              nextPaymentAttempt: inv.next_payment_attempt
                ? new Date(inv.next_payment_attempt * 1000).toISOString()
                : null,
              lines: inv.lines.data.map(line => ({
                description: line.description,
                amount: line.amount,
                currency: line.currency,
              })),
            }
          }).catch(() => { /* no upcoming invoice */ })
        )
      }

      // Fetch default payment method
      tasks.push(
        stripe.customers.retrieve(subscription.stripe_customer_id).then(cust => {
          if ((cust as Stripe.Customer).deleted) return
          const customer = cust as Stripe.Customer
          const pmId = customer.invoice_settings?.default_payment_method
          if (pmId && typeof pmId === 'string') {
            return stripe!.paymentMethods.retrieve(pmId).then(pm => {
              defaultPaymentMethod = {
                id: pm.id,
                brand: pm.card?.brand || null,
                last4: pm.card?.last4 || null,
                expMonth: pm.card?.exp_month || null,
                expYear: pm.card?.exp_year || null,
              }
            })
          }
        }).catch(() => { /* non-critical */ })
      )

      await Promise.all(tasks)
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at,
        stripeSubscriptionId: subscription.stripe_subscription_id,
        tier: tierData,
      },
      addons,
      upcomingInvoice,
      defaultPaymentMethod,
    })
  } catch (error) {
    console.error('Membership API error:', error)
    return NextResponse.json({ error: 'Failed to fetch membership' }, { status: 500 })
  }
}
