import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile, upsertUserProfile, getProfileCompletionPercentage } from '@/lib/supabase/profile'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getUserProfile(user.id)
    const completionPercentage = await getProfileCompletionPercentage(user.id)

    return NextResponse.json({ 
      profile, 
      completionPercentage 
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { profileData } = body

    if (!profileData) {
      return NextResponse.json({ error: 'Profile data is required' }, { status: 400 })
    }

    // Remove any fields that shouldn't be updated directly
    const { id, user_id, created_at, updated_at, ...allowedUpdates } = profileData

    const updatedProfile = await upsertUserProfile(user.id, allowedUpdates)
    const completionPercentage = await getProfileCompletionPercentage(user.id)

    if (!updatedProfile) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ 
      profile: updatedProfile,
      completionPercentage 
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
