import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/config'
import type Stripe from 'stripe'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const user = session?.user

    if (sessionError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: subscription } = await supabase
      .from('customer_subscriptions')
      .select(`
        *,
        tier:membership_tiers(*)
      `)
      .eq('user_id', user.id)
      .or('status.eq.active,status.eq.trialing,status.eq.past_due')
      .order('current_period_end', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!subscription) {
      return NextResponse.json({
        subscription: null,
        addons: [],
        upcomingInvoice: null,
        defaultPaymentMethod: null,
      })
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
        tier: subscription.tier ? {
          id: subscription.tier.id,
          name: subscription.tier.name,
          description: subscription.tier.description,
          tierType: subscription.tier.tier_type,
          priceMonthly: subscription.tier.price_monthly,
          priceYearly: subscription.tier.price_yearly,
          billingInterval: subscription.tier.billing_interval,
          monthlyTokenGrant: subscription.tier.monthly_token_grant,
          annualTokenGrant: subscription.tier.annual_token_grant,
          storageQuotaGb: subscription.tier.storage_quota_gb,
          features: subscription.tier.features,
          planCategory: subscription.tier.plan_category,
          isHouseholdPlan: subscription.tier.is_household_plan,
          includedSeats: subscription.tier.included_seats,
        } : null,
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
