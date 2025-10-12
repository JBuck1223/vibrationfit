// /src/app/api/stripe/checkout-token-pack/route.ts
// Create Stripe checkout session for one-time token pack purchases

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createTokenPackCheckoutSession } from '@/lib/stripe/customer'

const TOKEN_PACKS = {
  power: {
    priceId: process.env.STRIPE_PRICE_TOKEN_POWER,
    tokens: 2_000_000,
    name: 'Power Pack',
  },
  mega: {
    priceId: process.env.STRIPE_PRICE_TOKEN_MEGA,
    tokens: 5_000_000,
    name: 'Mega Pack',
  },
  ultra: {
    priceId: process.env.STRIPE_PRICE_TOKEN_ULTRA,
    tokens: 12_000_000,
    name: 'Ultra Pack',
  },
} as const

type PackId = keyof typeof TOKEN_PACKS

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
    const { packId } = body as { packId: PackId }

    if (!packId || !(packId in TOKEN_PACKS)) {
      return NextResponse.json(
        { error: 'Invalid pack ID' },
        { status: 400 }
      )
    }

    const pack = TOKEN_PACKS[packId]

    if (!pack.priceId) {
      return NextResponse.json(
        { error: `${pack.name} is not configured. Missing STRIPE_PRICE_TOKEN_${packId.toUpperCase()} environment variable.` },
        { status: 500 }
      )
    }

    // Create checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const session = await createTokenPackCheckoutSession({
      userId: user.id,
      email: user.email!,
      priceId: pack.priceId,
      packId,
      tokensAmount: pack.tokens,
      successUrl: `${appUrl}/dashboard/tokens?purchase=success`,
      cancelUrl: `${appUrl}/dashboard/add-tokens?purchase=canceled`,
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })

  } catch (error) {
    console.error('Token pack checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

