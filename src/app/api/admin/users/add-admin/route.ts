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

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    })

    const userExists = existingUser.users.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (userExists) {
      const updatedMetadata = {
        ...userExists.user_metadata,
        is_admin: true,
        admin_updated_by: user.email,
        admin_updated_at: new Date().toISOString()
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userExists.id, {
        user_metadata: updatedMetadata
      })

      if (updateError) {
        console.error('Error updating existing user to admin:', updateError)
        return NextResponse.json({ error: 'Failed to update user to admin' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Existing user granted admin access' 
      })
    } else {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        user_metadata: {
          is_admin: true,
          admin_created_by: user.email,
          admin_created_at: new Date().toISOString()
        },
        email_confirm: true
      })

      if (createError) {
        console.error('Error creating new admin user:', createError)
        return NextResponse.json({ error: 'Failed to create admin user' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'New admin user created',
        user: {
          id: newUser.user.id,
          email: newUser.user.email
        }
      })
    }

  } catch (error) {
    console.error('Add admin API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
