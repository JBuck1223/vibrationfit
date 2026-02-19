import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { RetentionMetrics } from '@/lib/retention/types'

/**
 * GET /api/retention-metrics
 * 
 * Returns the 4 retention metrics for a user:
 * 1. Creations - "What have I built?" (objects: visions, audios, board items, journals, daily papers, abundance events)
 * 2. Activations - "How many times did I run my practice?" (total qualifying events)
 * 3. Connections - "How much am I engaging with the community?" (Vibe Tribe interactions)
 * 4. Sessions - "How often am I showing up to live coaching?" (Alignment Gym attendance)
 * 
 * Query params:
 * - userId (optional): Fetch metrics for another user (requires authentication)
 * 
 * All metrics are calculated real-time from existing tables.
 * 
 * Note: Some activities increment multiple metrics by design (e.g., attending Alignment Gym
 * adds +1 Session AND +1 Activation; creating a journal entry adds +1 Creation AND +1 Activation).
 * Each metric measures a different dimension of practice.
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
    // Resolve "me" alias to the authenticated user's own ID
    const userId = (!targetUserId || targetUserId === 'me') ? user.id : targetUserId
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
      activations: {
        recent: activationsData.recent,
        lifetime: activationsData.lifetime,
        totalAudioPlays: activationsData.totalAudioPlays,
      },
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
 * Get activation metrics - total count of qualifying practice events
 * 
 * Each qualifying activity counts as +1 activation:
 * - Play a Vision Audio
 * - Create Journal entry
 * - Create Daily Paper entry
 * - Create Abundance Tracker entry
 * - Create / Actualize Vision Board item
 * - Attend Alignment Gym
 * - Post in Vibe Tribe
 */
async function getActivationsMetrics(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  thirtyDaysAgo: Date
): Promise<{
  recent: number
  lifetime: number
  totalAudioPlays: number
}> {
  const [
    audioPlaysRecentData,
    audioPlaysLifetime,
    journalRecent,
    journalLifetime,
    dailyPaperRecent,
    dailyPaperLifetime,
    abundanceRecent,
    abundanceLifetime,
    boardRecent,
    boardLifetime,
    gymRecent,
    gymLifetime,
    postsRecent,
    postsLifetime,
  ] = await Promise.all([
    // Audio plays recent - tracks with play_count updated in last 30 days
    supabase
      .from('audio_tracks')
      .select('play_count')
      .eq('user_id', userId)
      .gt('play_count', 0)
      .gte('updated_at', thirtyDaysAgo.toISOString())
      .then(r => r.data?.reduce((sum, track) => sum + (track.play_count || 0), 0) || 0),
    
    // Audio plays lifetime
    supabase
      .rpc('get_user_total_audio_plays', { p_user_id: userId })
      .then(r => r.data || 0),
    
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
    
    // Daily papers recent
    supabase
      .from('daily_papers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .then(r => r.count || 0),
    
    // Daily papers lifetime
    supabase
      .from('daily_papers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .then(r => r.count || 0),
    
    // Abundance events recent
    supabase
      .from('abundance_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .then(r => r.count || 0),
    
    // Abundance events lifetime
    supabase
      .from('abundance_events')
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
    
    // Alignment gym sessions recent
    supabase
      .from('video_session_participants')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('attended', true)
      .gte('joined_at', thirtyDaysAgo.toISOString())
      .then(r => r.count || 0),
    
    // Alignment gym sessions lifetime
    supabase
      .from('video_session_participants')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('attended', true)
      .then(r => r.count || 0),
    
    // Vibe Tribe posts recent
    supabase
      .from('vibe_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .then(r => r.error ? 0 : (r.count || 0)),
    
    // Vibe Tribe posts lifetime
    supabase
      .from('vibe_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .then(r => r.error ? 0 : (r.count || 0)),
  ])

  const recent = audioPlaysRecentData + journalRecent + dailyPaperRecent +
                 abundanceRecent + boardRecent + gymRecent + postsRecent
  
  const lifetime = audioPlaysLifetime + journalLifetime + dailyPaperLifetime +
                   abundanceLifetime + boardLifetime + gymLifetime + postsLifetime

  return {
    recent,
    lifetime,
    totalAudioPlays: audioPlaysLifetime,
  }
}

/**
 * Get creation metrics (visions, audios, board items, journal entries, daily papers, abundance events)
 */
async function getCreationsMetrics(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  thirtyDaysAgo: Date
): Promise<{
  recent: number
  lifetime: number
  lastCreation?: { type: 'vision' | 'audio' | 'board' | 'journal' | 'daily_paper' | 'abundance'; title: string; createdAt: string }
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
    dailyPapersRecent,
    dailyPapersLifetime,
    abundanceRecent,
    abundanceLifetime,
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
    
    // Daily Papers recent
    supabase
      .from('daily_papers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .then(r => r.count || 0),
    
    // Daily Papers lifetime
    supabase
      .from('daily_papers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .then(r => r.count || 0),
    
    // Abundance events recent
    supabase
      .from('abundance_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .then(r => r.count || 0),
    
    // Abundance events lifetime
    supabase
      .from('abundance_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .then(r => r.count || 0),
  ])

  const recent = visionsRecent + audiosRecent + boardRecent + journalRecent + dailyPapersRecent + abundanceRecent
  const lifetime = visionsLifetime + audiosLifetime + boardLifetime + journalLifetime + dailyPapersLifetime + abundanceLifetime

  // Get the most recent creation across all types
  const [lastVision, lastAudio, lastBoard, lastJournal, lastDailyPaper, lastAbundance] = await Promise.all([
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
    
    supabase
      .from('daily_papers')
      .select('entry_date, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(r => r.data ? { type: 'daily_paper' as const, title: `Daily Paper - ${r.data.entry_date}`, createdAt: r.data.created_at } : null),
    
    supabase
      .from('abundance_events')
      .select('note, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(r => r.data ? { type: 'abundance' as const, title: r.data.note.substring(0, 50) + (r.data.note.length > 50 ? '...' : ''), createdAt: r.data.created_at } : null),
  ])

  // Find the most recent creation
  const allCreations = [lastVision, lastAudio, lastBoard, lastJournal, lastDailyPaper, lastAbundance].filter(Boolean) as Array<{
    type: 'vision' | 'audio' | 'board' | 'journal' | 'daily_paper' | 'abundance'
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
