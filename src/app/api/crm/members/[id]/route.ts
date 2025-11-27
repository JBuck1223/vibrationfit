// /src/app/api/crm/members/[id]/route.ts
// Individual member operations - Uses auth.users as source of truth

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Force dynamic rendering (no caching)
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const isAdmin =
      user.email === 'buckinghambliss@gmail.com' ||
      user.email === 'admin@vibrationfit.com' ||
      user.user_metadata?.is_admin === true

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Use admin client to get user
    const adminClient = createAdminClient()
    const { data: authUserData, error: authError } = await adminClient.auth.admin.getUserById(id)

    if (authError || !authUserData.user) {
      console.error('❌ Error fetching auth user:', authError)
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const authUser = authUserData.user

    // Get active profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', id)
      .eq('is_active', true)
      .eq('is_draft', false)
      .single()

    // Get activity metrics
    const { data: activityMetrics } = await supabase
      .from('user_activity_metrics')
      .select('*')
      .eq('user_id', id)
      .single()

    // Get subscription with tier info (for revenue calculation)
    const { data: subscription } = await supabase
      .from('customer_subscriptions')
      .select(`
        *,
        membership_tiers (
          name,
          tier_type,
          price_monthly,
          price_yearly,
          billing_interval
        )
      `)
      .eq('user_id', id)
      .in('status', ['active', 'trialing'])
      .single()

    // Get payment history for revenue calculation
    const { data: payments } = await supabase
      .from('payment_history')
      .select('amount, paid_at, status')
      .eq('user_id', id)
      .eq('status', 'succeeded')
      .order('paid_at', { ascending: true })

    // Calculate revenue metrics
    const totalSpent = payments?.reduce((sum, p) => sum + (p.amount / 100), 0) || 0
    const ltv = totalSpent
    const tier = subscription?.membership_tiers
    let mrr = 0
    if (tier) {
      if (tier.billing_interval === 'month') {
        mrr = (tier.price_monthly || 0) / 100
      } else if (tier.billing_interval === 'year') {
        mrr = (tier.price_yearly || 0) / 12 / 100
      }
    }
    
    const firstPayment = payments && payments.length > 0 ? new Date(payments[0].paid_at) : null
    const daysAsCustomer = firstPayment 
      ? Math.floor((Date.now() - firstPayment.getTime()) / (1000 * 60 * 60 * 24))
      : 0

    const revenueMetrics = {
      subscription_tier: subscription?.membership_tiers?.name || 'Free',
      subscription_status: subscription?.status || null,
      stripe_customer_id: subscription?.stripe_customer_id || null,
      stripe_subscription_id: subscription?.stripe_subscription_id || null,
      mrr,
      ltv,
      total_spent: totalSpent,
      subscription_start_date: subscription?.created_at || null,
      days_as_customer: daysAsCustomer,
    }

    // Get SMS messages
    const { data: smsMessages } = await supabase
      .from('sms_messages')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: true })

    // Get email messages
    const { data: emailMessages } = await supabase
      .from('email_messages')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: true })

    // Get support tickets
    const { data: tickets } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })

    // Get related lead (if converted from lead)
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('converted_to_user_id', id)
      .single()

    return NextResponse.json({
      member: {
        user_id: authUser.id,
        email: authUser.email,
        phone: profile?.phone || authUser.phone || null,
        full_name: profile?.first_name && profile?.last_name 
          ? `${profile.first_name} ${profile.last_name}` 
          : profile?.first_name || profile?.last_name || authUser.email?.split('@')[0] || 'Unknown',
        created_at: authUser.created_at,
        activity_metrics: activityMetrics || {},
        revenue_metrics: revenueMetrics || {},
      },
      smsMessages: smsMessages || [],
      emailMessages: emailMessages || [],
      tickets: tickets || [],
      lead: lead || null,
    })
  } catch (error: any) {
    console.error('❌ Error in get member API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const isAdmin =
      user.email === 'buckinghambliss@gmail.com' ||
      user.email === 'admin@vibrationfit.com' ||
      user.user_metadata?.is_admin === true

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Update activity metrics (manual status/tags/notes)
    const { data: metrics, error } = await supabase
      .from('user_activity_metrics')
      .upsert({
        user_id: id,
        ...body,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating member:', error)
      return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
    }

    return NextResponse.json({ metrics })
  } catch (error: any) {
    console.error('❌ Error in update member API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
