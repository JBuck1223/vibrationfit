import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/vision/draft
 * Returns the draft vision (is_draft=true, is_active=false) for the user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the draft vision (is_draft=true, is_active=false)
    const { data: draftVision, error: draftError } = await supabase
      .from('vision_versions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_draft', true)
      .eq('is_active', false)
      .maybeSingle()

    if (draftError) {
      console.error('Error fetching draft vision:', draftError)
      return NextResponse.json({ error: 'Failed to load draft vision' }, { status: 500 })
    }

    if (!draftVision) {
      return NextResponse.json({ error: 'No draft vision found' }, { status: 404 })
    }

    return NextResponse.json({
      draftVision,
      refinedCategories: draftVision.refined_categories || [],
      refinedCount: (draftVision.refined_categories || []).length
    })
  } catch (error) {
    console.error('Error in GET /api/vision/draft:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/vision/draft?draftId=...
 * Deletes a draft vision (is_draft must be true) owned by the current user.
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const draftId = searchParams.get('draftId')

    if (!draftId) {
      return NextResponse.json({ error: 'Missing draftId' }, { status: 400 })
    }

    const { data: draft, error: fetchError } = await supabase
      .from('vision_versions')
      .select('id, user_id, is_draft')
      .eq('id', draftId)
      .single()

    if (fetchError || !draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    if (draft.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!draft.is_draft) {
      return NextResponse.json(
        { error: 'Vision is not a draft and cannot be deleted via this endpoint' },
        { status: 400 }
      )
    }

    const { error: deleteError } = await supabase
      .from('vision_versions')
      .delete()
      .eq('id', draftId)
      .eq('user_id', user.id)
      .eq('is_draft', true)

    if (deleteError) {
      console.error('Error deleting draft:', deleteError)
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete draft' },
        { status: 500 }
      )
    }

    // WIP rows in vision_new_category_state drive yellow checkmarks in the
    // /life-vision/new flow. Clear them whenever the draft is deleted so a
    // subsequent "Start Fresh" cannot re-hydrate stale completion badges.
    const { error: stateDeleteError } = await supabase
      .from('vision_new_category_state')
      .delete()
      .eq('user_id', user.id)

    if (stateDeleteError) {
      console.error('Error clearing vision_new_category_state:', stateDeleteError)
      return NextResponse.json(
        { error: stateDeleteError.message || 'Failed to clear category state' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, draftId })
  } catch (error) {
    console.error('Error in DELETE /api/vision/draft:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
