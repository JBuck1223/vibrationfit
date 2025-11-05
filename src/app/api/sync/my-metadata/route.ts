import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncProfilePictureToMetadata } from '@/lib/supabase/sync-metadata'

/**
 * One-time sync route to sync existing profile pictures to user_metadata
 * Run this once to sync all existing users' profile pictures
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's active profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('profile_picture_url')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('is_draft', false)
      .maybeSingle()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    if (profile?.profile_picture_url) {
      // Sync to metadata
      await syncProfilePictureToMetadata(user.id, profile.profile_picture_url)

      return NextResponse.json({ 
        success: true,
        message: 'Profile picture synced to metadata',
        profilePictureUrl: profile.profile_picture_url
      })
    } else {
      return NextResponse.json({ 
        success: true,
        message: 'No profile picture found to sync'
      })
    }
  } catch (error) {
    console.error('Error syncing profile picture:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

