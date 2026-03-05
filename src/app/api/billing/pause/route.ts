import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

    const body = await request.json().catch(() => ({}))
    const months = Math.min(Math.max(body.months || 1, 1), 3)
    const resumeDate = new Date()
    resumeDate.setMonth(resumeDate.getMonth() + months)

    const { data: subscription } = await supabase
      .from('customer_subscriptions')
      .select('id, stripe_subscription_id, status')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .not('stripe_subscription_id', 'is', null)
      .limit(1)
      .maybeSingle()

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
    }

    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      pause_collection: {
        behavior: 'keep_as_draft',
        resumes_at: Math.floor(resumeDate.getTime() / 1000),
      },
    })

    return NextResponse.json({
      success: true,
      resumesAt: resumeDate.toISOString(),
      months,
    })
  } catch (error) {
    console.error('Pause subscription error:', error)
    return NextResponse.json({ error: 'Failed to pause subscription' }, { status: 500 })
  }
}
