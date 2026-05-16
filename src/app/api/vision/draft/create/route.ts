import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/vision/draft/create
 * Creates a draft vision based on an active vision
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { visionId, replaceExisting = false } = await request.json()

    if (!visionId) {
      return NextResponse.json({ error: 'Missing visionId' }, { status: 400 })
    }

    if (replaceExisting) {
      const { error: draftDeleteError } = await supabase
        .from('vision_versions')
        .delete()
        .eq('user_id', user.id)
        .eq('is_draft', true)
        .eq('is_active', false)

      if (draftDeleteError) {
        console.error('Error deleting existing draft:', draftDeleteError)
        return NextResponse.json(
          { error: draftDeleteError.message || 'Failed to delete existing draft' },
          { status: 500 }
        )
      }

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
    } else {
      // Check if draft already exists for this user
      const { data: existingDraft } = await supabase
        .from('vision_versions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_draft', true)
        .eq('is_active', false)
        .maybeSingle()

      if (existingDraft) {
        return NextResponse.json({
          draft: existingDraft,
          existed: true,
          message: 'Draft already exists',
        })
      }
    }

    // Get the active vision to base draft on
    const { data: activeVision, error: visionError } = await supabase
      .from('vision_versions')
      .select('*')
      .eq('id', visionId)
      .eq('user_id', user.id)
      .single()

    if (visionError || !activeVision) {
      return NextResponse.json({ error: 'Vision not found or access denied' }, { status: 404 })
    }

    // Create draft vision by copying active vision
    const now = new Date().toISOString()
    const { data: draft, error: createError } = await supabase
      .from('vision_versions')
      .insert({
        user_id: user.id,
        title: activeVision.title ? `${activeVision.title} (Draft)` : 'Draft Vision',
        forward: activeVision.forward || '',
        fun: activeVision.fun || '',
        travel: activeVision.travel || '',
        home: activeVision.home || '',
        family: activeVision.family || '',
        love: activeVision.love || '',
        health: activeVision.health || '',
        money: activeVision.money || '',
        work: activeVision.work || '',
        social: activeVision.social || '',
        stuff: activeVision.stuff || '',
        giving: activeVision.giving || '',
        spirituality: activeVision.spirituality || '',
        conclusion: activeVision.conclusion || '',
        is_active: false,
        is_draft: true,
        parent_id: activeVision.id,
        refined_categories: [],
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating draft:', createError)
      return NextResponse.json({ error: 'Failed to create draft' }, { status: 500 })
    }

    return NextResponse.json({ 
      draft,
      existed: false,
      message: 'Draft created successfully'
    })
  } catch (error) {
    console.error('Error in POST /api/vision/draft/create:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

