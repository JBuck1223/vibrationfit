import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/vision/draft/commit
 * Commits a draft vision as the new active vision
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { draftId } = await request.json()

    if (!draftId) {
      return NextResponse.json({ error: 'Missing draftId' }, { status: 400 })
    }

    console.log('✅ Committing draft:', draftId, 'for user:', user.id)

    // Verify draft exists and user has access to it
    const { data: draft, error: draftError } = await supabase
      .from('vision_versions')
      .select('id, user_id, household_id, is_draft')
      .eq('id', draftId)
      .single()

    if (draftError || !draft) {
      return NextResponse.json({ 
        error: 'Draft not found' 
      }, { status: 404 })
    }

    if (!draft.is_draft) {
      return NextResponse.json({ 
        error: 'Vision is not a draft' 
      }, { status: 400 })
    }

    // Use the database function to commit the draft
    // This handles both personal and household visions correctly
    const { error: commitError } = await supabase.rpc('commit_vision_draft_as_active', {
      p_draft_vision_id: draftId,
      p_user_id: user.id
    })

    if (commitError) {
      console.error('Error committing draft:', commitError)
      return NextResponse.json({ 
        error: commitError.message || 'Failed to commit draft' 
      }, { status: 500 })
    }

    // Fetch the newly committed vision
    const { data: newActive, error: fetchError } = await supabase
      .from('vision_versions')
      .select('*')
      .eq('id', draftId)
      .single()

    if (fetchError || !newActive) {
      console.error('Error fetching committed vision:', fetchError)
      return NextResponse.json({ 
        error: 'Failed to fetch committed vision' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      vision: newActive,
      message: 'Draft committed successfully'
    })
  } catch (error) {
    console.error('Error in POST /api/vision/draft/commit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

