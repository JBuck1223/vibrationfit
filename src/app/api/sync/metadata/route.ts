import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncProfilePictureToMetadata } from '@/lib/supabase/sync-metadata'

/**
 * API route to sync profile picture URL to user_metadata
 * Called from client-side after profile picture upload
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { profilePictureUrl } = await request.json()

    if (!profilePictureUrl) {
      return NextResponse.json({ error: 'profilePictureUrl is required' }, { status: 400 })
    }

    // Sync to metadata (non-blocking)
    await syncProfilePictureToMetadata(user.id, profilePictureUrl)

    return NextResponse.json({ 
      success: true,
      message: 'Profile picture synced to metadata' 
    })
  } catch (error) {
    console.error('Error syncing profile picture to metadata:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

