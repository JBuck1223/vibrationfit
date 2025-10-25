import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ============================================================================
// Profile Versioning API Endpoints
// ============================================================================

// Schema for creating a draft from existing version
const CreateDraftSchema = z.object({
  sourceProfileId: z.string().uuid(),
  versionNotes: z.string().optional()
})

// Schema for committing a draft as active
const CommitDraftSchema = z.object({
  draftProfileId: z.string().uuid()
})

// Schema for setting a version as active
const SetActiveSchema = z.object({
  profileId: z.string().uuid()
})

// ============================================================================
// GET /api/profile/versions - Get all versions for a user
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all profile versions for the user
    const { data: profiles, error } = await supabase
      .from('user_profiles')
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
      .eq('user_id', user.id)
      .order('version_number', { ascending: false })

    if (error) {
      console.error('Error fetching profile versions:', error)
      return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 })
    }

    return NextResponse.json({ versions: profiles })
  } catch (error) {
    console.error('Unexpected error in GET /api/profile/versions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// POST /api/profile/versions/draft - Create a draft from existing version
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sourceProfileId, versionNotes } = CreateDraftSchema.parse(body)

    // Verify the source profile belongs to the user
    const { data: sourceProfile, error: sourceError } = await supabase
      .from('user_profiles')
      .select('id, user_id')
      .eq('id', sourceProfileId)
      .eq('user_id', user.id)
      .single()

    if (sourceError || !sourceProfile) {
      return NextResponse.json({ error: 'Source profile not found or access denied' }, { status: 404 })
    }

    // Use the database function to create a draft
    const { data: newDraftId, error: draftError } = await supabase
      .rpc('create_draft_from_version', {
        p_source_profile_id: sourceProfileId,
        p_user_id: user.id,
        p_version_notes: versionNotes || null
      })

    if (draftError) {
      console.error('Error creating draft:', draftError)
      return NextResponse.json({ error: 'Failed to create draft' }, { status: 500 })
    }

    // Fetch the created draft
    const { data: draft, error: fetchError } = await supabase
      .from('user_profiles')
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
      .eq('id', newDraftId)
      .single()

    if (fetchError) {
      console.error('Error fetching created draft:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch created draft' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      draft,
      message: 'Draft created successfully' 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 })
    }
    console.error('Unexpected error in POST /api/profile/versions/draft:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// PUT /api/profile/versions/commit - Commit a draft as active version
// ============================================================================
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { draftProfileId } = CommitDraftSchema.parse(body)

    // Verify the draft profile belongs to the user and is actually a draft
    const { data: draftProfile, error: draftError } = await supabase
      .from('user_profiles')
      .select('id, user_id, is_draft')
      .eq('id', draftProfileId)
      .eq('user_id', user.id)
      .eq('is_draft', true)
      .single()

    if (draftError || !draftProfile) {
      return NextResponse.json({ error: 'Draft profile not found or access denied' }, { status: 404 })
    }

    // Use the database function to commit the draft
    const { error: commitError } = await supabase
      .rpc('commit_draft_as_active', {
        p_draft_profile_id: draftProfileId,
        p_user_id: user.id
      })

    if (commitError) {
      console.error('Error committing draft:', commitError)
      return NextResponse.json({ error: 'Failed to commit draft' }, { status: 500 })
    }

    // Fetch the updated profile
    const { data: updatedProfile, error: fetchError } = await supabase
      .from('user_profiles')
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
      .eq('id', draftProfileId)
      .single()

    if (fetchError) {
      console.error('Error fetching updated profile:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch updated profile' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      profile: updatedProfile,
      message: 'Draft committed successfully' 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 })
    }
    console.error('Unexpected error in PUT /api/profile/versions/commit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// PATCH /api/profile/versions/active - Set a version as active
// ============================================================================
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { profileId } = SetActiveSchema.parse(body)

    // Verify the profile belongs to the user
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, user_id, is_draft')
      .eq('id', profileId)
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found or access denied' }, { status: 404 })
    }

    // Can't set a draft as active directly - must commit it first
    if (profile.is_draft) {
      return NextResponse.json({ error: 'Cannot set draft as active. Please commit the draft first.' }, { status: 400 })
    }

    // Use the database function to set as active
    const { error: setActiveError } = await supabase
      .rpc('set_version_active', {
        p_profile_id: profileId,
        p_user_id: user.id
      })

    if (setActiveError) {
      console.error('Error setting version as active:', setActiveError)
      return NextResponse.json({ error: 'Failed to set version as active' }, { status: 500 })
    }

    // Fetch the updated profile
    const { data: updatedProfile, error: fetchError } = await supabase
      .from('user_profiles')
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
      .eq('id', profileId)
      .single()

    if (fetchError) {
      console.error('Error fetching updated profile:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch updated profile' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      profile: updatedProfile,
      message: 'Version set as active successfully' 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 })
    }
    console.error('Unexpected error in PATCH /api/profile/versions/active:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
