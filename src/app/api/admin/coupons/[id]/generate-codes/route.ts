import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { generateBulkCodes } from '@/lib/billing/coupons'

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyAdmin()
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
