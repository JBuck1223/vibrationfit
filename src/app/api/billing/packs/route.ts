import { NextRequest, NextResponse } from 'next/server'
import { listActivePacks, PackProductKey } from '@/lib/billing/packs'

const ALLOWED_PRODUCTS: PackProductKey[] = ['tokens', 'storage']

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productKey = searchParams.get('product') as PackProductKey | null

    if (!productKey || !ALLOWED_PRODUCTS.includes(productKey)) {
      return NextResponse.json(
        { error: 'Invalid product key' },
        { status: 400 }
      )
    }

    const packs = await listActivePacks(productKey)

    return NextResponse.json({
      productKey,
      packs: packs.map((pack) => ({
        packKey: pack.packKey,
        name: pack.name,
        description: pack.description,
        unitAmount: pack.unitAmount,
        currency: pack.currency,
        grantAmount: pack.grantAmount,
        grantUnit: pack.grantUnit,
        highlights: pack.highlights,
        isPopular: pack.isPopular,
      })),
    })
  } catch (error) {
    console.error('Pack list error:', error)
    return NextResponse.json(
      { error: 'Failed to load packs' },
      { status: 500 }
    )
  }
}
