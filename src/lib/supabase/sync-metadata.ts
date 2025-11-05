/**
 * Sync profile data to user_metadata for fast access
 * This allows Header and other components to access profile data instantly from auth token
 */

import { createClient as createAdminClient } from '@supabase/supabase-js'

/**
 * Sync profile_picture_url from user_profiles to user_metadata
 * This makes the profile picture available instantly in the auth token
 */
export async function syncProfilePictureToMetadata(userId: string, profilePictureUrl: string | null): Promise<void> {
  try {
    // Use admin client to update user metadata
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

    // Get current user to preserve existing metadata
    const { data: currentUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (getUserError || !currentUser.user) {
      console.error('Error fetching user for metadata sync:', getUserError)
      return
    }

    // Update user metadata with profile picture URL
    const updatedMetadata = {
      ...currentUser.user.user_metadata,
      profile_picture_url: profilePictureUrl || null,
      profile_picture_updated_at: new Date().toISOString()
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: updatedMetadata
    })

    if (updateError) {
      console.error('Error syncing profile picture to metadata:', updateError)
    } else {
      console.log('✅ Profile picture synced to user_metadata for user:', userId)
    }
  } catch (error) {
    console.error('Unexpected error syncing profile picture to metadata:', error)
  }
}

/**
 * Sync first_name from user_profiles to user_metadata
 * This makes the first name available instantly in the auth token
 */
export async function syncFirstNameToMetadata(userId: string, firstName: string | null): Promise<void> {
  try {
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

    const { data: currentUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (getUserError || !currentUser.user) {
      console.error('Error fetching user for metadata sync:', getUserError)
      return
    }

    const updatedMetadata = {
      ...currentUser.user.user_metadata,
      first_name: firstName || null,
      first_name_updated_at: new Date().toISOString()
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: updatedMetadata
    })

    if (updateError) {
      console.error('Error syncing first name to metadata:', updateError)
    } else {
      console.log('✅ First name synced to user_metadata for user:', userId)
    }
  } catch (error) {
    console.error('Unexpected error syncing first name to metadata:', error)
  }
}

