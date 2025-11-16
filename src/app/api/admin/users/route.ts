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

    // Get user profiles for profile photos
    const { data: profiles } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id, profile_picture_url')

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || [])
    
    // Get storage quotas from user_storage (sum of grants per user)
    const { data: storageGrants } = await supabaseAdmin
      .from('user_storage')
      .select('user_id, quota_gb')
    
    const storageMap = new Map<string, number>()
    storageGrants?.forEach(grant => {
      const current = storageMap.get(grant.user_id) || 0
      storageMap.set(grant.user_id, current + grant.quota_gb)
    })
    
    // Get token balances for all users
    // Granted tokens from token_transactions
    const { data: transactions } = await supabaseAdmin
      .from('token_transactions')
      .select('user_id, tokens_used')
    
    // Used tokens from token_usage
    const { data: usage } = await supabaseAdmin
      .from('token_usage')
      .select('user_id, tokens_used')
    
    // Calculate balances per user
    const tokenBalances = new Map<string, { granted: number; used: number; remaining: number }>()
    
    transactions?.forEach(t => {
      const current = tokenBalances.get(t.user_id) || { granted: 0, used: 0, remaining: 0 }
      current.granted += t.tokens_used
      tokenBalances.set(t.user_id, current)
    })
    
    usage?.forEach(u => {
      const current = tokenBalances.get(u.user_id) || { granted: 0, used: 0, remaining: 0 }
      current.used += u.tokens_used
      tokenBalances.set(u.user_id, current)
    })
    
    // Calculate remaining for each user
    tokenBalances.forEach((balance, userId) => {
      balance.remaining = balance.granted - balance.used
    })
    
    console.log('Profiles found:', profiles?.length || 0)
    console.log('Token balances calculated for', tokenBalances.size, 'users')

    // Transform users to include admin status and profile data
    const transformedUsers = users.users.map(authUser => {
      const isEmailAdmin = adminEmails.includes(authUser.email?.toLowerCase() || '')
      const isMetadataAdmin = authUser.user_metadata?.is_admin === true
      const profile = profileMap.get(authUser.id)
      const tokenBalance = tokenBalances.get(authUser.id)
      const storageQuota = storageMap.get(authUser.id) || 0
      
      console.log(`User ${authUser.email}: tokens = ${tokenBalance?.remaining || 0}, storage = ${storageQuota}GB`)
      
      return {
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        is_admin: isEmailAdmin || isMetadataAdmin,
        user_metadata: authUser.user_metadata,
        tokens_remaining: tokenBalance?.remaining || 0,
        tokens_used: tokenBalance?.used || 0,
        storage_quota_gb: storageQuota,
        profile_photo_url: profile?.profile_picture_url
      }
    })

    return NextResponse.json({ users: transformedUsers })

  } catch (error) {
    console.error('Users API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
