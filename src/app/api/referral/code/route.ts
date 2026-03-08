import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isValidReferralCode } from '@/lib/referral/helpers'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const newCode = body.newCode?.trim()?.toLowerCase()

    if (!newCode) {
      return NextResponse.json({ error: 'New code is required' }, { status: 400 })
    }

    const validation = isValidReferralCode(newCode)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const adminDb = createAdminClient()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const email = body.email?.trim()?.toLowerCase()

    if (!user && !email) {
      return NextResponse.json({ error: 'Authentication or email required' }, { status: 401 })
    }

    let participantQuery = adminDb.from('referral_participants').select('id, referral_code')
    if (user) {
      participantQuery = participantQuery.eq('user_id', user.id)
    } else {
      participantQuery = participantQuery.eq('email', email!)
    }

    const { data: participant } = await participantQuery.maybeSingle()
    if (!participant) {
      return NextResponse.json({ error: 'Not enrolled in referral program' }, { status: 404 })
    }

    if (participant.referral_code === newCode) {
      return NextResponse.json({ error: 'New code is the same as current code' }, { status: 400 })
    }

    const { data: codeTaken } = await adminDb
      .from('referral_participants')
      .select('id')
      .eq('referral_code', newCode)
      .maybeSingle()

    if (codeTaken) {
      return NextResponse.json({ error: 'This code is already taken' }, { status: 409 })
    }

    const { data: historyTaken } = await adminDb
      .from('referral_code_history')
      .select('id')
      .eq('old_code', newCode)
      .maybeSingle()

    if (historyTaken) {
      return NextResponse.json({ error: 'This code is already taken' }, { status: 409 })
    }

    await adminDb.from('referral_code_history').insert({
      participant_id: participant.id,
      old_code: participant.referral_code,
    })

    const { error: updateError } = await adminDb
      .from('referral_participants')
      .update({ referral_code: newCode })
      .eq('id', participant.id)

    if (updateError) {
      console.error('[referral/code] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update code' }, { status: 500 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vibrationfit.com'
    return NextResponse.json({
      referralCode: newCode,
      referralLink: `${siteUrl}/?ref=${newCode}`,
      previousCode: participant.referral_code,
    })
  } catch (error) {
    console.error('[referral/code] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
