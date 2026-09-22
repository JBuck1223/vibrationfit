import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendAndLogEmail } from '@/lib/email/send'
import {
  activationCheckoutPath,
  currentSessionUserId,
  isActivationId,
  loadActivationOwner,
} from '@/lib/checkout/activation-handoff'

export async function GET(request: NextRequest) {
  const activationId = request.nextUrl.searchParams.get('activation')
  if (!isActivationId(activationId)) {
    return NextResponse.json({ state: 'invalid' }, { status: 400 })
  }

  const owner = await loadActivationOwner(activationId)
  if (!owner) {
    return NextResponse.json({ state: 'invalid' }, { status: 404 })
  }

  const sessionUserId = await currentSessionUserId()
  if (!sessionUserId) {
    return NextResponse.json({ state: 'signed_out' })
  }
  if (sessionUserId !== owner.userId) {
    return NextResponse.json({ state: 'other_account' })
  }

  return NextResponse.json({
    state: 'signed_in',
    email: owner.email,
    firstName: owner.firstName,
    lastName: owner.lastName,
    phone: owner.phone,
    hasPassword: owner.hasPassword,
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as { activationId?: string }
  if (!isActivationId(body.activationId)) {
    return NextResponse.json({ error: 'Missing Activation' }, { status: 400 })
  }

  const owner = await loadActivationOwner(body.activationId)
  if (!owner) {
    return NextResponse.json({ error: 'Activation not found' }, { status: 404 })
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  const returnTo = activationCheckoutPath(body.activationId)
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
  const { data: linkData, error: linkErr } = await db.auth.admin.generateLink({
    type: 'magiclink',
    email: owner.email,
  })
  const tokenHash = linkData?.properties?.hashed_token
  if (linkErr || !tokenHash) {
    console.error('[activation-handoff] generateLink failed:', linkErr)
    return NextResponse.json({ error: 'Could not email the link' }, { status: 500 })
  }

  const checkoutUrl = `${origin}/auth/callback?token_hash=${tokenHash}&type=magiclink&returnTo=${encodeURIComponent(returnTo)}`
  const firstName = (owner.firstName.trim() || 'there').replace(/[<>&]/g, '')
  const subject = 'Sign in to keep this Activation'
  const textBody = [
    `Hi ${firstName},`,
    '',
    'Vision Pro is added to the account that just finished this Activation.',
    'Open this link on any device. You will land in checkout, signed into this Activation, ready to add your card.',
    '',
    checkoutUrl,
  ].join('\n')
  const htmlBody = `
    <div style="background:#000;padding:32px 16px;font-family:system-ui,sans-serif;color:#fff;">
      <div style="max-width:520px;margin:0 auto;">
        <h1 style="font-size:24px;line-height:1.3;margin:0 0 16px;">Sign in to keep this Activation</h1>
        <p style="font-size:16px;line-height:1.6;color:#d4d4d4;margin:0 0 12px;">Hi ${firstName},</p>
        <p style="font-size:16px;line-height:1.6;color:#d4d4d4;margin:0 0 12px;">Vision Pro is added to the account that just finished this Activation.</p>
        <p style="font-size:16px;line-height:1.6;color:#d4d4d4;margin:0 0 24px;">Open this link on any device. You will land in checkout, signed into this Activation, ready to add your card.</p>
        <a href="${checkoutUrl}" style="display:inline-block;background:#39FF14;color:#000;font-weight:700;text-decoration:none;border-radius:999px;padding:12px 20px;">Open checkout</a>
      </div>
    </div>
  `

  try {
    await sendAndLogEmail({
      to: owner.email,
      subject,
      htmlBody,
      textBody,
      context: { userId: owner.userId, guestEmail: owner.email },
    })
  } catch (error) {
    console.error('[activation-handoff] email failed:', error)
    return NextResponse.json({ error: 'Could not email the link' }, { status: 500 })
  }

  return NextResponse.json({ sent: true })
}
