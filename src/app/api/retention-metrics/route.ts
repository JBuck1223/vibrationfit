import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { RetentionMetrics } from '@/lib/retention/types'

/**
 * GET /api/retention-metrics
 * 
 * Returns the 4 retention metrics for a user:
 * 1. Sessions - Alignment Gym attendance
 * 2. Connections - Vibe Tribe interactions  
 * 3. Activations - Daily use (audio plays, vision views)
 * 4. Creations - Asset building activity
 * 
 * Query params:
 * - userId (optional): Fetch metrics for another user (requires authentication)
 * 
 * All metrics are calculated real-time from existing tables.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check for userId query param (for viewing other members' metrics)
    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('userId')
    
    // Use the target user ID if provided, otherwise use the authenticated user
    const userId = targetUserId || user.id
    const now = new Date()
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Execute all queries in parallel for performance
    const [
      sessionsRecent,
      sessionsLifetime,
      nextSession,
      connectionsData,
      activationsData,
      creationsData,
    ] = await Promise.all([
      // 1. Sessions - Recent (last 4 weeks)
      getSessionsRecent(supabase, userId, fourWeeksAgo),
      
      // 2. Sessions - Lifetime
      getSessionsLifetime(supabase, userId),
      
      // 3. Next upcoming session
      getNextSession(supabase, userId),
      
      // 4. Connections (Vibe Tribe) - gracefully handles missing tables
      getConnectionsMetrics(supabase, userId, oneWeekAgo),
      
      // 5. Activations
      getActivationsMetrics(supabase, userId, thirtyDaysAgo),
      
      // 6. Creations
      getCreationsMetrics(supabase, userId, thirtyDaysAgo),
    ])

    const metrics: RetentionMetrics = {
      sessions: {
        recent: sessionsRecent,
        target: 4,
        lifetime: sessionsLifetime,
        nextEvent: nextSession,
      },
      connections: connectionsData,
      activations: activationsData,
      creations: creationsData,
      calculatedAt: now.toISOString(),
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Error calculating retention metrics:', error)
    return NextResponse.json(
      { error: 'Failed to calculate retention metrics' },
      { status: 500 }
    )
  }
}

/**
 * Get sessions attended in the last 4 weeks
 */
async function getSessionsRecent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  fourWeeksAgo: Date
): Promise<number> {
  const { count, error } = await supabase
    .from('video_session_participants')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('attended', true)
    .gte('joined_at', fourWeeksAgo.toISOString())

  if (error) {
    console.error('Error fetching recent sessions:', error)
    return 0
  }
  return count || 0
}

/**
 * Get total lifetime sessions attended
 */
async function getSessionsLifetime(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('video_session_participants')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('attended', true)

  if (error) {
    console.error('Error fetching lifetime sessions:', error)
    return 0
  }
  return count || 0
}

/**
 * Get the next upcoming session the user is invited to
 */
async function getNextSession(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<{ title: string; scheduledAt: string } | undefined> {
  const now = new Date().toISOString()
  
  const { data, error } = await supabase
    .from('video_session_participants')
    .select(`
      session_id,
      video_sessions!inner (
        title,
        scheduled_at,
        status
      )
    `)
    .eq('user_id', userId)
    .gte('video_sessions.scheduled_at', now)
    .eq('video_sessions.status', 'scheduled')
    .order('video_sessions(scheduled_at)', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    return undefined
  }

  const sessions = data.video_sessions as unknown as { title: string; scheduled_at: string }[]
  const session = Array.isArray(sessions) ? sessions[0] : sessions
  if (!session) {
    return undefined
  }
  
  return {
    title: session.title,
    scheduledAt: session.scheduled_at,
  }
}

/**
 * Get Vibe Tribe connection metrics
 * Gracefully handles missing tables (returns zeros)
 */
async function getConnectionsMetrics(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  oneWeekAgo: Date
): Promise<{
  recent: number
  lifetime: number
  lastPost?: { vibeTag: string; snippet: string; createdAt: string }
  needsNudge: boolean
}> {
  try {
    // Try to query vibe_posts (may not exist in production yet)
    const [postsRecent, postsLifetime, commentsRecent, commentsLifetime, heartsRecent, heartsLifetime, lastPost] = 
      await Promise.all([
        // Posts this week
        supabase
          .from('vibe_posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_deleted', false)
          .gte('created_at', oneWeekAgo.toISOString())
          .then(r => r.error ? 0 : (r.count || 0)),
        
        // Posts lifetime
        supabase
          .from('vibe_posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_deleted', false)
          .then(r => r.error ? 0 : (r.count || 0)),
        
        // Comments this week
        supabase
          .from('vibe_comments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_deleted', false)
          .gte('created_at', oneWeekAgo.toISOString())
          .then(r => r.error ? 0 : (r.count || 0)),
        
        // Comments lifetime
        supabase
          .from('vibe_comments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_deleted', false)
          .then(r => r.error ? 0 : (r.count || 0)),
        
        // Hearts given this week
        supabase
          .from('vibe_hearts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', oneWeekAgo.toISOString())
          .then(r => r.error ? 0 : (r.count || 0)),
        
        // Hearts given lifetime
        supabase
          .from('vibe_hearts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .then(r => r.error ? 0 : (r.count || 0)),
        
        // Last post
        supabase
          .from('vibe_posts')
          .select('vibe_tag, content, created_at')
          .eq('user_id', userId)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
          .then(r => r.error ? null : r.data),
      ])

    const recent = postsRecent + commentsRecent + heartsRecent
    const lifetime = postsLifetime + commentsLifetime + heartsLifetime

    return {
      recent,
      lifetime,
      lastPost: lastPost ? {
        vibeTag: lastPost.vibe_tag,
        snippet: lastPost.content?.substring(0, 50) + (lastPost.content?.length > 50 ? '...' : ''),
        createdAt: lastPost.created_at,
      } : undefined,
      needsNudge: recent === 0,
    }
  } catch (error) {
    // Tables don't exist yet - return zeros
    console.log('Vibe Tribe tables not available:', error)
    return {
      recent: 0,
      lifetime: 0,
      needsNudge: true,
    }
  }
}

/**
 * Get activation metrics (audio plays, vision views)
 * Uses audio_tracks.play_count and login data
 */
async function getActivationsMetrics(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  thirtyDaysAgo: Date
): Promise<{
  recent: number
  target: number
  lifetime: number
  totalAudioPlays: number
}> {
  // Get total audio plays using the existing function
  const { data: totalPlays, error: playsError } = await supabase
    .rpc('get_user_total_audio_plays', { p_user_id: userId })

  if (playsError) {
    console.error('Error getting total audio plays:', playsError)
  }

  const totalAudioPlays = totalPlays || 0

  // Get user activity metrics for login tracking
  const { data: activityData } = await supabase
    .from('user_activity_metrics')
    .select('total_logins, last_login_at')
    .eq('user_id', userId)
    .maybeSingle()

  // For activation days, we need to count distinct days with activity
  // Currently we only have cumulative play_count, not individual play events with timestamps
  // As a proxy, we'll estimate based on audio plays and logins
  // TODO: Add audio_play_events table for accurate daily tracking
  
  // Rough estimation: 
  // - If user has audio plays, assume they've been active
  // - Use total_logins as a rough indicator of distinct active days
  const estimatedRecentDays = Math.min(
    Math.ceil(totalAudioPlays / 2), // Assume ~2 plays per active day
    30
  )
  
  const estimatedLifetimeDays = activityData?.total_logins || Math.ceil(totalAudioPlays / 2)

  return {
    recent: estimatedRecentDays,
    target: 30,
    lifetime: estimatedLifetimeDays,
    totalAudioPlays,
  }
}

/**
 * Get creation metrics (visions, audios, board items, journal entries)
 */
async function getCreationsMetrics(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  thirtyDaysAgo: Date
): Promise<{
  recent: number
  lifetime: number
  lastCreation?: { type: 'vision' | 'audio' | 'board' | 'journal'; title: string; createdAt: string }
}> {
  // Execute all creation queries in parallel
  const [
    visionsRecent,
    visionsLifetime,
    audiosRecent,
    audiosLifetime,
    boardRecent,
    boardLifetime,
    journalRecent,
    journalLifetime,
  ] = await Promise.all([
    // Visions recent
    supabase
      .from('vision_versions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .then(r => r.count || 0),
    
    // Visions lifetime
    supabase
      .from('vision_versions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .then(r => r.count || 0),
    
    // Audio sets recent
    supabase
      .from('audio_sets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .then(r => r.count || 0),
    
    // Audio sets lifetime
    supabase
      .from('audio_sets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .then(r => r.count || 0),
    
    // Vision board items recent
    supabase
      .from('vision_board_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .then(r => r.count || 0),
    
    // Vision board items lifetime
    supabase
      .from('vision_board_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .then(r => r.count || 0),
    
    // Journal entries recent
    supabase
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .then(r => r.count || 0),
    
    // Journal entries lifetime
    supabase
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .then(r => r.count || 0),
  ])

  const recent = visionsRecent + audiosRecent + boardRecent + journalRecent
  const lifetime = visionsLifetime + audiosLifetime + boardLifetime + journalLifetime

  // Get the most recent creation across all types
  const [lastVision, lastAudio, lastBoard, lastJournal] = await Promise.all([
    supabase
      .from('vision_versions')
      .select('title, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(r => r.data ? { type: 'vision' as const, title: r.data.title, createdAt: r.data.created_at } : null),
    
    supabase
      .from('audio_sets')
      .select('name, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(r => r.data ? { type: 'audio' as const, title: r.data.name, createdAt: r.data.created_at } : null),
    
    supabase
      .from('vision_board_items')
      .select('name, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(r => r.data ? { type: 'board' as const, title: r.data.name, createdAt: r.data.created_at } : null),
    
    supabase
      .from('journal_entries')
      .select('title, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(r => r.data ? { type: 'journal' as const, title: r.data.title || 'Journal Entry', createdAt: r.data.created_at } : null),
  ])

  // Find the most recent creation
  const allCreations = [lastVision, lastAudio, lastBoard, lastJournal].filter(Boolean) as Array<{
    type: 'vision' | 'audio' | 'board' | 'journal'
    title: string
    createdAt: string
  }>
  
  const lastCreation = allCreations.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0]

  return {
    recent,
    lifetime,
    lastCreation,
  }
}
