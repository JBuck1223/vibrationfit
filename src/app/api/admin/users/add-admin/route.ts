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

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    })

    const userExists = existingUser.users.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (userExists) {
      // User exists, update their admin status
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
      // User doesn't exist, create them as admin
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        user_metadata: {
          is_admin: true,
          admin_created_by: user.email,
          admin_created_at: new Date().toISOString()
        },
        email_confirm: true // Auto-confirm email
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
