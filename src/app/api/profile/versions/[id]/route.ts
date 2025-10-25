import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ============================================================================
// Individual Profile Version API Endpoints
// ============================================================================

// Schema for updating profile completion percentage
const UpdateCompletionSchema = z.object({
  completionPercentage: z.number().min(0).max(100)
})

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
      .select(`
        *,
        parent_version:parent_version_id(
          id,
          version_number,
          version_notes,
          created_at
        )
      `)
      .eq('id', profileId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching profile version:', error)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({ profile })
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

    // Handle completion percentage update
    if (body.completionPercentage !== undefined) {
      const { completionPercentage } = UpdateCompletionSchema.parse({ completionPercentage: body.completionPercentage })
      updateData.completion_percentage = completionPercentage
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
        completion_percentage,
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
