import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { stripe } from '@/lib/stripe/config'
import { ROLLOVER_LIMITS, PRICING } from '@/lib/billing/config'

const SEAT_PRICE_IDS: Record<string, string | undefined> = {
  '28day': process.env.STRIPE_PRICE_SEAT_ADDON_28DAY,
  year: process.env.STRIPE_PRICE_SEAT_ADDON_ANNUAL,
}

/**
 * GET - Preview seat add-on pricing for the user's billing interval.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: subscription } = await supabase
      .from('customer_subscriptions')
      .select('membership_tier_id, tier:membership_tiers(billing_interval, is_household_plan)')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .limit(1)
      .maybeSingle()

    if (!subscription?.tier) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 400 })
    }

    const tier = subscription.tier as any
    if (!tier.is_household_plan) {
      return NextResponse.json({ error: 'Not on a household plan' }, { status: 400 })
    }

    const interval = tier.billing_interval === 'year' ? 'year' : '28day'
    const price = interval === 'year' ? PRICING.ADDON_ANNUAL : PRICING.ADDON_28DAY
    const intervalLabel = interval === 'year' ? '/year' : '/28 days'

    return NextResponse.json({
      pricePerSeat: price,
      interval,
      intervalLabel,
      maxAddonSeats: ROLLOVER_LIMITS.HOUSEHOLD_MAX_ADDONS,
      maxTotalMembers: ROLLOVER_LIMITS.HOUSEHOLD_MAX_MEMBERS,
    })
  } catch (error) {
    console.error('Addon seats preview error:', error)
    return NextResponse.json({ error: 'Failed to preview seat pricing' }, { status: 500 })
  }
}

/**
 * POST - Add one seat to the household subscription.
 */
export async function POST() {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const supabase = await createClient()
    const serviceClient = createServiceClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: subscription } = await supabase
      .from('customer_subscriptions')
      .select('id, stripe_subscription_id, stripe_customer_id, tier:membership_tiers(billing_interval, is_household_plan)')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .not('stripe_subscription_id', 'is', null)
      .limit(1)
      .maybeSingle()

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 400 })
    }

    const tier = subscription.tier as any
    if (!tier?.is_household_plan) {
      return NextResponse.json({ error: 'Not on a household plan' }, { status: 400 })
    }

    const { data: household } = await serviceClient
      .from('household_members')
      .select('household_id, households!inner(id, max_members, admin_user_id)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()

    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    const householdInfo = (household as any).households
    if (householdInfo.admin_user_id !== user.id) {
      return NextResponse.json({ error: 'Only household admin can manage seats' }, { status: 403 })
    }

    if (householdInfo.max_members >= ROLLOVER_LIMITS.HOUSEHOLD_MAX_MEMBERS) {
      return NextResponse.json({ error: `Maximum seats reached (${ROLLOVER_LIMITS.HOUSEHOLD_MAX_MEMBERS})` }, { status: 400 })
    }

    const interval = tier.billing_interval === 'year' ? 'year' : '28day'
    const seatPriceId = SEAT_PRICE_IDS[interval]

    if (!seatPriceId) {
      return NextResponse.json({ error: 'Seat add-on pricing not configured' }, { status: 500 })
    }

    const stripeSub = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id)
    const existingSeatItem = stripeSub.items.data.find(item => item.price.id === seatPriceId)

    if (existingSeatItem) {
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        items: [{
          id: existingSeatItem.id,
          quantity: (existingSeatItem.quantity || 1) + 1,
        }],
        proration_behavior: 'create_prorations',
      })
    } else {
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        items: [{
          price: seatPriceId,
          quantity: 1,
        }],
        proration_behavior: 'create_prorations',
      })
    }

    await serviceClient
      .from('households')
      .update({ max_members: householdInfo.max_members + 1 })
      .eq('id', householdInfo.id)

    return NextResponse.json({
      success: true,
      newMaxMembers: householdInfo.max_members + 1,
    })
  } catch (error) {
    console.error('Add seat error:', error)
    return NextResponse.json({ error: 'Failed to add seat' }, { status: 500 })
  }
}

/**
 * DELETE - Remove one add-on seat from the household subscription.
 */
export async function DELETE() {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const supabase = await createClient()
    const serviceClient = createServiceClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: subscription } = await supabase
      .from('customer_subscriptions')
      .select('id, stripe_subscription_id, tier:membership_tiers(billing_interval, is_household_plan)')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .not('stripe_subscription_id', 'is', null)
      .limit(1)
      .maybeSingle()

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 400 })
    }

    const tier = subscription.tier as any
    if (!tier?.is_household_plan) {
      return NextResponse.json({ error: 'Not on a household plan' }, { status: 400 })
    }

    const { data: household } = await serviceClient
      .from('household_members')
      .select('household_id, households!inner(id, max_members, admin_user_id)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()

    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    const householdInfo = (household as any).households
    if (householdInfo.admin_user_id !== user.id) {
      return NextResponse.json({ error: 'Only household admin can manage seats' }, { status: 403 })
    }

    const includedSeats = 2
    const addonSeats = householdInfo.max_members - includedSeats
    if (addonSeats <= 0) {
      return NextResponse.json({ error: 'No add-on seats to remove' }, { status: 400 })
    }

    const { data: activeMembers } = await serviceClient
      .from('household_members')
      .select('id')
      .eq('household_id', householdInfo.id)
      .eq('status', 'active')

    const activeMemberCount = activeMembers?.length || 0
    if (activeMemberCount > householdInfo.max_members - 1) {
      return NextResponse.json({
        error: 'Cannot remove seat while all seats are occupied. Remove a member first.',
      }, { status: 400 })
    }

    const interval = tier.billing_interval === 'year' ? 'year' : '28day'
    const seatPriceId = SEAT_PRICE_IDS[interval]

    if (seatPriceId) {
      const stripeSub = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id)
      const seatItem = stripeSub.items.data.find(item => item.price.id === seatPriceId)

      if (seatItem) {
        const currentQty = seatItem.quantity || 1
        if (currentQty <= 1) {
          await stripe.subscriptionItems.del(seatItem.id, {
            proration_behavior: 'create_prorations',
          })
        } else {
          await stripe.subscriptions.update(subscription.stripe_subscription_id, {
            items: [{
              id: seatItem.id,
              quantity: currentQty - 1,
            }],
            proration_behavior: 'create_prorations',
          })
        }
      }
    }

    await serviceClient
      .from('households')
      .update({ max_members: householdInfo.max_members - 1 })
      .eq('id', householdInfo.id)

    return NextResponse.json({
      success: true,
      newMaxMembers: householdInfo.max_members - 1,
    })
  } catch (error) {
    console.error('Remove seat error:', error)
    return NextResponse.json({ error: 'Failed to remove seat' }, { status: 500 })
  }
}
