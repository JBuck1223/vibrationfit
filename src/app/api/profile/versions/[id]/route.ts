import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ============================================================================
// Individual Profile Version API Endpoints
// ============================================================================

// ============================================================================
// GET /api/profile/versions/[id] - Get specific profile version
// ============================================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: profileId } = await params

    // Get the specific profile version
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', profileId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching profile version:', error)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get account data (name, picture, etc.) from user_accounts - source of truth for account-level data
    const accountResult = await supabase
      .from('user_accounts')
      .select('first_name, last_name, full_name, profile_picture_url, email, phone, date_of_birth')
      .eq('id', user.id)
      .maybeSingle()
    
    if (accountResult.error) {
      console.error('Error fetching user_accounts:', accountResult.error.message)
    }
    const accountData = accountResult.data

    // Calculate version number based on chronological order (matches vision API pattern)
    let profileVersionNumber = profile.version_number || 1
    try {
      const { data: calculatedVersionNumber } = await supabase
        .rpc('get_profile_version_number', { p_profile_id: profile.id })
      
      profileVersionNumber = calculatedVersionNumber || profile.version_number || 1
    } catch (error) {
      // If RPC function doesn't exist yet, use stored version_number
      console.warn('Could not calculate version number, using stored:', error)
    }

    // Merge account data into profile (user_accounts is source of truth for these fields)
    const profileWithVersion = {
      ...profile,
      version_number: profileVersionNumber,
      // Account-level fields from user_accounts (take precedence)
      first_name: accountData?.first_name ?? profile?.first_name,
      last_name: accountData?.last_name ?? profile?.last_name,
      full_name: accountData?.full_name ?? null,
      profile_picture_url: accountData?.profile_picture_url ?? profile?.profile_picture_url,
      email: accountData?.email ?? profile?.email,
      phone: accountData?.phone ?? profile?.phone,
      date_of_birth: accountData?.date_of_birth ?? profile?.date_of_birth,
    }
    
    console.log('Profile versions API: Merged account data - email:', profileWithVersion.email, 'phone:', profileWithVersion.phone)

    return NextResponse.json({ profile: profileWithVersion, account: accountData })
  } catch (error) {
    console.error('Unexpected error in GET /api/profile/versions/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// PATCH /api/profile/versions/[id] - Update profile version
// ============================================================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: profileId } = await params
    const body = await request.json()

    // Verify the profile belongs to the user
    const { data: existingProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, user_id, is_draft, is_active')
      .eq('id', profileId)
      .eq('user_id', user.id)
      .single()

    if (profileError || !existingProfile) {
      return NextResponse.json({ error: 'Profile not found or access denied' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Handle version notes update
    if (body.versionNotes !== undefined) {
      updateData.version_notes = body.versionNotes
    }

    // Update the profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', profileId)
      .eq('user_id', user.id)
      .select(`
        id,
        version_number,
        is_draft,
        is_active,
        version_notes,
        parent_version_id,
        created_at,
        updated_at
      `)
      .single()

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      profile: updatedProfile,
      message: 'Profile updated successfully' 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 })
    }
    console.error('Unexpected error in PATCH /api/profile/versions/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// DELETE /api/profile/versions/[id] - Delete profile version
// ============================================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: profileId } = await params

    // Verify the profile belongs to the user
    const { data: existingProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, user_id, is_draft, is_active')
      .eq('id', profileId)
      .eq('user_id', user.id)
      .single()

    if (profileError || !existingProfile) {
      return NextResponse.json({ error: 'Profile not found or access denied' }, { status: 404 })
    }

    // Prevent deletion of active version
    if (existingProfile.is_active) {
      return NextResponse.json({ error: 'Cannot delete active version. Please set another version as active first.' }, { status: 400 })
    }

    // Delete the profile version
    const { error: deleteError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', profileId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting profile:', deleteError)
      return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Profile version deleted successfully' 
    })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/profile/versions/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
