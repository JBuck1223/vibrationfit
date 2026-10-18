import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { loadPartnerDashboard } from '@/lib/partners/dashboard'

export async function GET(request: NextRequest) {
  try {
    const adminDb = createAdminClient()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const email = request.nextUrl.searchParams.get('email')?.trim()?.toLowerCase()

    if (!user && !email) {
      return NextResponse.json({ error: 'Authentication or email required' }, { status: 401 })
    }

    let participantQuery = adminDb
      .from('referral_participants')
      .select('*')

    if (user) {
      participantQuery = participantQuery.eq('user_id', user.id)
    } else {
      participantQuery = participantQuery.eq('email', email!)
    }

    const { data: participant } = await participantQuery.maybeSingle()

    if (!participant) {
      return NextResponse.json({ error: 'Not enrolled in referral program' }, { status: 404 })
    }

    const { data: invites } = await adminDb
      .from('referral_invites')
      .select('*')
      .eq('participant_id', participant.id)
      .order('sent_at', { ascending: false })
      .limit(50)

    const { data: paidReferralRows } = await adminDb
      .from('referral_events')
      .select('id, referred_email, created_at, metadata')
      .eq('referrer_id', participant.id)
      .eq('event_type', 'paid_conversion')
      .order('created_at', { ascending: false })
      .limit(50)

    // Ledger data only for the signed-in member, never for an email-only lookup
    const partners = user ? await loadPartnerDashboard(adminDb, participant) : null

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vibrationfit.com'

    return NextResponse.json({
      participant,
      referralLink: `${siteUrl}/?ref=${participant.referral_code}`,
      stats: {
        totalClicks: participant.total_clicks,
        emailSignups: participant.email_signups,
        paidConversions: participant.paid_conversions,
        secondDegreeSignups: participant.second_degree_signups,
      },
      invites: invites || [],
      paidReferrals: paidReferralRows || [],
      partners,
    })
  } catch (error) {
    console.error('[referral/dashboard] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
