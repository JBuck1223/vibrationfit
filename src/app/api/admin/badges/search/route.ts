import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { verifyAdminAccess } from '@/lib/supabase/admin'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * GET /api/admin/badges/search
 * 
 * Search for users by name or email
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] })
    }

    const serviceClient = getServiceClient()

    // Search users by name or email
    const { data: users, error: usersError } = await serviceClient
      .from('user_accounts')
      .select('id, email, full_name')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(20)

    if (usersError) {
      console.error('Error searching users:', usersError)
      return NextResponse.json({ error: 'Failed to search users' }, { status: 500 })
    }

    // Get badges for these users
    const userIds = users?.map(u => u.id) || []
    
    const { data: badges, error: badgesError } = await serviceClient
      .from('user_badges')
      .select('user_id, badge_type')
      .in('user_id', userIds)

    if (badgesError) {
      console.error('Error fetching badges:', badgesError)
    }

    // Group badges by user
    const badgesByUser = new Map<string, string[]>()
    for (const badge of badges || []) {
      const existing = badgesByUser.get(badge.user_id) || []
      existing.push(badge.badge_type)
      badgesByUser.set(badge.user_id, existing)
    }

    // Combine user and badge data
    const usersWithBadges = users?.map(user => ({
      ...user,
      badges: badgesByUser.get(user.id) || [],
    })) || []

    return NextResponse.json({ users: usersWithBadges })
  } catch (error) {
    console.error('Error in admin badges search:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
