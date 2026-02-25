import { NextRequest, NextResponse } from 'next/server'
import { validateCouponCode } from '@/lib/billing/coupons'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, productKey, purchaseAmount } = body as {
      code: string
      productKey?: string
      purchaseAmount?: number
    }

    if (!code || !code.trim()) {
      return NextResponse.json({ valid: false, error: 'Coupon code is required' }, { status: 400 })
    }

    const result = await validateCouponCode(code, { productKey, purchaseAmount })

    if (!result.valid) {
      return NextResponse.json({
        valid: false,
        error: result.error,
      })
    }

    return NextResponse.json({
      valid: true,
      name: result.name,
      discountType: result.discountType,
      discountValue: result.discountValue,
      discountAmount: result.discountAmount,
      percent_off: result.discountType === 'percent' ? result.discountValue : undefined,
      amount_off: result.discountType === 'fixed' ? result.discountValue : undefined,
    })
  } catch (error) {
    console.error('Coupon validation error:', error)
    return NextResponse.json({ valid: false, error: 'Failed to validate coupon' }, { status: 500 })
  }
}
