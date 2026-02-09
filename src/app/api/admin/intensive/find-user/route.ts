import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

// Create admin client that bypasses RLS
function getAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify super_admin role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: adminAccount } = await supabase
      .from('user_accounts')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminAccount?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 })
    }

    const email = request.nextUrl.searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'email parameter is required' }, { status: 400 })
    }

    // Use admin client to bypass RLS
    const adminClient = getAdminClient()
    const normalizedEmail = email.toLowerCase().trim()

    // First, try to find user in user_accounts
    let { data: userAccount, error: userError } = await adminClient
      .from('user_accounts')
      .select('id, email, first_name, last_name')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (userError) {
      console.error('Error finding user in user_accounts:', userError)
      return NextResponse.json({ error: 'Failed to search for user' }, { status: 500 })
    }

    // If not found in user_accounts, check auth.users directly
    if (!userAccount) {
      console.log('User not found in user_accounts, checking auth.users...')
      
      // List users from auth and find by email
      const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers()
      
      if (authError) {
        console.error('Error listing auth users:', authError)
        return NextResponse.json({ error: 'Failed to search auth users' }, { status: 500 })
      }

      const authUser = authUsers.users.find(u => u.email?.toLowerCase() === normalizedEmail)
      
      if (!authUser) {
        return NextResponse.json({ error: 'No user found with this email in auth or user_accounts' }, { status: 404 })
      }

      console.log('Found user in auth.users:', authUser.id, authUser.email)

      // Create the missing user_accounts row
      const now = new Date().toISOString()
      const { data: newAccount, error: createError } = await adminClient
        .from('user_accounts')
        .insert({
          id: authUser.id,
          email: authUser.email,
          first_name: authUser.user_metadata?.first_name || null,
          last_name: authUser.user_metadata?.last_name || null,
          role: 'user',
          created_at: now,
          updated_at: now
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating user_accounts row:', createError)
        return NextResponse.json({ 
          error: `Found user in auth but failed to create user_accounts row: ${createError.message}` 
        }, { status: 500 })
      }

      userAccount = newAccount
      console.log('Created user_accounts row for:', userAccount?.id)
    }

    if (!userAccount) {
      return NextResponse.json({ error: 'Failed to resolve user account' }, { status: 500 })
    }

    // Check if they have a checklist
    const { data: checklist } = await adminClient
      .from('intensive_checklist')
      .select('id, status')
      .eq('user_id', userAccount.id)
      .maybeSingle()

    return NextResponse.json({
      userId: userAccount.id,
      email: userAccount.email,
      firstName: userAccount.first_name,
      lastName: userAccount.last_name,
      hasChecklist: !!checklist,
      checklistStatus: checklist?.status || null
    })

  } catch (error) {
    console.error('Error finding user:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
