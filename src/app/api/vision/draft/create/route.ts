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

    const { visionId } = await request.json()

    if (!visionId) {
      return NextResponse.json({ error: 'Missing visionId' }, { status: 400 })
    }

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
        message: 'Draft already exists'
      })
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
    const { data: draft, error: createError } = await supabase
      .from('vision_versions')
      .insert({
        user_id: user.id,
        version_number: activeVision.version_number,
        title: activeVision.title ? `${activeVision.title} (Draft)` : 'Draft Vision',
        status: 'draft',
        completion_percent: activeVision.completion_percent || 0,
        
        // Copy all category content
        forward: activeVision.forward || '',
        fun: activeVision.fun || '',
        travel: activeVision.travel || '',
        home: activeVision.home || '',
        family: activeVision.family || '',
        love: activeVision.love || activeVision.romance || '',
        health: activeVision.health || '',
        money: activeVision.money || '',
        work: activeVision.work || activeVision.business || '',
        social: activeVision.social || '',
        stuff: activeVision.stuff || activeVision.possessions || '',
        giving: activeVision.giving || '',
        spirituality: activeVision.spirituality || '',
        conclusion: activeVision.conclusion || '',
        
        // Draft flags
        is_active: false,
        is_draft: true,
        
        // Tracking
        refined_categories: [],
        
        // Timestamps
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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

