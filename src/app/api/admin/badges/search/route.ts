import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient as createServiceClient } from '@supabase/supabase-js'

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
 * GET /api/admin/badges/search
 * 
 * Search for users by name or email
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await checkAdmin()
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
