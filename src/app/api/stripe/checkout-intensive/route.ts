// /src/app/api/stripe/checkout-intensive/route.ts
// Create Stripe checkout for $499 Vision Activation Intensive

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createIntensiveCheckoutSession } from '@/lib/stripe/customer'
import { STRIPE_CONFIG } from '@/lib/stripe/config'

export async function POST(request: NextRequest) {
  try {
    // Allow guest checkout - no authentication required
    const supabase = await createClient()
    let user = null
    
    // Try to get user if logged in, but don't require it
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      user = currentUser
    } catch (error) {
      // User not logged in - that's fine for guest checkout
      console.log('Guest checkout - no user session')
    }

    const body = await request.json()
    const { paymentPlan, continuityPlan } = body as {
      paymentPlan: 'full' | '2pay' | '3pay'
      continuityPlan?: 'annual' | '28day'
    }

    if (!paymentPlan) {
      return NextResponse.json(
        { error: 'Missing payment plan' },
        { status: 400 }
      )
    }

    // Get the appropriate price ID
    console.log('Environment check:', {
      intensive_full: process.env.STRIPE_PRICE_INTENSIVE_FULL,
      intensive_2pay: process.env.STRIPE_PRICE_INTENSIVE_2PAY,
      intensive_3pay: process.env.STRIPE_PRICE_INTENSIVE_3PAY,
      config_full: STRIPE_CONFIG.prices.intensive_full,
    })

    const priceIds = {
      full: STRIPE_CONFIG.prices.intensive_full,
      '2pay': STRIPE_CONFIG.prices.intensive_2pay,
      '3pay': STRIPE_CONFIG.prices.intensive_3pay,
    }

    const priceId = priceIds[paymentPlan]

    if (!priceId) {
      return NextResponse.json(
        { error: `Intensive ${paymentPlan} plan is not configured. Missing STRIPE_PRICE_INTENSIVE_${paymentPlan.toUpperCase()} environment variable.` },
        { status: 500 }
      )
    }

    // Create checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const session = await createIntensiveCheckoutSession({
      userId: user?.id || null, // Allow null for guest checkout
      email: user?.email || 'guest@example.com', // Will be updated by Stripe
      priceId,
      paymentPlan,
      continuityPlan: continuityPlan || 'annual', // Default to annual
      successUrl: `${appUrl}/auth/auto-login?session_id={CHECKOUT_SESSION_ID}&email={CHECKOUT_SESSION_CUSTOMER_EMAIL}`,
      cancelUrl: `${appUrl}/pricing-hormozi`,
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })

  } catch (error) {
    console.error('Intensive checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

