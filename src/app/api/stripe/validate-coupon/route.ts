// /src/app/api/stripe/validate-coupon/route.ts
// Validate a coupon code

import { NextRequest, NextResponse } from 'next/server'
import { validateCoupon } from '@/lib/stripe/promotions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Coupon code is required' },
        { status: 400 }
      )
    }

    const result = await validateCoupon(code)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Coupon validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate coupon' },
      { status: 500 }
    )
  }
}

