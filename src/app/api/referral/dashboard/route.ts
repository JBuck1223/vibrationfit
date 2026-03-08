import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

    const { data: tiers } = await adminDb
      .from('referral_reward_tiers')
      .select('*')
      .eq('is_active', true)
      .order('tier_order', { ascending: true })

    const { data: rewardsEarned } = await adminDb
      .from('referral_rewards_earned')
      .select('*, tier:referral_reward_tiers(*)')
      .eq('participant_id', participant.id)
      .order('created_at', { ascending: false })

    const { data: invites } = await adminDb
      .from('referral_invites')
      .select('*')
      .eq('participant_id', participant.id)
      .order('sent_at', { ascending: false })
      .limit(50)

    let currentTier = null
    let nextTier = null
    if (tiers?.length) {
      for (const tier of tiers) {
        if (
          participant.email_signups >= tier.min_email_signups &&
          participant.paid_conversions >= tier.min_paid_conversions
        ) {
          currentTier = tier
        } else if (!nextTier) {
          nextTier = tier
        }
      }
    }

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
      currentTier,
      nextTier,
      tiers: tiers || [],
      rewardsEarned: rewardsEarned || [],
      invites: invites || [],
    })
  } catch (error) {
    console.error('[referral/dashboard] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
