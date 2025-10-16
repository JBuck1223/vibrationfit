import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const adminEmails = ['buckinghambliss@gmail.com', 'admin@vibrationfit.com']
    const isEmailAdmin = adminEmails.includes(user.email?.toLowerCase() || '')
    const isMetadataAdmin = user.user_metadata?.is_admin === true
    
    if (!isEmailAdmin && !isMetadataAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Create admin client with service role key
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get all users from auth.users
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Get user profiles for token/storage data and profile photos
    const { data: profiles } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id, vibe_assistant_tokens_remaining, vibe_assistant_tokens_used, storage_quota_gb, profile_picture_url')

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || [])
    
    console.log('Profiles found:', profiles?.length || 0)
    console.log('Profile map keys:', Array.from(profileMap.keys()))

    // Transform users to include admin status and profile data
    const transformedUsers = users.users.map(authUser => {
      const isEmailAdmin = adminEmails.includes(authUser.email?.toLowerCase() || '')
      const isMetadataAdmin = authUser.user_metadata?.is_admin === true
      const profile = profileMap.get(authUser.id)
      
      console.log(`User ${authUser.email}: profile found = ${!!profile}, tokens = ${profile?.vibe_assistant_tokens_remaining}`)
      
      return {
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        is_admin: isEmailAdmin || isMetadataAdmin,
        user_metadata: authUser.user_metadata,
        tokens_remaining: profile?.vibe_assistant_tokens_remaining ?? 100,
        tokens_used: profile?.vibe_assistant_tokens_used ?? 0,
        storage_quota_gb: profile?.storage_quota_gb ?? 1,
        profile_photo_url: profile?.profile_picture_url
      }
    })

    return NextResponse.json({ users: transformedUsers })

  } catch (error) {
    console.error('Users API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
