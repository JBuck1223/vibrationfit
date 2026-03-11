import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { verifyAdminAccess } from '@/lib/supabase/admin'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id: couponId } = await params

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: redemptions, error } = await admin
    .from('coupon_redemptions')
    .select(`
      *,
      code:coupon_codes(code),
      user:auth.users(email)
    `)
    .eq('coupon_id', couponId)
    .order('redeemed_at', { ascending: false })
    .limit(100)

  if (error) {
    // Fallback without the auth.users join (may not be accessible)
    const { data: fallback } = await admin
      .from('coupon_redemptions')
      .select(`
        *,
        code:coupon_codes(code)
      `)
      .eq('coupon_id', couponId)
      .order('redeemed_at', { ascending: false })
      .limit(100)

    return NextResponse.json({ redemptions: fallback || [] })
  }

  return NextResponse.json({ redemptions: redemptions || [] })
}
