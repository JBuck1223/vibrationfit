/**
 * Member Context API
 * 
 * GET /api/video/member-context?userId=xxx
 * 
 * Returns comprehensive member data for the host to see during a 1:1 session.
 * Includes: profile, assessment scores, life vision, session history, host notes.
 * 
 * Only accessible by admin/staff users (hosts).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const memberUserId = request.nextUrl.searchParams.get('userId')
    if (!memberUserId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Fetch all member data in parallel
    const [
      profileRes,
      assessmentRes,
      visionRes,
      sessionHistoryRes,
    ] = await Promise.all([
      // 1. Profile
      supabase
        .from('user_accounts')
        .select('id, first_name, last_name, full_name, email, avatar_url, created_at')
        .eq('id', memberUserId)
        .single(),

      // 2. Latest assessment (scores)
      supabase
        .from('assessments')
        .select('id, scores, overall_score, created_at, status')
        .eq('user_id', memberUserId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),

      // 3. Life visions (latest)
      supabase
        .from('life_visions')
        .select('id, title, status, created_at, category_scores')
        .eq('user_id', memberUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),

      // 4. Session history with this host
      supabase
        .from('video_session_participants')
        .select(`
          session_id,
          attended,
          duration_seconds,
          video_sessions!inner(
            id,
            title,
            session_type,
            scheduled_at,
            status,
            host_notes,
            session_summary,
            host_user_id
          )
        `)
        .eq('user_id', memberUserId)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    // Build the context object
    const profile = profileRes.data
    const assessment = assessmentRes.data
    const vision = visionRes.data
    const sessions = sessionHistoryRes.data || []

    // Extract assessment category scores
    let assessmentScores: Record<string, number> | null = null
    if (assessment?.scores && typeof assessment.scores === 'object') {
      assessmentScores = assessment.scores as Record<string, number>
    }

    // Filter sessions to ones hosted by the current user
    const hostSessions = sessions.filter((s: Record<string, unknown>) => {
      const vs = s.video_sessions as Record<string, unknown>
      return vs?.host_user_id === user.id
    })

    // Get the most recent host notes from previous sessions
    const previousNotes = hostSessions
      .map((s: Record<string, unknown>) => {
        const vs = s.video_sessions as Record<string, unknown>
        return {
          date: vs?.scheduled_at as string,
          notes: vs?.host_notes as string | null,
          summary: vs?.session_summary as string | null,
        }
      })
      .filter((n: { notes: string | null; summary: string | null }) => n.notes || n.summary)

    const context = {
      profile: profile ? {
        id: profile.id,
        name: profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        firstName: profile.first_name,
        email: profile.email,
        avatarUrl: profile.avatar_url,
        memberSince: profile.created_at,
      } : null,

      assessment: assessment ? {
        overallScore: assessment.overall_score,
        scores: assessmentScores,
        completedAt: assessment.created_at,
      } : null,

      lifeVision: vision ? {
        title: vision.title,
        status: vision.status,
        categoryScores: vision.category_scores,
      } : null,

      sessionHistory: {
        totalSessions: sessions.length,
        sessionsWithYou: hostSessions.length,
        totalAttended: sessions.filter((s: Record<string, unknown>) => s.attended).length,
        previousNotes,
      },
    }

    return NextResponse.json(context)
  } catch (error) {
    console.error('Error fetching member context:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
