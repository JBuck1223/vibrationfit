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

    // Verify draft exists and user owns it
    const { data: draft, error: draftError } = await supabase
      .from('vision_versions')
      .select('*')
      .eq('id', draftId)
      .eq('user_id', user.id)
      .single()

    if (draftError || !draft) {
      return NextResponse.json({ 
        error: 'Draft not found or access denied' 
      }, { status: 404 })
    }

    if (!draft.is_draft) {
      return NextResponse.json({ 
        error: 'Vision is not a draft' 
      }, { status: 400 })
    }

    // Get current active vision (if exists) for deactivation
    const { data: currentActive } = await supabase
      .from('vision_versions')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('is_draft', false)
      .maybeSingle()

    // Start transaction-like operations
    // Step 1: Deactivate old active vision (if exists)
    if (currentActive) {
      const { error: deactivateError } = await supabase
        .from('vision_versions')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentActive.id)

      if (deactivateError) {
        console.error('Error deactivating old vision:', deactivateError)
        return NextResponse.json({ 
          error: 'Failed to deactivate old vision' 
        }, { status: 500 })
      }
    }

    // Step 2: Activate draft as new active vision
    const { data: newActive, error: activateError } = await supabase
      .from('vision_versions')
      .update({
        is_active: true,
        is_draft: false,
        title: draft.title?.replace('Draft', 'Active Vision') || 'Life Vision',
        updated_at: new Date().toISOString()
      })
      .eq('id', draftId)
      .select()
      .single()

    if (activateError) {
      console.error('Error activating draft:', activateError)
      
      // Rollback: Reactivate old vision if it was deactivated
      if (currentActive) {
        await supabase
          .from('vision_versions')
          .update({ 
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentActive.id)
      }
      
      return NextResponse.json({ 
        error: 'Failed to activate draft' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      vision: newActive,
      previousVersionId: currentActive?.id || null,
      message: 'Draft committed successfully'
    })
  } catch (error) {
    console.error('Error in POST /api/vision/draft/commit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

