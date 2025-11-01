// /src/app/api/stripe/checkout-free-intensive/route.ts
// Free Activation Intensive checkout - applies coupon automatically
// Vision Pro still bills in 8 weeks (56 days)

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
    })
  : null

export async function GET(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      )
    }

    // Get promo code and options from URL params
    const searchParams = request.nextUrl.searchParams
    const promoCode = searchParams.get('promo') || 'FREEINTENSIVE' // Default promo code
    const continuityPlan = (searchParams.get('continuity') || 'annual') as 'annual' | '28day'
    const intensivePaymentPlan = (searchParams.get('plan') || 'full') as 'full' | '2pay' | '3pay'

    // Validate promo code exists in Stripe
    try {
      await stripe.coupons.retrieve(promoCode)
    } catch (error) {
      return NextResponse.json(
        { error: `Invalid promo code: ${promoCode}. Please create this coupon in Stripe Dashboard first.` },
        { status: 400 }
      )
    }

    // Get price IDs
    let intensivePriceId: string
    if (intensivePaymentPlan === 'full') {
      intensivePriceId = process.env.STRIPE_PRICE_INTENSIVE_FULL || ''
    } else if (intensivePaymentPlan === '2pay') {
      intensivePriceId = process.env.STRIPE_PRICE_INTENSIVE_2PAY || ''
    } else {
      intensivePriceId = process.env.STRIPE_PRICE_INTENSIVE_3PAY || ''
    }

    if (!intensivePriceId) {
      return NextResponse.json(
        { error: `Intensive ${intensivePaymentPlan} price not configured` },
        { status: 500 }
      )
    }

    const continuityPriceId = continuityPlan === 'annual'
      ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL || ''
      : process.env.NEXT_PUBLIC_STRIPE_PRICE_28DAY || ''

    if (!continuityPriceId) {
      return NextResponse.json(
        { error: 'Vision Pro price not configured' },
        { status: 500 }
      )
    }

    const visionProPlanName = continuityPlan === 'annual' 
      ? 'Vision Pro Annual' 
      : 'Vision Pro 28-Day'
    const visionProPrice = continuityPlan === 'annual' 
      ? '$999/year' 
      : '$99 every 28 days'

    const visionProDisclosure = `**${visionProPlanName} subscription (${visionProPrice})** will automatically begin billing in **8 weeks (56 days)** after your purchase.

You can cancel anytime before the first billing to avoid charges.`

    const sessionMode = intensivePaymentPlan === 'full' ? 'payment' : 'subscription'

    // Create checkout session with promo code applied
    const session = await stripe.checkout.sessions.create({
      mode: sessionMode as 'payment' | 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: intensivePriceId,
        quantity: 1,
      }],
      discounts: [{
        coupon: promoCode,
      }],
      custom_text: {
        submit: {
          message: visionProDisclosure,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/auto-login?session_id={CHECKOUT_SESSION_ID}&email={CHECKOUT_SESSION_CUSTOMER_EMAIL}&continuity_plan=${continuityPlan}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout?cancelled=true`,
      metadata: {
        product_type: 'combined_intensive_continuity',
        purchase_type: 'intensive',
        intensive_payment_plan: intensivePaymentPlan,
        continuity_plan: continuityPlan,
        continuity_price_id: continuityPriceId,
        source: 'free_intensive_link',
        payment_plan: intensivePaymentPlan,
        promo_code: promoCode,
        is_free_intensive: 'true',
      },
      ...(sessionMode === 'subscription' ? {
        subscription_data: {
          metadata: {
            product_type: 'combined_intensive_continuity',
            intensive_payment_plan: intensivePaymentPlan,
            continuity_plan: continuityPlan,
            continuity_price_id: continuityPriceId,
            billing_starts_day: '56',
            promo_code: promoCode,
            is_free_intensive: 'true',
          },
        },
      } : {
        payment_intent_data: {
          metadata: {
            product_type: 'combined_intensive_continuity',
            purchase_type: 'intensive',
            payment_plan: intensivePaymentPlan,
            continuity_plan: continuityPlan,
            continuity_price_id: continuityPriceId,
            billing_starts_day: '56',
            promo_code: promoCode,
            is_free_intensive: 'true',
          },
        },
      }),
    })

    return NextResponse.redirect(session.url || '/checkout?error=session_failed')

  } catch (error) {
    console.error('Free intensive checkout error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorDetails = error instanceof Stripe.errors.StripeError 
      ? { type: error.type, code: error.code, message: error.message }
      : { message: errorMessage }
    
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: errorDetails
      },
      { status: 500 }
    )
  }
}

