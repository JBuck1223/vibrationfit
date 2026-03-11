import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { generateBulkCodes } from '@/lib/billing/coupons'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id: couponId } = await params
  const body = await request.json()
  const { count, prefix, batchId } = body as {
    count: number
    prefix?: string
    batchId?: string
  }

  if (!count || count < 1 || count > 10000) {
    return NextResponse.json({ error: 'Count must be between 1 and 10,000' }, { status: 400 })
  }

  try {
    const result = await generateBulkCodes({
      couponId,
      count,
      prefix,
      batchId,
    })

    return NextResponse.json({
      success: true,
      batchId: result.batchId,
      codesGenerated: result.codes.length,
      sampleCodes: result.codes.slice(0, 10),
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate codes' }, { status: 500 })
  }
}
