/**
 * Badge Evaluation Logic
 * 
 * Functions to check if a user qualifies for each badge
 * and calculate their progress toward earning badges.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import {
  BadgeType,
  BadgeCategory,
  BadgeDefinition,
  BadgeWithProgress,
  UserBadge,
  UserBadgeStatus,
  BADGE_DEFINITIONS,
  getAllBadgeTypes,
} from './types'

// Progress data for each badge type
interface BadgeProgressData {
  sessions: number
  interactions: number
  posts: number
  comments: number
  hearts: number
  visionVersions: number
  audioSets: number
  boardTiles: number
  checklist72h: boolean
  /** Total distinct calendar days with at least one Activation event */
  activationDays: number
  /** Longest consecutive-day streaks per activity */
  audioLongestStreak: number
  paperLongestStreak: number
  journalLongestStreak: number
  abundanceLongestStreak: number
  tribeLongestStreak: number
}

/**
 * Compute the longest run of consecutive calendar days from a list of date strings.
 * Accepts YYYY-MM-DD or ISO timestamps (only the first 10 chars are used).
 * Returns 0 for an empty input.
 */
function computeLongestStreak(dates: string[]): number {
  if (dates.length === 0) return 0

  const unique = [...new Set(dates.map(d => d.substring(0, 10)))].sort()
  if (unique.length === 0) return 0

  let longest = 1
  let current = 1

  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1] + 'T00:00:00')
    const curr = new Date(unique[i] + 'T00:00:00')
    const diffMs = curr.getTime() - prev.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)

    if (diffDays === 1) {
      current++
      if (current > longest) longest = current
    } else {
      current = 1
    }
  }

  return longest
}

/**
 * Get user's progress toward all badges
 */
export async function getUserBadgeProgress(
  supabase: SupabaseClient,
  userId: string
): Promise<BadgeProgressData> {
  const [
    sessionsResult,
    postsResult,
    commentsResult,
    heartsResult,
    visionVersionsResult,
    audioSetsResult,
    boardTilesResult,
    activationDays,
    audioActiveDates,
    paperDates,
    journalDates,
    abundanceDates,
    tribePostDates,
    tribeCommentDates,
    tribeHeartDates,
  ] = await Promise.all([
    // Sessions attended (Alignment Gym)
    supabase
      .from('video_session_participants')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('attended', true),

    // Vibe Tribe posts (count)
    supabase
      .from('vibe_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_deleted', false),

    // Vibe Tribe comments (count)
    supabase
      .from('vibe_comments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_deleted', false),

    // Vibe Tribe hearts given (count)
    supabase
      .from('vibe_hearts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),

    // Vision versions
    supabase
      .from('vision_versions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),

    // Audio sets
    supabase
      .from('audio_sets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),

    // Vision board items
    supabase
      .from('vision_board_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),

    // Distinct activation days (total across all activities)
    getDistinctActivationDays(supabase, userId),

    // --- Per-activity dates for streak calculation ---

    // Audio listening dates from area_activations
    supabase
      .from('area_activations')
      .select('activation_date')
      .eq('user_id', userId)
      .eq('area', 'vision_audio')
      .then(r => r.data?.map(d => d.activation_date) || []),

    // Daily Paper dates
    supabase
      .from('daily_papers')
      .select('entry_date')
      .eq('user_id', userId)
      .then(r => r.data?.map(d => d.entry_date) || []),

    // Journal entry dates
    supabase
      .from('journal_entries')
      .select('date')
      .eq('user_id', userId)
      .then(r => r.data?.map(d => d.date) || []),

    // Abundance tracker dates
    supabase
      .from('abundance_events')
      .select('date')
      .eq('user_id', userId)
      .then(r => r.data?.map(d => d.date) || []),

    // Tribe dates: posts
    supabase
      .from('vibe_posts')
      .select('created_at')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .then(r => r.data?.map(d => d.created_at) || []),

    // Tribe dates: comments
    supabase
      .from('vibe_comments')
      .select('created_at')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .then(r => r.data?.map(d => d.created_at) || []),

    // Tribe dates: hearts
    supabase
      .from('vibe_hearts')
      .select('created_at')
      .eq('user_id', userId)
      .then(r => r.data?.map(d => d.created_at) || []),
  ])

  const posts = postsResult.count || 0
  const comments = commentsResult.count || 0
  const hearts = heartsResult.count || 0

  const allTribeDates = [...tribePostDates, ...tribeCommentDates, ...tribeHeartDates]

  return {
    sessions: sessionsResult.count || 0,
    interactions: posts + comments + hearts,
    posts,
    comments,
    hearts,
    visionVersions: visionVersionsResult.count || 0,
    audioSets: audioSetsResult.count || 0,
    boardTiles: boardTilesResult.count || 0,
    checklist72h: false,
    activationDays,
    audioLongestStreak: computeLongestStreak(audioActiveDates),
    paperLongestStreak: computeLongestStreak(paperDates),
    journalLongestStreak: computeLongestStreak(journalDates),
    abundanceLongestStreak: computeLongestStreak(abundanceDates),
    tribeLongestStreak: computeLongestStreak(allTribeDates),
  }
}

/**
 * Count distinct calendar days on which the user had at least one Activation event.
 * 
 * Qualifying activities (same as the Activations retention metric):
 * - Journal entry created
 * - Daily Paper created
 * - Abundance Tracker entry created
 * - Vision Board item created
 * - Alignment Gym session attended
 * - Vibe Tribe post created
 * - Audio track played (uses updated_at as proxy for last play date)
 */
async function getDistinctActivationDays(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  try {
    // Fetch timestamps from all activation sources in parallel
    const [
      journalDates,
      dailyPaperDates,
      abundanceDates,
      boardDates,
      gymDates,
      postDates,
      audioDates,
    ] = await Promise.all([
      // Journal entries
      supabase
        .from('journal_entries')
        .select('created_at')
        .eq('user_id', userId)
        .then(r => r.data?.map(d => d.created_at) || []),

      // Daily papers
      supabase
        .from('daily_papers')
        .select('created_at')
        .eq('user_id', userId)
        .then(r => r.data?.map(d => d.created_at) || []),

      // Abundance events
      supabase
        .from('abundance_events')
        .select('created_at')
        .eq('user_id', userId)
        .then(r => r.data?.map(d => d.created_at) || []),

      // Vision board items
      supabase
        .from('vision_board_items')
        .select('created_at')
        .eq('user_id', userId)
        .then(r => r.data?.map(d => d.created_at) || []),

      // Alignment Gym sessions (attended)
      supabase
        .from('video_session_participants')
        .select('joined_at')
        .eq('user_id', userId)
        .eq('attended', true)
        .then(r => r.data?.map(d => d.joined_at) || []),

      // Vibe Tribe posts
      supabase
        .from('vibe_posts')
        .select('created_at')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .then(r => r.error ? [] : (r.data?.map(d => d.created_at) || [])),

      // Audio tracks with plays (updated_at is proxy for last play date)
      supabase
        .from('audio_tracks')
        .select('updated_at')
        .eq('user_id', userId)
        .gt('play_count', 0)
        .then(r => r.data?.map(d => d.updated_at) || []),
    ])

    // Collect all timestamps and extract unique calendar dates (YYYY-MM-DD)
    const allTimestamps = [
      ...journalDates,
      ...dailyPaperDates,
      ...abundanceDates,
      ...boardDates,
      ...gymDates,
      ...postDates,
      ...audioDates,
    ]

    const uniqueDays = new Set<string>()
    for (const ts of allTimestamps) {
      if (ts) {
        // Extract YYYY-MM-DD from the ISO timestamp
        const day = ts.substring(0, 10)
        uniqueDays.add(day)
      }
    }

    return uniqueDays.size
  } catch (error) {
    console.error('Error counting distinct activation days:', error)
    return 0
  }
}

/**
 * Check if a user qualifies for a specific badge
 */
export function checkBadgeQualification(
  badge: BadgeDefinition,
  progress: BadgeProgressData
): { qualifies: boolean; current: number; target: number } {
  const { type, threshold, activationDays, streakDays, streakActivity, special } = badge

  // Handle special badges
  if (special) {
    switch (special) {
      case 'checklist_72h':
        return { qualifies: progress.checklist72h, current: progress.checklist72h ? 1 : 0, target: 1 }
      case 'full_12_vision':
        return { qualifies: progress.visionVersions >= 1, current: progress.visionVersions >= 1 ? 1 : 0, target: 1 }
    }
  }

  // Handle consecutive-day streak badges
  if (streakDays && streakActivity) {
    const streakMap: Record<string, number> = {
      audio: progress.audioLongestStreak,
      paper: progress.paperLongestStreak,
      journal: progress.journalLongestStreak,
      abundance: progress.abundanceLongestStreak,
      tribe: progress.tribeLongestStreak,
    }
    const current = streakMap[streakActivity] || 0
    return {
      qualifies: current >= streakDays,
      current,
      target: streakDays,
    }
  }

  // Handle activation day badges (distinct calendar days with any Activation event)
  if (activationDays) {
    return {
      qualifies: progress.activationDays >= activationDays,
      current: progress.activationDays,
      target: activationDays,
    }
  }

  // Handle threshold badges
  if (threshold) {
    let current = 0
    
    switch (type) {
      // Sessions badges
      case 'gym_rookie':
      case 'gym_regular':
      case 'gym_og':
        current = progress.sessions
        break
      
      // Connections badges
      case 'first_signal':
      case 'voice_activated':
      case 'signal_amplifier':
        current = progress.posts
        break
      case 'conversation_starter':
        current = progress.comments
        break
      case 'heart_giver':
      case 'heart_overflow':
        current = progress.hearts
        break
      
      // Creations badges
      case 'vision_weaver':
        current = progress.visionVersions
        break
      case 'audio_architect':
        current = progress.audioSets
        break
      case 'board_builder':
        current = progress.boardTiles
        break
      
      default:
        current = 0
    }

    return {
      qualifies: current >= threshold,
      current,
      target: threshold,
    }
  }

  return { qualifies: false, current: 0, target: 1 }
}

/**
 * Get user's earned badges from database
 */
export async function getUserEarnedBadges(
  supabase: SupabaseClient,
  userId: string
): Promise<UserBadge[]> {
  const { data, error } = await supabase
    .from('user_badges')
    .select('*')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })

  if (error) {
    console.error('Error fetching user badges:', error)
    return []
  }

  return data || []
}

/**
 * Get complete badge status for a user (earned + progress for all badges)
 */
export async function getUserBadgeStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<UserBadgeStatus> {
  // Get user's progress data and earned badges in parallel
  const [progress, earnedBadges] = await Promise.all([
    getUserBadgeProgress(supabase, userId),
    getUserEarnedBadges(supabase, userId),
  ])

  const earnedBadgeTypes = new Set(earnedBadges.map(b => b.badge_type))
  const earnedBadgeMap = new Map(earnedBadges.map(b => [b.badge_type, b]))

  const allBadgeTypes = getAllBadgeTypes()
  const badges: BadgeWithProgress[] = []
  const byCategory: Record<BadgeCategory, BadgeWithProgress[]> = {
    sessions: [],
    connections: [],
    activations: [],
    creations: [],
  }

  for (const badgeType of allBadgeTypes) {
    const definition = BADGE_DEFINITIONS[badgeType]
    const earned = earnedBadgeTypes.has(badgeType)
    const earnedBadge = earnedBadgeMap.get(badgeType)
    const { current, target } = checkBadgeQualification(definition, progress)

    const badgeWithProgress: BadgeWithProgress = {
      definition,
      earned,
      earnedAt: earnedBadge?.earned_at,
      progress: {
        current,
        target,
        percentage: target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0,
      },
    }

    badges.push(badgeWithProgress)
    byCategory[definition.category].push(badgeWithProgress)
  }

  return {
    userId,
    badges,
    byCategory,
    earnedCount: earnedBadges.length,
    totalCount: allBadgeTypes.length,
  }
}

/**
 * Evaluate and award new badges to a user
 * Returns list of newly awarded badges
 */
export async function evaluateAndAwardBadges(
  supabase: SupabaseClient,
  userId: string
): Promise<BadgeType[]> {
  const [progress, earnedBadges] = await Promise.all([
    getUserBadgeProgress(supabase, userId),
    getUserEarnedBadges(supabase, userId),
  ])

  const earnedBadgeTypes = new Set(earnedBadges.map(b => b.badge_type))
  const newlyEarned: BadgeType[] = []

  for (const badgeType of getAllBadgeTypes()) {
    // Skip if already earned
    if (earnedBadgeTypes.has(badgeType)) continue

    const definition = BADGE_DEFINITIONS[badgeType]
    const { qualifies } = checkBadgeQualification(definition, progress)

    if (qualifies) {
      // Award the badge
      const { error } = await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_type: badgeType,
          earned_at: new Date().toISOString(),
          metadata: {
            awarded_by: 'system',
            progress_at_award: progress,
          },
        })

      if (!error) {
        newlyEarned.push(badgeType)
      } else {
        console.error(`Error awarding badge ${badgeType}:`, error)
      }
    }
  }

  return newlyEarned
}

/**
 * Check if a user has a specific badge
 */
export async function userHasBadge(
  supabase: SupabaseClient,
  userId: string,
  badgeType: BadgeType
): Promise<boolean> {
  const { count, error } = await supabase
    .from('user_badges')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('badge_type', badgeType)

  if (error) {
    console.error('Error checking badge:', error)
    return false
  }

  return (count || 0) > 0
}

/**
 * Get users who have earned a specific badge
 */
export async function getUsersWithBadge(
  supabase: SupabaseClient,
  badgeType: BadgeType
): Promise<UserBadge[]> {
  const { data, error } = await supabase
    .from('user_badges')
    .select('*')
    .eq('badge_type', badgeType)
    .order('earned_at', { ascending: false })

  if (error) {
    console.error('Error fetching users with badge:', error)
    return []
  }

  return data || []
}
