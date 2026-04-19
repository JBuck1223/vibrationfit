import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkIsAdmin } from '@/middleware/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!await checkIsAdmin(supabase, user)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const adminDb = createAdminClient()

    const [
      { data: participants },
      { data: invites },
      { data: tiers },
      { data: rewardsEarned },
      { data: recentEvents },
    ] = await Promise.all([
      adminDb
        .from('referral_participants')
        .select('*')
        .order('paid_conversions', { ascending: false }),
      adminDb
        .from('referral_invites')
        .select('*, participant:referral_participants(display_name, email, referral_code)')
        .order('sent_at', { ascending: false })
        .limit(100),
      adminDb
        .from('referral_reward_tiers')
        .select('*')
        .order('tier_order', { ascending: true }),
      adminDb
        .from('referral_rewards_earned')
        .select('*, participant:referral_participants(display_name, email), tier:referral_reward_tiers(tier_name)')
        .order('created_at', { ascending: false }),
      adminDb
        .from('referral_events')
        .select('*, referrer:referral_participants!referrer_id(display_name, email, referral_code)')
        .order('created_at', { ascending: false })
        .limit(50),
    ])

    const allParticipants = participants || []
    const totalClicks = allParticipants.reduce((sum, p) => sum + (p.total_clicks || 0), 0)
    const totalSignups = allParticipants.reduce((sum, p) => sum + (p.email_signups || 0), 0)
    const totalConversions = allParticipants.reduce((sum, p) => sum + (p.paid_conversions || 0), 0)
    const activeParticipants = allParticipants.filter(p => (p.total_clicks || 0) > 0).length

    return NextResponse.json({
      stats: {
        totalParticipants: allParticipants.length,
        activeParticipants,
        totalClicks,
        totalSignups,
        totalConversions,
      },
      participants: allParticipants,
      invites: invites || [],
      tiers: tiers || [],
      rewardsEarned: rewardsEarned || [],
      recentEvents: recentEvents || [],
    })
  } catch (error) {
    console.error('[admin/referrals] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
