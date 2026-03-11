import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    const { user } = auth

    const supabaseAdmin = createAdminClient()

    const { userId, isAdmin } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const { data: targetUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (getUserError || !targetUser.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

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
