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
  getBadgesByCategory,
} from './types'

// Progress data for each badge type
interface BadgeProgressData {
  sessions: number
  interactions: number
  posts: number
  visionVersions: number
  audioSets: number
  boardTiles: number
  // These require additional tracking (Phase 2)
  checklist72h: boolean
  challenge28d: boolean
  streakDays: number
}

/**
 * Get user's progress toward all badges
 */
export async function getUserBadgeProgress(
  supabase: SupabaseClient,
  userId: string
): Promise<BadgeProgressData> {
  // Execute all queries in parallel for performance
  const [
    sessionsResult,
    postsResult,
    commentsResult,
    heartsResult,
    visionVersionsResult,
    audioSetsResult,
    boardTilesResult,
  ] = await Promise.all([
    // Sessions attended (Alignment Gym)
    supabase
      .from('video_session_participants')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('attended', true),

    // Vibe Tribe posts
    supabase
      .from('vibe_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_deleted', false),

    // Vibe Tribe comments
    supabase
      .from('vibe_comments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_deleted', false),

    // Vibe Tribe hearts given
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
  ])

  const posts = postsResult.count || 0
  const comments = commentsResult.count || 0
  const hearts = heartsResult.count || 0

  return {
    sessions: sessionsResult.count || 0,
    interactions: posts + comments + hearts,
    posts,
    visionVersions: visionVersionsResult.count || 0,
    audioSets: audioSetsResult.count || 0,
    boardTiles: boardTilesResult.count || 0,
    // Phase 2: These need additional tracking
    checklist72h: false,
    challenge28d: false,
    streakDays: 0,
  }
}

/**
 * Check if a user qualifies for a specific badge
 */
export function checkBadgeQualification(
  badge: BadgeDefinition,
  progress: BadgeProgressData
): { qualifies: boolean; current: number; target: number } {
  const { type, threshold, streakDays, special } = badge

  // Handle special badges (Phase 2)
  if (special) {
    switch (special) {
      case 'checklist_72h':
        return { qualifies: progress.checklist72h, current: progress.checklist72h ? 1 : 0, target: 1 }
      case 'challenge_28d':
        return { qualifies: progress.challenge28d, current: progress.challenge28d ? 1 : 0, target: 1 }
      case 'full_12_vision':
        // Check if user has a vision with all 12 categories
        // For now, use vision versions as proxy (needs refinement)
        return { qualifies: progress.visionVersions >= 1, current: progress.visionVersions >= 1 ? 1 : 0, target: 1 }
    }
  }

  // Handle streak badges (Phase 2)
  if (streakDays) {
    return {
      qualifies: progress.streakDays >= streakDays,
      current: progress.streakDays,
      target: streakDays,
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
        current = progress.posts
        break
      case 'vibe_contributor':
      case 'vibe_anchor':
        current = progress.interactions
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
