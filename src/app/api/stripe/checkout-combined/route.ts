// /src/app/api/stripe/checkout-combined/route.ts
// Combined checkout: $499 Intensive + Vision Pro continuity

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
})

export async function POST(request: NextRequest) {
  try {
    const { intensivePaymentPlan, continuityPlan } = await request.json()

    // Validate inputs
    if (!intensivePaymentPlan || !continuityPlan) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    if (!['full', '2pay', '3pay'].includes(intensivePaymentPlan)) {
      return NextResponse.json(
        { error: 'Invalid intensive payment plan' },
        { status: 400 }
      )
    }

    if (!['annual', '28day'].includes(continuityPlan)) {
      return NextResponse.json(
        { error: 'Invalid continuity plan' },
        { status: 400 }
      )
    }

    // Create line items for both products
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []

    // 1. Intensive Product
    let intensivePriceId: string
    let intensiveQuantity = 1

    if (intensivePaymentPlan === 'full') {
      // One-time payment of $499
      intensivePriceId = process.env.STRIPE_PRICE_INTENSIVE_FULL!
    } else if (intensivePaymentPlan === '2pay') {
      // $249.50 × 2 payments
      intensivePriceId = process.env.STRIPE_PRICE_INTENSIVE_2PAY!
    } else { // 3pay
      // $166.33 × 3 payments  
      intensivePriceId = process.env.STRIPE_PRICE_INTENSIVE_3PAY!
    }

    lineItems.push({
      price: intensivePriceId,
      quantity: intensiveQuantity,
    })

    // 2. Continuity Product
    let continuityPriceId: string

    if (continuityPlan === 'annual') {
      // Vision Pro Annual: $999/year
      continuityPriceId = process.env.STRIPE_PRICE_VISION_PRO_ANNUAL!
    } else {
      // Vision Pro 28-Day: $99 every 28 days
      continuityPriceId = process.env.STRIPE_PRICE_VISION_PRO_28DAY!
    }

    lineItems.push({
      price: continuityPriceId,
      quantity: 1,
    })

    // Create checkout session with delayed billing start
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription', // This handles both one-time and recurring items
      payment_method_types: ['card'],
      line_items: lineItems,
      
      // Customer info
      customer_email: undefined, // Let Stripe collect email
      
      // Success/Cancel URLs
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/auto-login?session_id={CHECKOUT_SESSION_ID}&email={CHECKOUT_SESSION_CUSTOMER_EMAIL}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?cancelled=true`,
      
      // Metadata for webhook processing
      metadata: {
        product_type: 'combined_intensive_continuity',
        intensive_payment_plan: intensivePaymentPlan,
        continuity_plan: continuityPlan,
        source: 'combined_checkout',
      },
      
      // Allow promotion codes
      allow_promotion_codes: true,
      
      // Subscription settings for continuity with delayed start
      subscription_data: {
        // Start billing after 8 weeks (56 days)
        billing_cycle_anchor: Math.floor(Date.now() / 1000) + (56 * 24 * 60 * 60), // 56 days from now
        metadata: {
          product_type: 'vision_pro_continuity',
          tier_type: continuityPlan === 'annual' ? 'vision_pro_annual' : 'vision_pro_28day',
          intensive_payment_plan: intensivePaymentPlan,
          billing_starts_day: '56',
        },
      },
      
      // Payment intent metadata for intensive
      payment_intent_data: {
        metadata: {
          product_type: 'intensive',
          payment_plan: intensivePaymentPlan,
          continuity_plan: continuityPlan,
        },
      },
    })

    return NextResponse.json({ url: session.url })

  } catch (error) {
    console.error('Combined checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
