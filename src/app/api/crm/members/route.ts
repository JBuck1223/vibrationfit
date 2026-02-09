// /src/app/api/crm/members/route.ts
// Member management API - Uses auth.users as source of truth

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, isUserAdmin } from '@/lib/supabase/admin'

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

    if (!isUserAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const engagementStatus = searchParams.get('engagement_status')
    const healthStatus = searchParams.get('health_status')

    // Use admin client for ALL queries to bypass RLS
    const adminClient = createAdminClient()

    // Paginate through all auth users (listUsers caps at ~1000 per page)
    const allUsers: Array<{
      id: string
      email?: string
      phone?: string
      created_at: string
      last_sign_in_at?: string | null
    }> = []
    let page = 1
    const perPage = 1000

    while (true) {
      const { data: authUsersData, error: authError } = await adminClient.auth.admin.listUsers({
        page,
        perPage,
      })

      if (authError) {
        console.error('Error fetching auth users:', authError)
        return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
      }

      allUsers.push(...authUsersData.users)

      // If we got fewer than perPage, we've reached the last page
      if (authUsersData.users.length < perPage) break
      page++
    }

    const userIds = allUsers.map(u => u.id)

    // Run independent queries in parallel using admin client
    const [
      { data: activeProfiles },
      { data: subscriptions },
      { data: activityMetrics },
      { data: paymentTotals },
    ] = await Promise.all([
      adminClient
        .from('user_profiles')
        .select('user_id, first_name, last_name, phone')
        .in('user_id', userIds)
        .eq('is_active', true)
        .eq('is_draft', false),
      adminClient
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
        .in('status', ['active', 'trialing']),
      adminClient
        .from('user_activity_metrics')
        .select('*')
        .in('user_id', userIds),
      adminClient
        .from('payment_history')
        .select('user_id, amount, paid_at')
        .in('user_id', userIds)
        .eq('status', 'succeeded'),
    ])

    // Combine the data - ONE entry per auth user
    const members = allUsers.map((authUser) => {
      const profile = activeProfiles?.find((p) => p.user_id === authUser.id)
      const subscription = subscriptions?.find((s) => s.user_id === authUser.id)
      const activity = activityMetrics?.find((a) => a.user_id === authUser.id) || {}
      
      // Calculate revenue metrics from payment_history
      const userPayments = paymentTotals?.filter((p) => p.user_id === authUser.id) || []
      const totalSpent = userPayments.reduce((sum, p) => sum + (p.amount / 100), 0)
      const ltv = totalSpent
      
      // Calculate MRR from subscription tier
      // membership_tiers is a single joined object (many-to-one), not an array
      const tier = subscription?.membership_tiers as {
        name?: string
        tier_type?: string
        price_monthly?: number
        price_yearly?: number
        billing_interval?: string
      } | null
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
        subscription_tier: tier?.name || 'Free',
        subscription_status: subscription?.status || null,
        stripe_customer_id: subscription?.stripe_customer_id || null,
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        // Activity metrics (spread only known fields, not raw DB row)
        engagement_status: (activity as Record<string, unknown>)?.engagement_status || null,
        health_status: (activity as Record<string, unknown>)?.health_status || null,
        custom_tags: (activity as Record<string, unknown>)?.custom_tags || [],
        vision_count: (activity as Record<string, unknown>)?.vision_count || 0,
        journal_entry_count: (activity as Record<string, unknown>)?.journal_entry_count || 0,
        last_login_at: (activity as Record<string, unknown>)?.last_login_at || null,
        days_since_last_login: (activity as Record<string, unknown>)?.days_since_last_login || null,
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
  } catch (error: unknown) {
    console.error('Error in members API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
