// /src/app/api/stripe/portal/route.ts
// Create Stripe customer portal session

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPortalSession } from '@/lib/stripe/customer'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's Stripe customer ID
    const { data: subscription } = await supabase
      .from('customer_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { returnUrl } = body

    // Create portal session
    const session = await createPortalSession(
      subscription.stripe_customer_id,
      returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    )

    return NextResponse.json({ url: session.url })

  } catch (error) {
    console.error('Portal error:', error)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}

