import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { stripe } from '@/lib/stripe/config'
import { resolveStripePriceId } from '@/lib/billing/products'

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

    const {
      firstName,
      lastName,
      email,
      promoCode,
    } = (await request.json()) as {
      firstName: string
      lastName: string
      email: string
      promoCode?: string
    }

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'First name, last name, and email are required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    const { data: membership } = await serviceClient
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .eq('status', 'active')
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: 'You are not a household admin' }, { status: 403 })
    }

    const { data: household } = await serviceClient
      .from('households')
      .select('id, name, max_members')
      .eq('id', membership.household_id)
      .single()

    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    const { count: memberCount } = await serviceClient
      .from('household_members')
      .select('id', { count: 'exact', head: true })
      .eq('household_id', household.id)
      .eq('status', 'active')

    const { count: pendingInviteCount } = await serviceClient
      .from('household_invitations')
      .select('id', { count: 'exact', head: true })
      .eq('household_id', household.id)
      .eq('status', 'pending')

    const totalOccupied = (memberCount || 0) + (pendingInviteCount || 0)

    const { data: existingInvite } = await serviceClient
      .from('household_invitations')
      .select('id')
      .eq('household_id', household.id)
      .eq('invited_email', email.trim().toLowerCase())
      .eq('status', 'pending')
      .maybeSingle()

    if (existingInvite) {
      return NextResponse.json({ error: 'This person already has a pending invitation' }, { status: 400 })
    }

    const { data: subscription } = await supabase
      .from('customer_subscriptions')
      .select('id, stripe_customer_id, stripe_subscription_id, stripe_price_id')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .not('stripe_subscription_id', 'is', null)
      .limit(1)
      .maybeSingle()

    if (!subscription?.stripe_subscription_id || !subscription.stripe_customer_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
    }

    const INCLUDED_SEATS = 2
    const paidSeatsNeeded = Math.max(0, totalOccupied + 1 - INCLUDED_SEATS)

    let intensiveResult: { success: boolean; invoiceId?: string; waived?: boolean; error?: string } = { success: false }
    try {
      const intensiveUrl = new URL('/api/billing/purchase-intensive', request.url)
      const intensiveRes = await fetch(intensiveUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: request.headers.get('cookie') || '',
        },
        body: JSON.stringify({
          overrideAmount: 20000,
          promoCode: promoCode || undefined,
          partnerFirstName: firstName.trim(),
          partnerLastName: lastName.trim(),
          partnerEmail: email.trim().toLowerCase(),
        }),
      })
      intensiveResult = await intensiveRes.json()
      if (!intensiveRes.ok) {
        return NextResponse.json({
          error: `Intensive charge failed: ${intensiveResult.error || 'Unknown error'}`,
        }, { status: 402 })
      }
    } catch (err: any) {
      console.error('Intensive purchase call failed:', err)
      return NextResponse.json({ error: 'Failed to charge intensive fee' }, { status: 500 })
    }

    if (paidSeatsNeeded > 0) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id)
        const mainItem = stripeSubscription.items.data[0]
        if (!mainItem?.price?.recurring) {
          return NextResponse.json({ error: 'Unable to determine billing interval' }, { status: 500 })
        }

        const intervalKey = mainItem.price.recurring.interval === 'year' ? 'annual' as const : '28day' as const
        const seatPriceId = await resolveStripePriceId('seats', intervalKey)

        if (!seatPriceId) {
          return NextResponse.json({ error: 'Seat add-on price not configured' }, { status: 500 })
        }

        const existingSeatItem = stripeSubscription.items.data.find(
          item => item.price.id === seatPriceId
        )

        const items: any[] = []
        if (existingSeatItem) {
          items.push({ id: existingSeatItem.id, quantity: paidSeatsNeeded })
        } else {
          items.push({ price: seatPriceId, quantity: paidSeatsNeeded })
        }

        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          items,
          proration_behavior: 'create_prorations',
        })
      } catch (err: any) {
        console.error('Seat add-on update failed:', err)
        return NextResponse.json({
          error: 'Intensive charged but seat add-on failed. Contact support.',
          intensiveCharged: true,
        }, { status: 500 })
      }
    }

    let partnerInvited = false
    try {
      const { data: profile } = await serviceClient
        .from('user_profiles')
        .select('first_name, last_name')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      const adminName = profile?.first_name
        ? `${profile.first_name} ${profile.last_name || ''}`.trim()
        : user.email?.split('@')[0] || ''

      const { invitePartnerToHousehold } = await import('@/lib/supabase/household')
      const inviteResult = await invitePartnerToHousehold({
        supabaseAdmin: serviceClient,
        householdId: household.id,
        adminUserId: user.id,
        adminName,
        adminEmail: user.email || '',
        householdName: household.name,
        partnerFirstName: firstName.trim(),
        partnerLastName: lastName.trim(),
        partnerEmail: email.trim().toLowerCase(),
      })
      partnerInvited = inviteResult.success
    } catch (err) {
      console.error('Invitation send failed (non-blocking):', err)
    }

    return NextResponse.json({
      success: true,
      partnerInvited,
      intensiveWaived: intensiveResult.waived || false,
      paidSeats: paidSeatsNeeded,
      totalMembers: totalOccupied + 1,
    })
  } catch (error: any) {
    console.error('Add household member error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to add member' }, { status: 500 })
  }
}
