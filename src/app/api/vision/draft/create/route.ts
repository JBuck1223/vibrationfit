import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/vision/draft/create
 * Creates a draft vision based on an active vision.
 * Works for both personal and household ("Life We Choose") visions —
 * drafts are scoped per document group (one personal draft, one household draft).
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

    // Get the source vision first to know which document group we're drafting.
    // RLS enforces access (own visions + household visions the user belongs to).
    const { data: sourceVision, error: visionError } = await supabase
      .from('vision_versions')
      .select('*')
      .eq('id', visionId)
      .single()

    if (visionError || !sourceVision) {
      return NextResponse.json({ error: 'Vision not found or access denied' }, { status: 404 })
    }

    // Drafts may only be created from your own visions or household visions —
    // not from personal visions another member merely shared with you.
    if (sourceVision.user_id !== user.id && !sourceVision.household_id) {
      return NextResponse.json({ error: 'Vision not found or access denied' }, { status: 404 })
    }

    const householdId: string | null = sourceVision.household_id ?? null

    // Scope draft lookups to the same document group
    const draftQuery = () => {
      let q = supabase
        .from('vision_versions')
        .select('*')
        .eq('is_draft', true)
        .eq('is_active', false)
      if (householdId) {
        q = q.eq('household_id', householdId)
      } else {
        q = q.eq('user_id', user.id).is('household_id', null)
      }
      return q
    }

    if (replaceExisting) {
      const { data: existingDrafts, error: draftFetchError } = await draftQuery()

      if (draftFetchError) {
        console.error('Error fetching existing drafts:', draftFetchError)
        return NextResponse.json(
          { error: draftFetchError.message || 'Failed to check existing drafts' },
          { status: 500 }
        )
      }

      if (existingDrafts && existingDrafts.length > 0) {
        const { error: draftDeleteError } = await supabase
          .from('vision_versions')
          .delete()
          .in('id', existingDrafts.map(d => d.id))

        if (draftDeleteError) {
          console.error('Error deleting existing draft:', draftDeleteError)
          return NextResponse.json(
            { error: draftDeleteError.message || 'Failed to delete existing draft' },
            { status: 500 }
          )
        }
      }

      // Category state only applies to the personal fresh flow
      if (!householdId) {
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
      }
    } else {
      // Check if a draft already exists for this document group
      const { data: existingDrafts } = await draftQuery()
      const existingDraft = existingDrafts?.[0]

      if (existingDraft) {
        return NextResponse.json({
          draft: existingDraft,
          existed: true,
          message: 'Draft already exists',
        })
      }
    }

    // Create draft vision by copying the source vision
    const now = new Date().toISOString()
    const { data: draft, error: createError } = await supabase
      .from('vision_versions')
      .insert({
        user_id: user.id,
        household_id: householdId,
        title: sourceVision.title ? `${sourceVision.title} (Draft)` : 'Draft Vision',
        perspective: sourceVision.perspective || (householdId ? 'plural' : 'singular'),
        forward: sourceVision.forward || '',
        fun: sourceVision.fun || '',
        travel: sourceVision.travel || '',
        home: sourceVision.home || '',
        family: sourceVision.family || '',
        love: sourceVision.love || '',
        health: sourceVision.health || '',
        money: sourceVision.money || '',
        work: sourceVision.work || '',
        social: sourceVision.social || '',
        stuff: sourceVision.stuff || '',
        giving: sourceVision.giving || '',
        spirituality: sourceVision.spirituality || '',
        conclusion: sourceVision.conclusion || '',
        is_active: false,
        is_draft: true,
        parent_id: sourceVision.id,
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
