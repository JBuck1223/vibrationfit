/**
 * Admin Retention Metrics API
 * 
 * GET /api/admin/retention-metrics/[userId]
 * 
 * Returns detailed retention metrics breakdown for a specific user.
 * Includes per-activity-type counts and recent item timelines.
 * 
 * Requires admin authentication.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkIsAdmin } from '@/middleware/admin'

interface DetailedRetentionMetrics {
  creations: {
    recent: number
    lifetime: number
    breakdown: {
      visions: { recent: number; lifetime: number }
      audios: { recent: number; lifetime: number }
      board_items: { recent: number; lifetime: number }
      journals: { recent: number; lifetime: number }
      daily_papers: { recent: number; lifetime: number }
      abundance: { recent: number; lifetime: number }
    }
    recentItems: Array<{
      type: string
      title: string
      created_at: string
    }>
  }
  activations: {
    recent: number
    lifetime: number
    totalAudioPlays: number
    breakdown: {
      audio_plays: { recent: number; lifetime: number }
      journals: { recent: number; lifetime: number }
      daily_papers: { recent: number; lifetime: number }
      abundance: { recent: number; lifetime: number }
      board_actions: { recent: number; lifetime: number }
      gym_sessions: { recent: number; lifetime: number }
      tribe_posts: { recent: number; lifetime: number }
    }
    recentAudioPlays: Array<{
      track_id: string
      audio_set_name: string
      section_key: string
      play_count: number
      content_type: string
      text_snippet: string
    }>
  }
  connections: {
    recent: number
    lifetime: number
    needsNudge: boolean
    breakdown: {
      posts: { recent: number; lifetime: number }
      comments: { recent: number; lifetime: number }
      hearts: { recent: number; lifetime: number }
    }
    recentPosts: Array<{
      content: string
      vibe_tag: string
      created_at: string
    }>
  }
  sessions: {
    recent: number
    target: number
    lifetime: number
    recentSessions: Array<{
      title: string
      attended_at: string
    }>
    nextEvent?: {
      title: string
      scheduledAt: string
    }
  }
  calculatedAt: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await createClient()

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if admin
    if (!await checkIsAdmin(supabase, user)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { userId } = await params
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Use service role client for admin queries (bypasses RLS)
    const adminDb = createAdminClient()

    const now = new Date()
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Execute all queries in parallel
    const [creations, activations, connections, sessions] = await Promise.all([
      getDetailedCreations(adminDb, userId, thirtyDaysAgo),
      getDetailedActivations(adminDb, userId, thirtyDaysAgo),
      getDetailedConnections(adminDb, userId, oneWeekAgo),
      getDetailedSessions(adminDb, userId, fourWeeksAgo),
    ])

    const metrics: DetailedRetentionMetrics = {
      creations,
      activations,
      connections,
      sessions,
      calculatedAt: now.toISOString(),
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Error calculating admin retention metrics:', error)
    return NextResponse.json(
      { error: 'Failed to calculate retention metrics' },
      { status: 500 }
    )
  }
}

// ============================================================================
// Creations - Detailed Breakdown
// ============================================================================

async function getDetailedCreations(
  db: ReturnType<typeof createAdminClient>,
  userId: string,
  thirtyDaysAgo: Date
) {
  const [
    visionsRecent, visionsLifetime,
    audiosRecent, audiosLifetime,
    boardRecent, boardLifetime,
    journalRecent, journalLifetime,
    dailyPapersRecent, dailyPapersLifetime,
    abundanceRecent, abundanceLifetime,
    recentItems,
  ] = await Promise.all([
    db.from('vision_versions').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).gte('created_at', thirtyDaysAgo.toISOString())
      .then(r => r.count || 0),
    db.from('vision_versions').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).then(r => r.count || 0),

    db.from('audio_sets').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).gte('created_at', thirtyDaysAgo.toISOString())
      .then(r => r.count || 0),
    db.from('audio_sets').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).then(r => r.count || 0),

    db.from('vision_board_items').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).gte('created_at', thirtyDaysAgo.toISOString())
      .then(r => r.count || 0),
    db.from('vision_board_items').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).then(r => r.count || 0),

    db.from('journal_entries').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).gte('created_at', thirtyDaysAgo.toISOString())
      .then(r => r.count || 0),
    db.from('journal_entries').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).then(r => r.count || 0),

    db.from('daily_papers').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).gte('created_at', thirtyDaysAgo.toISOString())
      .then(r => r.count || 0),
    db.from('daily_papers').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).then(r => r.count || 0),

    db.from('abundance_events').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).gte('created_at', thirtyDaysAgo.toISOString())
      .then(r => r.count || 0),
    db.from('abundance_events').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).then(r => r.count || 0),

    // Recent items timeline - union across all creation tables
    getRecentCreationItems(db, userId),
  ])

  return {
    recent: visionsRecent + audiosRecent + boardRecent + journalRecent + dailyPapersRecent + abundanceRecent,
    lifetime: visionsLifetime + audiosLifetime + boardLifetime + journalLifetime + dailyPapersLifetime + abundanceLifetime,
    breakdown: {
      visions: { recent: visionsRecent, lifetime: visionsLifetime },
      audios: { recent: audiosRecent, lifetime: audiosLifetime },
      board_items: { recent: boardRecent, lifetime: boardLifetime },
      journals: { recent: journalRecent, lifetime: journalLifetime },
      daily_papers: { recent: dailyPapersRecent, lifetime: dailyPapersLifetime },
      abundance: { recent: abundanceRecent, lifetime: abundanceLifetime },
    },
    recentItems,
  }
}

async function getRecentCreationItems(
  db: ReturnType<typeof createAdminClient>,
  userId: string
) {
  const [visions, audios, boards, journals, papers, abundance] = await Promise.all([
    db.from('vision_versions')
      .select('title, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(r => (r.data || []).map(d => ({ type: 'vision', title: d.title || 'Life Vision', created_at: d.created_at }))),

    db.from('audio_sets')
      .select('name, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(r => (r.data || []).map(d => ({ type: 'audio', title: d.name || 'Audio Set', created_at: d.created_at }))),

    db.from('vision_board_items')
      .select('name, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(r => (r.data || []).map(d => ({ type: 'board', title: d.name || 'Board Item', created_at: d.created_at }))),

    db.from('journal_entries')
      .select('title, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(r => (r.data || []).map(d => ({ type: 'journal', title: d.title || 'Journal Entry', created_at: d.created_at }))),

    db.from('daily_papers')
      .select('entry_date, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(r => (r.data || []).map(d => ({ type: 'daily_paper', title: `Daily Paper - ${d.entry_date}`, created_at: d.created_at }))),

    db.from('abundance_events')
      .select('note, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(r => (r.data || []).map(d => ({
        type: 'abundance',
        title: (d.note || 'Abundance Entry').substring(0, 60) + ((d.note || '').length > 60 ? '...' : ''),
        created_at: d.created_at,
      }))),
  ])

  // Merge and sort by date, take top 20
  return [...visions, ...audios, ...boards, ...journals, ...papers, ...abundance]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20)
}

// ============================================================================
// Activations - Detailed Breakdown
// ============================================================================

async function getDetailedActivations(
  db: ReturnType<typeof createAdminClient>,
  userId: string,
  thirtyDaysAgo: Date
) {
  const [
    audioPlaysRecentData, audioPlaysLifetime,
    journalRecent, journalLifetime,
    dailyPaperRecent, dailyPaperLifetime,
    abundanceRecent, abundanceLifetime,
    boardRecent, boardLifetime,
    gymRecent, gymLifetime,
    postsRecent, postsLifetime,
    recentAudioPlays,
  ] = await Promise.all([
    // Audio plays recent
    db.from('audio_tracks')
      .select('play_count')
      .eq('user_id', userId)
      .gt('play_count', 0)
      .gte('updated_at', thirtyDaysAgo.toISOString())
      .then(r => r.data?.reduce((sum, t) => sum + (t.play_count || 0), 0) || 0),
    // Audio plays lifetime
    db.rpc('get_user_total_audio_plays', { p_user_id: userId })
      .then(r => r.data || 0),

    // Journal entries
    db.from('journal_entries').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).gte('created_at', thirtyDaysAgo.toISOString())
      .then(r => r.count || 0),
    db.from('journal_entries').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).then(r => r.count || 0),

    // Daily papers
    db.from('daily_papers').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).gte('created_at', thirtyDaysAgo.toISOString())
      .then(r => r.count || 0),
    db.from('daily_papers').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).then(r => r.count || 0),

    // Abundance events
    db.from('abundance_events').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).gte('created_at', thirtyDaysAgo.toISOString())
      .then(r => r.count || 0),
    db.from('abundance_events').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).then(r => r.count || 0),

    // Vision board items
    db.from('vision_board_items').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).gte('created_at', thirtyDaysAgo.toISOString())
      .then(r => r.count || 0),
    db.from('vision_board_items').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).then(r => r.count || 0),

    // Alignment gym sessions
    db.from('video_session_participants').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).eq('attended', true)
      .gte('joined_at', thirtyDaysAgo.toISOString())
      .then(r => r.count || 0),
    db.from('video_session_participants').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).eq('attended', true)
      .then(r => r.count || 0),

    // Vibe tribe posts
    db.from('vibe_posts').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).eq('is_deleted', false)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .then(r => r.error ? 0 : (r.count || 0)),
    db.from('vibe_posts').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).eq('is_deleted', false)
      .then(r => r.error ? 0 : (r.count || 0)),

    // Recent audio plays - tracks with play_count > 0, sorted by most plays
    db.from('audio_tracks')
      .select('id, section_key, play_count, content_type, text_content, audio_set_id')
      .eq('user_id', userId)
      .gt('play_count', 0)
      .order('play_count', { ascending: false })
      .limit(20)
      .then(async (r) => {
        if (!r.data || r.data.length === 0) return []

        // Get audio set names for these tracks
        const setIds = [...new Set(r.data.map(t => t.audio_set_id).filter(Boolean))]
        const { data: sets } = setIds.length > 0
          ? await db.from('audio_sets').select('id, name').in('id', setIds)
          : { data: [] }
        const setMap = new Map((sets || []).map(s => [s.id, s.name]))

        return r.data.map(t => ({
          track_id: t.id,
          audio_set_name: setMap.get(t.audio_set_id) || 'Unknown Set',
          section_key: t.section_key,
          play_count: t.play_count,
          content_type: t.content_type || 'life_vision',
          text_snippet: (t.text_content || '').substring(0, 100) + ((t.text_content || '').length > 100 ? '...' : ''),
        }))
      }),
  ])

  const recent = audioPlaysRecentData + journalRecent + dailyPaperRecent +
                 abundanceRecent + boardRecent + gymRecent + postsRecent

  const lifetime = audioPlaysLifetime + journalLifetime + dailyPaperLifetime +
                   abundanceLifetime + boardLifetime + gymLifetime + postsLifetime

  return {
    recent,
    lifetime,
    totalAudioPlays: audioPlaysLifetime,
    breakdown: {
      audio_plays: { recent: audioPlaysRecentData, lifetime: audioPlaysLifetime },
      journals: { recent: journalRecent, lifetime: journalLifetime },
      daily_papers: { recent: dailyPaperRecent, lifetime: dailyPaperLifetime },
      abundance: { recent: abundanceRecent, lifetime: abundanceLifetime },
      board_actions: { recent: boardRecent, lifetime: boardLifetime },
      gym_sessions: { recent: gymRecent, lifetime: gymLifetime },
      tribe_posts: { recent: postsRecent, lifetime: postsLifetime },
    },
    recentAudioPlays,
  }
}

// ============================================================================
// Connections - Detailed Breakdown
// ============================================================================

async function getDetailedConnections(
  db: ReturnType<typeof createAdminClient>,
  userId: string,
  oneWeekAgo: Date
) {
  try {
    const [
      postsRecent, postsLifetime,
      commentsRecent, commentsLifetime,
      heartsRecent, heartsLifetime,
      recentPosts,
    ] = await Promise.all([
      db.from('vibe_posts').select('*', { count: 'exact', head: true })
        .eq('user_id', userId).eq('is_deleted', false)
        .gte('created_at', oneWeekAgo.toISOString())
        .then(r => r.error ? 0 : (r.count || 0)),
      db.from('vibe_posts').select('*', { count: 'exact', head: true })
        .eq('user_id', userId).eq('is_deleted', false)
        .then(r => r.error ? 0 : (r.count || 0)),

      db.from('vibe_comments').select('*', { count: 'exact', head: true })
        .eq('user_id', userId).eq('is_deleted', false)
        .gte('created_at', oneWeekAgo.toISOString())
        .then(r => r.error ? 0 : (r.count || 0)),
      db.from('vibe_comments').select('*', { count: 'exact', head: true })
        .eq('user_id', userId).eq('is_deleted', false)
        .then(r => r.error ? 0 : (r.count || 0)),

      db.from('vibe_hearts').select('*', { count: 'exact', head: true })
        .eq('user_id', userId).gte('created_at', oneWeekAgo.toISOString())
        .then(r => r.error ? 0 : (r.count || 0)),
      db.from('vibe_hearts').select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .then(r => r.error ? 0 : (r.count || 0)),

      db.from('vibe_posts')
        .select('content, vibe_tag, created_at')
        .eq('user_id', userId).eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(10)
        .then(r => {
          if (r.error || !r.data) return []
          return r.data.map(p => ({
            content: (p.content || '').substring(0, 80) + ((p.content || '').length > 80 ? '...' : ''),
            vibe_tag: p.vibe_tag || '',
            created_at: p.created_at,
          }))
        }),
    ])

    const recent = postsRecent + commentsRecent + heartsRecent
    const lifetime = postsLifetime + commentsLifetime + heartsLifetime

    return {
      recent,
      lifetime,
      needsNudge: recent === 0,
      breakdown: {
        posts: { recent: postsRecent, lifetime: postsLifetime },
        comments: { recent: commentsRecent, lifetime: commentsLifetime },
        hearts: { recent: heartsRecent, lifetime: heartsLifetime },
      },
      recentPosts,
    }
  } catch {
    // Vibe Tribe tables may not exist
    return {
      recent: 0,
      lifetime: 0,
      needsNudge: true,
      breakdown: {
        posts: { recent: 0, lifetime: 0 },
        comments: { recent: 0, lifetime: 0 },
        hearts: { recent: 0, lifetime: 0 },
      },
      recentPosts: [],
    }
  }
}

// ============================================================================
// Sessions - Detailed Breakdown
// ============================================================================

async function getDetailedSessions(
  db: ReturnType<typeof createAdminClient>,
  userId: string,
  fourWeeksAgo: Date
) {
  const [recent, lifetime, recentSessions, nextSession] = await Promise.all([
    db.from('video_session_participants')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId).eq('attended', true)
      .gte('joined_at', fourWeeksAgo.toISOString())
      .then(r => r.count || 0),

    db.from('video_session_participants')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId).eq('attended', true)
      .then(r => r.count || 0),

    // Recent sessions attended
    db.from('video_session_participants')
      .select(`
        joined_at,
        video_sessions!inner (
          title,
          scheduled_at
        )
      `)
      .eq('user_id', userId)
      .eq('attended', true)
      .order('joined_at', { ascending: false })
      .limit(10)
      .then(r => {
        if (!r.data) return []
        return r.data.map(p => {
          const session = Array.isArray(p.video_sessions)
            ? (p.video_sessions as unknown as { title: string; scheduled_at: string }[])[0]
            : p.video_sessions as unknown as { title: string; scheduled_at: string }
          return {
            title: session?.title || 'Alignment Gym',
            attended_at: p.joined_at,
          }
        })
      }),

    // Next upcoming session
    db.from('video_session_participants')
      .select(`
        session_id,
        video_sessions!inner (
          title,
          scheduled_at,
          status
        )
      `)
      .eq('user_id', userId)
      .gte('video_sessions.scheduled_at', new Date().toISOString())
      .eq('video_sessions.status', 'scheduled')
      .order('video_sessions(scheduled_at)', { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(r => {
        if (!r.data) return undefined
        const session = Array.isArray(r.data.video_sessions)
          ? (r.data.video_sessions as unknown as { title: string; scheduled_at: string }[])[0]
          : r.data.video_sessions as unknown as { title: string; scheduled_at: string }
        if (!session) return undefined
        return {
          title: session.title,
          scheduledAt: session.scheduled_at,
        }
      }),
  ])

  return {
    recent,
    target: 4,
    lifetime,
    recentSessions,
    nextEvent: nextSession,
  }
}
