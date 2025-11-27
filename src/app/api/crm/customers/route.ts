// /src/app/api/crm/customers/route.ts
// Customer management API

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Get all users with their profiles
    let query = supabase
      .from('user_profiles')
      .select(`
        user_id,
        email,
        full_name,
        phone,
        subscription_tier,
        created_at
      `)
      .order('created_at', { ascending: false })

    const { data: profiles, error: profilesError } = await query

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError)
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
    }

    // Get activity metrics for all users
    const { data: activityMetrics } = await supabase
      .from('user_activity_metrics')
      .select('*')

    // Get revenue metrics for all users
    const { data: revenueMetrics } = await supabase
      .from('user_revenue_metrics')
      .select('*')

    // Combine the data
    const customers = profiles.map((profile) => {
      const activity = activityMetrics?.find((a) => a.user_id === profile.user_id) || {}
      const revenue = revenueMetrics?.find((r) => r.user_id === profile.user_id) || {}

      return {
        ...profile,
        ...activity,
        ...revenue,
      }
    })

    // Apply filters
    let filteredCustomers = customers

    if (engagementStatus) {
      filteredCustomers = filteredCustomers.filter(
        (c) => c.engagement_status === engagementStatus
      )
    }

    if (healthStatus) {
      filteredCustomers = filteredCustomers.filter((c) => c.health_status === healthStatus)
    }

    return NextResponse.json({ customers: filteredCustomers })
  } catch (error: any) {
    console.error('❌ Error in customers API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

