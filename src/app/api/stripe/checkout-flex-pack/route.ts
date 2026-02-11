import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createFlexiblePackCheckoutSession } from '@/lib/stripe/customer'
import { getActivePackByKey, PackProductKey } from '@/lib/billing/packs'

const MAX_QUANTITY = 100
const ALLOWED_PRODUCTS: PackProductKey[] = ['tokens', 'storage']

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
    const {
      productKey,
      packKey,
      quantity,
    } = body as {
      productKey: PackProductKey
      packKey: string
      quantity?: number
    }

    if (!productKey || !ALLOWED_PRODUCTS.includes(productKey) || !packKey) {
      return NextResponse.json(
        { error: 'Invalid pack request' },
        { status: 400 }
      )
    }

    const requestedQuantity = Number.isInteger(quantity) ? quantity : 1
    if (requestedQuantity < 1 || requestedQuantity > MAX_QUANTITY) {
      return NextResponse.json(
        { error: 'Invalid quantity' },
        { status: 400 }
      )
    }

    const pack = await getActivePackByKey(productKey, packKey, supabase)
    if (!pack) {
      return NextResponse.json(
        { error: 'Pack not found' },
        { status: 404 }
      )
    }

    if (!user.email) {
      return NextResponse.json(
        { error: 'User email missing' },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const successUrl =
      productKey === 'tokens'
        ? `${appUrl}/dashboard/tokens?purchase=success`
        : `${appUrl}/dashboard/storage?purchase=success`
    const cancelUrl =
      productKey === 'tokens'
        ? `${appUrl}/dashboard/add-tokens?purchase=canceled`
        : `${appUrl}/dashboard/storage?purchase=canceled`

    const session = await createFlexiblePackCheckoutSession({
      userId: user.id,
      email: user.email,
      productKey,
      packKey,
      packName: pack.name,
      packDescription: pack.description,
      unitAmount: pack.unitAmount,
      currency: pack.currency,
      quantity: requestedQuantity,
      stripeProductId: pack.stripeProductId || undefined,
      grantAmount: pack.grantAmount,
      grantUnit: pack.grantUnit,
      successUrl,
      cancelUrl,
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Flexible pack checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
