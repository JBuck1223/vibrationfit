import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/vibe-tribe/user/[id]/profile
 * Get mini profile for a user (for popover display)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user account info
    const { data: userAccount, error: userAccountError } = await supabase
      .from('user_accounts')
      .select('id, full_name, profile_picture_url, created_at')
      .eq('id', userId)
      .single()

    if (userAccountError || !userAccount) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get community stats
    const { data: communityStats } = await supabase
      .from('user_community_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    // If no stats exist, return defaults
    const stats = communityStats || {
      total_posts: 0,
      total_comments: 0,
      hearts_given: 0,
      hearts_received: 0,
      streak_days: 0,
      last_post_date: null,
      longest_streak: 0,
    }

    return NextResponse.json({
      profile: {
        id: userAccount.id,
        full_name: userAccount.full_name,
        profile_picture_url: userAccount.profile_picture_url,
        created_at: userAccount.created_at,
        community_stats: stats,
      },
    })

  } catch (error: any) {
    console.error('VIBE TRIBE USER PROFILE GET ERROR:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}
