import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
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

    const { userId, isAdmin } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get the target user
    const { data: targetUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (getUserError || !targetUser.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update user metadata to include admin status
    const updatedMetadata = {
      ...targetUser.user.user_metadata,
      is_admin: isAdmin,
      admin_updated_by: user.email,
      admin_updated_at: new Date().toISOString()
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: updatedMetadata
    })

    if (updateError) {
      console.error('Error updating user admin status:', updateError)
      return NextResponse.json({ error: 'Failed to update admin status' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `User ${isAdmin ? 'granted' : 'removed'} admin access` 
    })

  } catch (error) {
    console.error('Toggle admin API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
