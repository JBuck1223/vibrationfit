import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveReferralCode } from '@/lib/referral/helpers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const referralCode = body.referralCode?.trim()?.toLowerCase()

    if (!referralCode) {
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 })
    }

    const adminDb = createAdminClient()
    const participant = await resolveReferralCode(adminDb, referralCode)

    if (!participant) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const userAgent = request.headers.get('user-agent') || ''

    await adminDb.from('referral_events').insert({
      referrer_id: participant.id,
      event_type: 'click',
      ip_address: ip,
      user_agent: userAgent,
      metadata: { original_code: referralCode, resolved_code: participant.referral_code },
    })

    const { data: current } = await adminDb
      .from('referral_participants')
      .select('total_clicks')
      .eq('id', participant.id)
      .single()

    await adminDb
      .from('referral_participants')
      .update({ total_clicks: (current?.total_clicks || 0) + 1 })
      .eq('id', participant.id)

    const response = NextResponse.json({
      success: true,
      referrerCode: participant.referral_code,
      referrerName: participant.display_name || null,
    })

    response.cookies.set('vf_ref', participant.referral_code, {
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
    })

    return response
  } catch (error) {
    console.error('[referral/track] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
