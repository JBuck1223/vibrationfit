import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { stripe } from '@/lib/stripe/config'

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { targetTierId } = (await request.json()) as { targetTierId: string }

    if (!targetTierId) {
      return NextResponse.json({ error: 'Missing target tier' }, { status: 400 })
    }

    const { data: targetTier } = await supabase
      .from('membership_tiers')
      .select('id, name, stripe_price_id, tier_type, billing_interval, plan_category, is_household_plan')
      .eq('id', targetTierId)
      .eq('is_active', true)
      .maybeSingle()

    if (!targetTier) {
      return NextResponse.json({ error: 'Target plan not found' }, { status: 404 })
    }

    if (!targetTier.stripe_price_id) {
      return NextResponse.json({ error: 'Plan not available for purchase' }, { status: 400 })
    }

    const { data: subscription } = await supabase
      .from('customer_subscriptions')
      .select('id, stripe_subscription_id, membership_tier_id')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .not('stripe_subscription_id', 'is', null)
      .limit(1)
      .maybeSingle()

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
    }

    if (subscription.membership_tier_id === targetTierId) {
      return NextResponse.json({ error: 'Already on this plan' }, { status: 400 })
    }

    const stripeSub = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id)
    const mainItem = stripeSub.items.data.find(item => {
      const meta = item.price.metadata || {}
      return !meta.addon_type
    })

    if (!mainItem) {
      return NextResponse.json({ error: 'Unable to find main subscription item' }, { status: 500 })
    }

    const updatedSub = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      items: [{
        id: mainItem.id,
        price: targetTier.stripe_price_id,
      }],
      proration_behavior: 'create_prorations',
      cancel_at_period_end: false,
    })

    await supabase
      .from('customer_subscriptions')
      .update({
        membership_tier_id: targetTierId,
        stripe_price_id: targetTier.stripe_price_id,
        cancel_at_period_end: false,
        canceled_at: null,
      })
      .eq('id', subscription.id)

    let householdCreated = false

    if (targetTier.is_household_plan) {
      try {
        householdCreated = await createHouseholdForUser(user.id, user.email || '')
      } catch (householdErr) {
        console.error('Household creation error (non-blocking):', householdErr)
      }
    }

    return NextResponse.json({
      success: true,
      newTier: targetTier.name,
      newTierType: targetTier.tier_type,
      subscriptionId: updatedSub.id,
      householdCreated,
    })
  } catch (error) {
    console.error('Change plan error:', error)
    return NextResponse.json({ error: 'Failed to change plan' }, { status: 500 })
  }
}

async function createHouseholdForUser(userId: string, email: string): Promise<boolean> {
  const serviceClient = createServiceClient()

  const { data: existingMember } = await serviceClient
    .from('household_members')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (existingMember) return false

  const householdName = `${email.split('@')[0] || 'My'}'s Household`

  const { data: household, error: householdError } = await serviceClient
    .from('households')
    .insert({
      admin_user_id: userId,
      name: householdName,
      max_members: 2,
      shared_tokens_enabled: true,
    })
    .select()
    .single()

  if (householdError || !household) {
    console.error('Failed to create household:', householdError)
    return false
  }

  await serviceClient.from('household_members').insert({
    household_id: household.id,
    user_id: userId,
    role: 'admin',
    status: 'active',
    joined_at: new Date().toISOString(),
  })

  await serviceClient
    .from('user_profiles')
    .update({
      household_id: household.id,
      is_household_admin: true,
    })
    .eq('user_id', userId)

  console.log('Household created via plan change:', household.id)
  return true
}

/**
 * GET: Preview proration cost for a plan change.
 */
export async function GET(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const targetTierId = request.nextUrl.searchParams.get('targetTierId')
    if (!targetTierId) {
      return NextResponse.json({ error: 'Missing target tier' }, { status: 400 })
    }

    const { data: targetTier } = await supabase
      .from('membership_tiers')
      .select('stripe_price_id')
      .eq('id', targetTierId)
      .eq('is_active', true)
      .maybeSingle()

    if (!targetTier?.stripe_price_id) {
      return NextResponse.json({ error: 'Target plan not found' }, { status: 404 })
    }

    const { data: subscription } = await supabase
      .from('customer_subscriptions')
      .select('stripe_subscription_id, stripe_customer_id')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .not('stripe_subscription_id', 'is', null)
      .limit(1)
      .maybeSingle()

    if (!subscription?.stripe_subscription_id || !subscription.stripe_customer_id) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 400 })
    }

    const stripeSub = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id)
    const mainItem = stripeSub.items.data.find(item => {
      const meta = item.price.metadata || {}
      return !meta.addon_type
    })

    if (!mainItem) {
      return NextResponse.json({ error: 'Unable to preview' }, { status: 500 })
    }

    const invoice = await stripe.invoices.createPreview({
      customer: subscription.stripe_customer_id,
      subscription: subscription.stripe_subscription_id,
      subscription_details: {
        items: [{
          id: mainItem.id,
          price: targetTier.stripe_price_id,
        }],
        proration_behavior: 'create_prorations',
      },
    })

    const isProration = (line: typeof invoice.lines.data[number]) =>
      line.parent?.invoice_item_details?.proration ||
      line.parent?.subscription_item_details?.proration
    const prorationItems = invoice.lines.data.filter(isProration)
    const prorationAmount = prorationItems.reduce((sum, line) => sum + line.amount, 0)

    return NextResponse.json({
      prorationAmount,
      currency: invoice.currency,
      immediateAmount: Math.max(0, prorationAmount),
      lines: prorationItems.map(line => ({
        description: line.description,
        amount: line.amount,
      })),
    })
  } catch (error) {
    console.error('Proration preview error:', error)
    return NextResponse.json({ error: 'Failed to preview proration' }, { status: 500 })
  }
}
