// /src/app/api/billing/subscription/route.ts
// Fetch user's current subscription

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch active subscription with tier details
    const { data: subscription, error } = await supabase
      .from('customer_subscriptions')
      .select(`
        *,
        tier:membership_tiers(*)
      `)
      .eq('user_id', user.id)
      .or('status.eq.active,status.eq.trialing')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error fetching subscription:', error)
      return NextResponse.json(
        { error: 'Failed to fetch subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({ subscription: subscription || null })

  } catch (error) {
    console.error('Subscription API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

