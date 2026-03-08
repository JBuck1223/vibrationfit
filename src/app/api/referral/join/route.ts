import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateUniqueCode } from '@/lib/referral/helpers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const adminDb = createAdminClient()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let email: string
    let displayName: string | null = null
    let userId: string | null = null
    let codeSeed: string

    if (user) {
      email = user.email!
      userId = user.id

      const { data: account } = await adminDb
        .from('user_accounts')
        .select('first_name, last_name')
        .eq('id', user.id)
        .maybeSingle()

      displayName = account?.first_name || null
      codeSeed = account?.first_name || email.split('@')[0]
    } else {
      email = body.email?.trim()?.toLowerCase()
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
      }
      codeSeed = email.split('@')[0]
    }

    const { data: existing } = await adminDb
      .from('referral_participants')
      .select('id, referral_code, user_id, display_name, email_signups, paid_conversions, total_clicks')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      if (userId && !existing.user_id) {
        await adminDb
          .from('referral_participants')
          .update({ user_id: userId, display_name: displayName || existing.display_name })
          .eq('id', existing.id)
      }

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vibrationfit.com'
      return NextResponse.json({
        referralCode: existing.referral_code,
        referralLink: `${siteUrl}/?ref=${existing.referral_code}`,
        participant: existing,
        isExisting: true,
      })
    }

    const referralCode = await generateUniqueCode(adminDb, codeSeed)

    const refCookie = request.cookies.get('vf_ref')?.value
    let referredByParticipantId: string | null = null
    if (refCookie) {
      const { data: referrer } = await adminDb
        .from('referral_participants')
        .select('id')
        .eq('referral_code', refCookie)
        .maybeSingle()
      if (referrer) {
        referredByParticipantId = referrer.id
      }
    }

    const { data: participant, error: insertError } = await adminDb
      .from('referral_participants')
      .insert({
        user_id: userId,
        email,
        referral_code: referralCode,
        display_name: displayName || codeSeed,
        referred_by_participant_id: referredByParticipantId,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[referral/join] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to join referral program' }, { status: 500 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vibrationfit.com'
    return NextResponse.json({
      referralCode: participant.referral_code,
      referralLink: `${siteUrl}/?ref=${participant.referral_code}`,
      participant,
      isExisting: false,
    })
  } catch (error) {
    console.error('[referral/join] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
