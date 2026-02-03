import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getUserBadgeStatus,
  evaluateAndAwardBadges,
} from '@/lib/badges/evaluate'
import { BADGE_DEFINITIONS } from '@/lib/badges/types'

/**
 * GET /api/badges
 * 
 * Returns badge status for a user including:
 * - All earned badges
 * - Progress toward unearned badges
 * - Badges grouped by Core 4 category
 * 
 * Query params:
 * - userId (optional): Fetch badges for another user (for profile display)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check for userId query param (for viewing other users' badges)
    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('userId')
    
    // Use the target user ID if provided, otherwise use the authenticated user
    const userId = targetUserId || user.id

    // Get complete badge status with progress
    const badgeStatus = await getUserBadgeStatus(supabase, userId)

    return NextResponse.json(badgeStatus)
  } catch (error) {
    console.error('Error fetching badges:', error)
    return NextResponse.json(
      { error: 'Failed to fetch badges' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/badges
 * 
 * Evaluate and award new badges for the current user.
 * This is called after significant user actions (completing sessions,
 * posting in Vibe Tribe, creating content, etc.)
 * 
 * Returns list of newly awarded badges.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Evaluate and award any new badges
    const newBadges = await evaluateAndAwardBadges(supabase, user.id)

    // If new badges were earned, return them with full definitions
    const awardedBadges = newBadges.map(type => ({
      type,
      definition: BADGE_DEFINITIONS[type],
      awardedAt: new Date().toISOString(),
    }))

    return NextResponse.json({
      success: true,
      newBadges: awardedBadges,
      count: awardedBadges.length,
    })
  } catch (error) {
    console.error('Error evaluating badges:', error)
    return NextResponse.json(
      { error: 'Failed to evaluate badges' },
      { status: 500 }
    )
  }
}
