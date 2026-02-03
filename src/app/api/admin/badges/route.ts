import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import {
  BadgeType,
  BADGE_DEFINITIONS,
  getAllBadgeTypes,
} from '@/lib/badges/types'

// Create service role client for admin operations
function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Check admin authentication
async function checkAdmin() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set() {},
        remove() {},
      },
    }
  )
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { error: 'Authentication required', status: 401 }
  }

  // Check if user is admin
  const adminEmails = ['buckinghambliss@gmail.com']
  const isAdmin = adminEmails.includes(user.email || '') || user.user_metadata?.is_admin
  
  if (!isAdmin) {
    return { error: 'Admin access required', status: 403 }
  }

  return { user, supabase }
}

/**
 * GET /api/admin/badges
 * 
 * Get all badge stats with user counts and lists
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await checkAdmin()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const serviceClient = getServiceClient()

    // Get all badges with user info
    const { data: allBadges, error: badgesError } = await serviceClient
      .from('user_badges')
      .select(`
        id,
        user_id,
        badge_type,
        earned_at
      `)
      .order('earned_at', { ascending: false })

    if (badgesError) {
      console.error('Error fetching badges:', badgesError)
      return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 })
    }

    // Get user info for each badge
    const userIds = [...new Set((allBadges || []).map(b => b.user_id))]
    
    const { data: users, error: usersError } = await serviceClient
      .from('user_accounts')
      .select('id, email, full_name')
      .in('id', userIds)

    if (usersError) {
      console.error('Error fetching users:', usersError)
    }

    const userMap = new Map(users?.map(u => [u.id, u]) || [])

    // Group by badge type
    const badgeStats = getAllBadgeTypes().map(type => {
      const definition = BADGE_DEFINITIONS[type]
      const badgesOfType = (allBadges || []).filter(b => b.badge_type === type)
      
      return {
        type,
        label: definition.label,
        earnedCount: badgesOfType.length,
        users: badgesOfType.map(b => {
          const user = userMap.get(b.user_id)
          return {
            id: b.user_id,
            full_name: user?.full_name || null,
            email: user?.email || 'Unknown',
            earned_at: b.earned_at,
          }
        }),
      }
    })

    return NextResponse.json({ badges: badgeStats })
  } catch (error) {
    console.error('Error in admin badges GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/badges
 * 
 * Award a badge to a user
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await checkAdmin()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const { userId, badgeType } = body

    if (!userId || !badgeType) {
      return NextResponse.json({ error: 'userId and badgeType required' }, { status: 400 })
    }

    // Validate badge type
    if (!BADGE_DEFINITIONS[badgeType as BadgeType]) {
      return NextResponse.json({ error: 'Invalid badge type' }, { status: 400 })
    }

    const serviceClient = getServiceClient()

    // Award the badge
    const { error: insertError } = await serviceClient
      .from('user_badges')
      .insert({
        user_id: userId,
        badge_type: badgeType,
        earned_at: new Date().toISOString(),
        metadata: {
          awarded_by: 'admin',
          admin_user_id: auth.user.id,
        },
      })

    if (insertError) {
      // Check if duplicate
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'User already has this badge' }, { status: 409 })
      }
      console.error('Error awarding badge:', insertError)
      return NextResponse.json({ error: 'Failed to award badge' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Badge ${badgeType} awarded to user ${userId}`,
    })
  } catch (error) {
    console.error('Error in admin badges POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/badges
 * 
 * Revoke a badge from a user
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await checkAdmin()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const { userId, badgeType } = body

    if (!userId || !badgeType) {
      return NextResponse.json({ error: 'userId and badgeType required' }, { status: 400 })
    }

    const serviceClient = getServiceClient()

    // Revoke the badge
    const { error: deleteError } = await serviceClient
      .from('user_badges')
      .delete()
      .eq('user_id', userId)
      .eq('badge_type', badgeType)

    if (deleteError) {
      console.error('Error revoking badge:', deleteError)
      return NextResponse.json({ error: 'Failed to revoke badge' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Badge ${badgeType} revoked from user ${userId}`,
    })
  } catch (error) {
    console.error('Error in admin badges DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
