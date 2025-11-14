// /src/app/api/stripe/checkout-combined/route.ts
// Combined checkout: $499 Intensive + Vision Pro continuity

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Only initialize Stripe if the secret key is available
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
    })
  : null

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is initialized
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      )
    }

    const { intensivePaymentPlan, continuityPlan, planType, promoCode } = await request.json()

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

    // Validate plan type (defaults to 'solo' for backward compatibility)
    const selectedPlanType = planType || 'solo'
    if (!['solo', 'household'].includes(selectedPlanType)) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      )
    }

    // SOLUTION: Create intensive as one-time payment (clear to customer)
    // Vision Pro subscription will be created separately in webhook after intensive completes
    
    // 1. Intensive Product - Select based on plan type and payment plan
    let intensivePriceId: string | undefined
    let intensiveQuantity = 1

    if (selectedPlanType === 'household') {
      // Household Intensive Prices
      if (intensivePaymentPlan === 'full') {
        // $699 one-time
        intensivePriceId = process.env.STRIPE_PRICE_HOUSEHOLD_INTENSIVE_FULL
        if (!intensivePriceId) {
          return NextResponse.json(
            { error: 'STRIPE_PRICE_HOUSEHOLD_INTENSIVE_FULL not configured' },
            { status: 500 }
          )
        }
      } else if (intensivePaymentPlan === '2pay') {
        // $349.50 × 2 payments
        intensivePriceId = process.env.STRIPE_PRICE_HOUSEHOLD_INTENSIVE_2PAY
        if (!intensivePriceId) {
          return NextResponse.json(
            { error: 'STRIPE_PRICE_HOUSEHOLD_INTENSIVE_2PAY not configured' },
            { status: 500 }
          )
        }
      } else { // 3pay
        // $233 × 3 payments
        intensivePriceId = process.env.STRIPE_PRICE_HOUSEHOLD_INTENSIVE_3PAY
        if (!intensivePriceId) {
          return NextResponse.json(
            { error: 'STRIPE_PRICE_HOUSEHOLD_INTENSIVE_3PAY not configured' },
            { status: 500 }
          )
        }
      }
    } else {
      // Solo Intensive Prices
      if (intensivePaymentPlan === 'full') {
        // $499 one-time
        intensivePriceId = process.env.STRIPE_PRICE_INTENSIVE_FULL
        if (!intensivePriceId) {
          return NextResponse.json(
            { error: 'STRIPE_PRICE_INTENSIVE_FULL not configured' },
            { status: 500 }
          )
        }
      } else if (intensivePaymentPlan === '2pay') {
        // $249.50 × 2 payments
        intensivePriceId = process.env.STRIPE_PRICE_INTENSIVE_2PAY
        if (!intensivePriceId) {
          return NextResponse.json(
            { error: 'STRIPE_PRICE_INTENSIVE_2PAY not configured' },
            { status: 500 }
          )
        }
      } else { // 3pay
        // $166.33 × 3 payments
        intensivePriceId = process.env.STRIPE_PRICE_INTENSIVE_3PAY
        if (!intensivePriceId) {
          return NextResponse.json(
            { error: 'STRIPE_PRICE_INTENSIVE_3PAY not configured' },
            { status: 500 }
          )
        }
      }
    }

    // Get Vision Pro price ID for webhook (stored in metadata)
    let continuityPriceId: string
    if (selectedPlanType === 'household') {
      // Household Vision Pro Prices
      if (continuityPlan === 'annual') {
        // $1,499/year
        continuityPriceId = process.env.STRIPE_PRICE_HOUSEHOLD_ANNUAL || ''
        if (!continuityPriceId) {
          return NextResponse.json(
            { error: 'STRIPE_PRICE_HOUSEHOLD_ANNUAL not configured' },
            { status: 500 }
          )
        }
      } else {
        // $149/28 days
        continuityPriceId = process.env.STRIPE_PRICE_HOUSEHOLD_28DAY || ''
        if (!continuityPriceId) {
          return NextResponse.json(
            { error: 'STRIPE_PRICE_HOUSEHOLD_28DAY not configured' },
            { status: 500 }
          )
        }
      }
    } else {
      // Solo Vision Pro Prices
      if (continuityPlan === 'annual') {
        // $999/year
        continuityPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL || ''
        if (!continuityPriceId) {
          return NextResponse.json(
            { error: 'NEXT_PUBLIC_STRIPE_PRICE_ANNUAL not configured' },
            { status: 500 }
          )
        }
      } else {
        // $99/28 days
        continuityPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_28DAY || ''
        if (!continuityPriceId) {
          return NextResponse.json(
            { error: 'NEXT_PUBLIC_STRIPE_PRICE_28DAY not configured' },
            { status: 500 }
          )
        }
      }
    }

    // CLEAN SOLUTION: Only include Intensive in checkout (charges immediately)
    // Vision Pro will be created separately in webhook with 56-day trial
    // Customer agrees to Vision Pro subscription (shown on your homepage/UI before checkout)
    
    const visionProPlanName = continuityPlan === 'annual' 
      ? 'Vision Pro Annual' 
      : 'Vision Pro 28-Day'
    const visionProPrice = selectedPlanType === 'household'
      ? (continuityPlan === 'annual' ? '$1,499/year' : '$149 every 28 days')
      : (continuityPlan === 'annual' ? '$999/year' : '$99 every 28 days')
    const planTypeText = selectedPlanType === 'household' ? ' (Household - 2 seats)' : ''
    
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price: intensivePriceId,
        quantity: intensiveQuantity,
      },
      // Vision Pro is NOT in checkout - it will be created separately in webhook with 56-day trial
      // Show it as informational note via custom_text and line item description
    ]
    
    // Determine checkout mode based on intensive payment plan
    const sessionMode = intensivePaymentPlan === 'full' ? 'payment' : 'subscription'
    
    // Build Vision Pro subscription disclosure text for checkout
    // Use markdown formatting for emphasis (Stripe supports basic markdown)
    const visionProDisclosure = `**${visionProPlanName}${planTypeText} subscription (${visionProPrice})** will automatically begin billing in **8 weeks (56 days)** after your purchase.

You can cancel anytime before the first billing to avoid charges.`
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: sessionMode as 'payment' | 'subscription',
      payment_method_types: ['card'],
      line_items: lineItems,
      
      // Custom text to show Vision Pro subscription included
      custom_text: {
        submit: {
          message: visionProDisclosure,
        },
      },
      
      // Customer info
      customer_email: undefined, // Let Stripe collect email
      
      // Success/Cancel URLs
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/auto-login?session_id={CHECKOUT_SESSION_ID}&email={CHECKOUT_SESSION_CUSTOMER_EMAIL}&continuity_plan=${continuityPlan}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout?cancelled=true`,
      
      // Metadata for webhook processing
      // Note: Vision Pro information stored in metadata (shown in checkout description via line_items)
      metadata: {
        product_type: 'combined_intensive_continuity',
        purchase_type: 'intensive',
        intensive_payment_plan: intensivePaymentPlan,
        continuity_plan: continuityPlan,
        continuity_price_id: continuityPriceId, // Store for webhook
        plan_type: selectedPlanType, // 'solo' or 'household'
        source: 'combined_checkout',
        payment_plan: intensivePaymentPlan,
        promo_code: promoCode || '', // Store promo code for webhook
        is_free_intensive: promoCode ? 'true' : 'false', // Flag for free intensive
      },
      
      // Apply promo code if provided, otherwise allow manual entry
      ...(promoCode ? {
        discounts: [{
          coupon: promoCode,
        }],
      } : {
        allow_promotion_codes: true,
      }),
      
      // Subscription settings (only for 2pay/3pay plans)
      ...(sessionMode === 'subscription' ? {
        subscription_data: {
          metadata: {
            product_type: 'combined_intensive_continuity',
            intensive_payment_plan: intensivePaymentPlan,
            continuity_plan: continuityPlan,
            continuity_price_id: continuityPriceId,
            billing_starts_day: '56',
          },
          // No trial - Intensive charges immediately
        },
      } : {}),
      
      // For payment mode (full), add payment intent metadata
      ...(sessionMode === 'payment' ? {
        payment_intent_data: {
          metadata: {
            product_type: 'combined_intensive_continuity',
            purchase_type: 'intensive',
            payment_plan: intensivePaymentPlan,
            continuity_plan: continuityPlan,
            continuity_price_id: continuityPriceId,
            billing_starts_day: '56',
          },
        },
      } : {}),
    })

    return NextResponse.json({ url: session.url })

  } catch (error) {
    console.error('Combined checkout error:', error)
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
