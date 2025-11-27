// /src/app/api/crm/members/route.ts
// Member management API - Uses auth.users as source of truth

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Force dynamic rendering (no caching)
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const engagementStatus = searchParams.get('engagement_status')
    const healthStatus = searchParams.get('health_status')

    // Use admin client to list all users
    const adminClient = createAdminClient()
    const { data: authUsersData, error: authError } = await adminClient.auth.admin.listUsers()

    if (authError) {
      console.error('❌ Error fetching auth users:', authError)
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
    }

    const allUsers = authUsersData.users
    const userIds = allUsers.map(u => u.id)

    // Get active profiles for display names
    const { data: activeProfiles } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, phone')
      .in('user_id', userIds)
      .eq('is_active', true)
      .eq('is_draft', false)

    // Get subscriptions with tier info (includes pricing)
    const { data: subscriptions } = await supabase
      .from('customer_subscriptions')
      .select(`
        user_id,
        status,
        stripe_customer_id,
        stripe_subscription_id,
        current_period_start,
        created_at,
        membership_tier_id,
        membership_tiers (
          name,
          tier_type,
          price_monthly,
          price_yearly,
          billing_interval
        )
      `)
      .in('user_id', userIds)
      .in('status', ['active', 'trialing'])

    // Get activity metrics
    const { data: activityMetrics } = await supabase
      .from('user_activity_metrics')
      .select('*')
      .in('user_id', userIds)

    // Get payment totals from payment_history
    const { data: paymentTotals } = await supabase
      .from('payment_history')
      .select('user_id, amount, paid_at')
      .in('user_id', userIds)
      .eq('status', 'succeeded')

    // Combine the data - ONE entry per auth user
    const members = allUsers.map((authUser) => {
      const profile = activeProfiles?.find((p) => p.user_id === authUser.id)
      const subscription = subscriptions?.find((s) => s.user_id === authUser.id)
      const activity = activityMetrics?.find((a) => a.user_id === authUser.id) || {}
      
      // Calculate revenue metrics from payment_history
      const userPayments = paymentTotals?.filter((p) => p.user_id === authUser.id) || []
      const totalSpent = userPayments.reduce((sum, p) => sum + (p.amount / 100), 0) // Stripe amounts in cents
      const ltv = totalSpent
      
      // Calculate MRR from subscription tier
      const tier = subscription?.membership_tiers
      let mrr = 0
      if (tier) {
        if (tier.billing_interval === 'month') {
          mrr = (tier.price_monthly || 0) / 100
        } else if (tier.billing_interval === 'year') {
          mrr = (tier.price_yearly || 0) / 12 / 100
        }
      }

      // Calculate days as customer
      const firstPayment = userPayments.length > 0 
        ? new Date(Math.min(...userPayments.map(p => new Date(p.paid_at).getTime())))
        : subscription?.created_at ? new Date(subscription.created_at) : null
      const daysAsCustomer = firstPayment 
        ? Math.floor((Date.now() - firstPayment.getTime()) / (1000 * 60 * 60 * 24))
        : 0

      return {
        user_id: authUser.id,
        email: authUser.email,
        phone: profile?.phone || authUser.phone || null,
        full_name: profile?.first_name && profile?.last_name 
          ? `${profile.first_name} ${profile.last_name}` 
          : profile?.first_name || profile?.last_name || authUser.email?.split('@')[0] || 'Unknown',
        subscription_tier: subscription?.membership_tiers?.name || 'Free',
        subscription_status: subscription?.status || null,
        stripe_customer_id: subscription?.stripe_customer_id || null,
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        // Activity metrics
        ...activity,
        // Revenue metrics (calculated)
        mrr,
        ltv,
        total_spent: totalSpent,
        days_as_customer: daysAsCustomer,
      }
    })

    // Apply filters
    let filteredMembers = members

    if (engagementStatus) {
      filteredMembers = filteredMembers.filter(
        (m) => m.engagement_status === engagementStatus
      )
    }

    if (healthStatus) {
      filteredMembers = filteredMembers.filter((m) => m.health_status === healthStatus)
    }

    return NextResponse.json({ members: filteredMembers })
  } catch (error: any) {
    console.error('❌ Error in members API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
