import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient as createServiceClient } from '@supabase/supabase-js'

async function verifyAdmin() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set() {},
        remove() {},
      },
    },
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { error: 'Authentication required', status: 401 }

  const adminEmails = ['buckinghambliss@gmail.com']
  const isAdmin = adminEmails.includes(user.email || '') || user.user_metadata?.is_admin
  if (!isAdmin) return { error: 'Admin access required', status: 403 }

  return { user }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyAdmin()
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
