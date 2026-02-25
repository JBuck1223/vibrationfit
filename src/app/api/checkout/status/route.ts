import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

/**
 * Polled after payment success. When the payment_intent.succeeded webhook has
 * created the order and user, we return a magic link so the client can redirect.
 */
export async function GET(request: NextRequest) {
  try {
    const paymentIntentId = request.nextUrl.searchParams.get('payment_intent_id')
    if (!paymentIntentId || !paymentIntentId.startsWith('pi_')) {
      return NextResponse.json({ ready: false, error: 'Invalid payment_intent_id' }, { status: 400 })
    }

    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id, user_id')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .maybeSingle()

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
      options: {
        redirectTo: `${appUrl}/auth/callback?intensive=true`,
      },
    })

    if (linkError || !linkData?.properties?.action_link) {
      console.error('Status: failed to generate magic link', linkError)
      return NextResponse.json({ ready: false }, { status: 500 })
    }

    return NextResponse.json({
      ready: true,
      redirectUrl: linkData.properties.action_link,
    })
  } catch (err) {
    console.error('Checkout status error:', err)
    return NextResponse.json({ ready: false }, { status: 500 })
  }
}
