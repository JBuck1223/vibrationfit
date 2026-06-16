import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { normalizeProfileVersionFromRpc } from '@/lib/profile/profile-version-from-rpc'

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
        is_draft,
        is_active,
        version_notes,
        parent_version_id,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching profile versions:', error)
      return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 })
    }

    // Calculate version numbers based on chronological order
    const versionsWithCalculatedNumbers = await Promise.all((profiles || []).map(async (profile: any) => {
      const { data: calculatedVersion } = await supabase
        .rpc('get_profile_version_number', { p_profile_id: profile.id })
      return {
        ...profile,
        version_number: normalizeProfileVersionFromRpc(calculatedVersion)
      }
    }))
    
    // Sort by calculated version number (descending)
    versionsWithCalculatedNumbers.sort((a: any, b: any) => b.version_number - a.version_number)

    return NextResponse.json({ versions: versionsWithCalculatedNumbers })
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

    // Verify the source profile belongs to the user (fetch full row to clone)
    const { data: sourceProfile, error: sourceError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', sourceProfileId)
      .eq('user_id', user.id)
      .single()

    if (sourceError || !sourceProfile) {
      return NextResponse.json({ error: 'Source profile not found or access denied' }, { status: 404 })
    }

    // Create the draft by cloning the source row directly.
    // Note: this intentionally does NOT use the create_draft_from_version RPC,
    // which still inserts a removed `version_number` column on user_profiles
    // (version numbers are now derived via get_profile_version_number).
    // Only one draft per user is allowed, so remove any existing draft first.
    const { error: deleteDraftError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', user.id)
      .eq('is_draft', true)

    if (deleteDraftError) {
      console.error('Error clearing existing draft:', deleteDraftError)
      return NextResponse.json({ error: 'Failed to create draft', message: deleteDraftError.message }, { status: 500 })
    }

    // Strip identity/versioning fields so the clone gets fresh values. Any of
    // these keys that are not real columns are simply absent and ignored.
    const clonableFields: Record<string, unknown> = { ...(sourceProfile as Record<string, unknown>) }
    for (const key of [
      'id', 'created_at', 'updated_at', 'version_number',
      'parent_id', 'parent_version_id', 'is_draft', 'is_active',
    ]) {
      delete clonableFields[key]
    }

    const { data: draft, error: fetchError } = await supabase
      .from('user_profiles')
      .insert({
        ...clonableFields,
        user_id: user.id,
        is_draft: true,
        is_active: false,
        parent_id: sourceProfileId,
        version_notes: versionNotes || null,
      })
      .select(`
        id,
        is_draft,
        is_active,
        version_notes,
        parent_id,
        parent_version_id,
        created_at,
        updated_at
      `)
      .single()

    if (fetchError || !draft) {
      console.error('Error creating draft:', fetchError)
      return NextResponse.json({ error: 'Failed to create draft', message: fetchError?.message }, { status: 500 })
    }

    // Calculate version number based on chronological order
    const { data: calculatedVersion } = await supabase
      .rpc('get_profile_version_number', { p_profile_id: draft.id })
    const draftWithVersion = {
      ...draft,
      version_number: normalizeProfileVersionFromRpc(calculatedVersion)
    }

    return NextResponse.json({ 
      success: true, 
      draft: draftWithVersion,
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

    // Commit the draft as the new active version.
    // Note: this intentionally does NOT use the commit_draft_as_active RPC, which
    // still writes a removed `version_number` column on user_profiles (version
    // numbers are now derived via get_profile_version_number). The two updates are
    // ordered so the single-active and single-draft partial unique indexes are
    // never violated: deactivate the current active version first, then promote
    // the draft.
    const nowIso = new Date().toISOString()

    const { error: deactivateError } = await supabase
      .from('user_profiles')
      .update({ is_active: false, updated_at: nowIso })
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('is_draft', false)

    if (deactivateError) {
      console.error('Error committing draft (deactivate step):', deactivateError)
      return NextResponse.json({ error: 'Failed to commit draft', message: deactivateError.message }, { status: 500 })
    }

    const { error: commitError } = await supabase
      .from('user_profiles')
      .update({ is_draft: false, is_active: true, updated_at: nowIso })
      .eq('id', draftProfileId)
      .eq('user_id', user.id)

    if (commitError) {
      console.error('Error committing draft:', commitError)
      return NextResponse.json({ error: 'Failed to commit draft', message: commitError.message }, { status: 500 })
    }

    // Fetch the updated profile
    const { data: updatedProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        is_draft,
        is_active,
        version_notes,
        parent_version_id,
        created_at,
        updated_at
      `)
      .eq('id', draftProfileId)
      .single()

    if (fetchError) {
      console.error('Error fetching updated profile:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch updated profile' }, { status: 500 })
    }

    // Calculate version number based on chronological order
    const { data: calculatedVersion } = await supabase
      .rpc('get_profile_version_number', { p_profile_id: updatedProfile.id })
    const profileWithVersion = {
      ...updatedProfile,
      version_number: normalizeProfileVersionFromRpc(calculatedVersion)
    }

    return NextResponse.json({ 
      success: true, 
      profile: profileWithVersion,
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
        is_draft,
        is_active,
        version_notes,
        parent_version_id,
        created_at,
        updated_at
      `)
      .eq('id', profileId)
      .single()

    if (fetchError) {
      console.error('Error fetching updated profile:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch updated profile' }, { status: 500 })
    }

    // Calculate version number based on chronological order
    const { data: calculatedVersion } = await supabase
      .rpc('get_profile_version_number', { p_profile_id: updatedProfile.id })
    const profileWithVersion = {
      ...updatedProfile,
      version_number: normalizeProfileVersionFromRpc(calculatedVersion)
    }

    return NextResponse.json({ 
      success: true, 
      profile: profileWithVersion,
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
