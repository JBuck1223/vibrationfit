import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

/**
 * Polled after payment success. Looks up the order by payment_intent_id or
 * order_id, then generates a magic link token and redirects through the
 * client-side /auth/verify page to establish the session in the browser.
 */
export async function GET(request: NextRequest) {
  try {
    const paymentIntentId = request.nextUrl.searchParams.get('payment_intent_id')
    const orderId = request.nextUrl.searchParams.get('order_id')

    if (!paymentIntentId && !orderId) {
      return NextResponse.json({ ready: false, error: 'Missing payment_intent_id or order_id' }, { status: 400 })
    }

    let order: { id: string; user_id: string; status: string } | null = null

    if (orderId) {
      const { data } = await supabaseAdmin
        .from('orders')
        .select('id, user_id, status')
        .eq('id', orderId)
        .maybeSingle()
      order = data
    } else if (paymentIntentId) {
      const { data } = await supabaseAdmin
        .from('orders')
        .select('id, user_id, status')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .maybeSingle()
      order = data
    }

    if (!order?.user_id) {
      return NextResponse.json({ ready: false })
    }

    const { data: user } = await supabaseAdmin.auth.admin.getUserById(order.user_id)
    const email = user?.user?.email
    if (!email) {
      return NextResponse.json({ ready: false })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })

    if (linkError || !linkData?.properties?.action_link) {
      console.error('Status: failed to generate magic link', linkError)
      return NextResponse.json({ ready: false }, { status: 500 })
    }

    const actionUrl = new URL(linkData.properties.action_link)
    const token = actionUrl.searchParams.get('token')
    const type = actionUrl.searchParams.get('type')

    if (!token || !type) {
      console.error('Status: no token found in magic link')
      return NextResponse.json({ ready: false }, { status: 500 })
    }

    // Check if user has an active intensive to pass the correct param
    const { data: checklist } = await supabaseAdmin
      .from('intensive_checklist')
      .select('id')
      .eq('user_id', order.user_id)
      .in('status', ['pending', 'in_progress'])
      .maybeSingle()

    const verifyUrl = new URL('/auth/verify', appUrl)
    verifyUrl.searchParams.set('token_hash', token)
    verifyUrl.searchParams.set('type', type)
    if (checklist) {
      verifyUrl.searchParams.set('intensive', 'true')
    }

    return NextResponse.json({
      ready: true,
      redirectUrl: verifyUrl.toString(),
    })
  } catch (err) {
    console.error('Checkout status error:', err)
    return NextResponse.json({ ready: false }, { status: 500 })
  }
}
