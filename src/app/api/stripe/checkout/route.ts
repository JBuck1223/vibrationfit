// /src/app/api/stripe/checkout/route.ts
// Create Stripe checkout session with URL-based promo support

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/stripe/customer'
import { STRIPE_CONFIG } from '@/lib/stripe/config'

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

    const body = await request.json()
    const { priceId, tierType, promoCode, trialDays, referralCode } = body

    if (!priceId || !tierType) {
      return NextResponse.json(
        { error: 'Missing priceId or tierType' },
        { status: 400 }
      )
    }

    // Handle referral code if provided
    let referrerId: string | null = null
    if (referralCode) {
      const { data: referrer } = await supabase
        .from('user_referrals')
        .select('user_id')
        .eq('referral_code', referralCode.toLowerCase())
        .single()

      if (referrer) {
        referrerId = referrer.user_id
        
        // Track referral click
        await supabase
          .from('referral_clicks')
          .insert({
            referrer_id: referrerId,
            referred_user_id: user.id,
            referral_code: referralCode.toLowerCase(),
          })
      }
    }

    // Validate promo code if provided
    if (promoCode) {
      const { validateCoupon } = await import('@/lib/stripe/promotions')
      const validation = await validateCoupon(promoCode)
      
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error || 'Invalid promo code' },
          { status: 400 }
        )
      }
    }

    // Create checkout session
    const session = await createCheckoutSession({
      userId: user.id,
      email: user.email!,
      priceId,
      tierType,
      promoCode,
      trialDays,
      referrerId,
      successUrl: STRIPE_CONFIG.successUrl,
      cancelUrl: STRIPE_CONFIG.cancelUrl,
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })

  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
