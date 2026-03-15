import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkIsAdmin } from '@/middleware/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!await checkIsAdmin(supabase, user)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { userId } = await params
    const adminDb = createAdminClient()

    const [
      accountRes,
      profileRes,
      voiceRes,
      metricsRes,
      badgesRes,
      communityRes,
      storageRes,
      intensiveRes,
      visionsRes,
      tokenBalanceRes,
      recentTokenTxRes,
      ordersRes,
      conversationsRes,
      videoParticipantRes,
      bookingsRes,
      assessmentRes,
      journalCountRes,
      sequenceRes,
      vibePostsRes,
      visionBoardRes,
    ] = await Promise.all([
      adminDb.from('user_accounts').select('*').eq('id', userId).single(),
      adminDb.from('user_profiles').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      adminDb.from('voice_profiles').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      adminDb.from('user_activity_metrics').select('*').eq('user_id', userId).single(),
      adminDb.from('user_badges').select('*').eq('user_id', userId).order('earned_at', { ascending: false }),
      adminDb.from('user_community_stats').select('*').eq('user_id', userId).single(),
      adminDb.from('user_storage').select('*').eq('user_id', userId),
      adminDb.from('intensive_checklist').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      adminDb.from('vision_versions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      adminDb.rpc('get_user_token_balance', { p_user_id: userId }).single(),
      adminDb.from('token_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
      adminDb.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      adminDb.from('conversation_sessions').select('id, title, mode, message_count, category, created_at, updated_at, last_message_at').eq('user_id', userId).order('last_message_at', { ascending: false }).limit(15),
      adminDb.from('video_session_participants').select('*, video_sessions(id, title, session_type, status, scheduled_at, started_at, ended_at, host_notes, session_summary)').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
      adminDb.from('bookings').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      adminDb.from('assessment_results').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      adminDb.from('journal_entries').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
      adminDb.from('sequence_enrollments').select('*, sequences:sequence_id(name, description)').eq('user_id', userId).order('enrolled_at', { ascending: false }),
      adminDb.from('vibe_posts').select('id, content, media_type, hearts_count, comments_count, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
      adminDb.from('vision_board_items').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ])

    const storageTotal = (storageRes.data || []).reduce((sum: number, row: any) => sum + (row.quota_gb || 0), 0)

    const tokenBalance = (tokenBalanceRes.data as { total_active?: number } | null)?.total_active || 0

    const activeProfile = (profileRes.data || []).find((p: any) => p.is_active) || (profileRes.data || [])[0] || null

    return NextResponse.json({
      account: accountRes.data,
      profile: activeProfile,
      allProfiles: profileRes.data || [],
      voiceProfile: (voiceRes.data || []).find((v: any) => v.is_active) || (voiceRes.data || [])[0] || null,
      activityMetrics: metricsRes.data,
      badges: badgesRes.data || [],
      communityStats: communityRes.data,
      storage: {
        total_gb: storageTotal,
        grants: storageRes.data || [],
      },
      intensive: {
        checklists: intensiveRes.data || [],
      },
      visions: visionsRes.data || [],
      tokens: {
        balance: tokenBalance,
        recentTransactions: recentTokenTxRes.data || [],
      },
      orders: ordersRes.data || [],
      conversations: conversationsRes.data || [],
      videoSessions: videoParticipantRes.data || [],
      bookings: bookingsRes.data || [],
      assessments: assessmentRes.data || [],
      journalEntries: journalCountRes.data || [],
      sequenceEnrollments: sequenceRes.data || [],
      communityPosts: vibePostsRes.data || [],
      visionBoard: visionBoardRes.data || [],
    })
  } catch (error) {
    console.error('Error in GET /api/admin/users/[userId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
