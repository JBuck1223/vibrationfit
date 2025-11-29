import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/vision/draft/create-manual
 * Creates a draft vision from scratch (manual entry)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('❌ Auth error:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { visionData } = await request.json()

    if (!visionData) {
      return NextResponse.json({ error: 'Missing visionData' }, { status: 400 })
    }

    console.log('📝 Creating manual vision draft for user:', user.id)

    // Check if draft already exists for this user
    const { data: existingDraft } = await supabase
      .from('vision_versions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_draft', true)
      .eq('is_active', false)
      .maybeSingle()

    if (existingDraft) {
      // Update existing draft instead of creating new one
      const { data: updatedDraft, error: updateError } = await supabase
        .from('vision_versions')
        .update({
          forward: visionData.forward || '',
          fun: visionData.fun || '',
          travel: visionData.travel || '',
          home: visionData.home || '',
          family: visionData.family || '',
          love: visionData.love || '',
          health: visionData.health || '',
          money: visionData.money || '',
          work: visionData.work || '',
          social: visionData.social || '',
          stuff: visionData.stuff || '',
          giving: visionData.giving || '',
          spirituality: visionData.spirituality || '',
          conclusion: visionData.conclusion || ''
        })
        .eq('id', existingDraft.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating existing draft:', updateError)
        return NextResponse.json({ error: 'Failed to update existing draft' }, { status: 500 })
      }

      return NextResponse.json({ 
        draft: updatedDraft,
        existed: true,
        message: 'Existing draft updated'
      })
    }

    // Get next version number
    console.log('📊 Creating draft for user:', user.id)

    // Create draft vision
    const { data: draft, error: createError } = await supabase
      .from('vision_versions')
      .insert({
        user_id: user.id,
        title: 'Manual Vision Draft',
        forward: visionData.forward || '',
        fun: visionData.fun || '',
        travel: visionData.travel || '',
        home: visionData.home || '',
        family: visionData.family || '',
        love: visionData.love || '',
        health: visionData.health || '',
        money: visionData.money || '',
        work: visionData.work || '',
        social: visionData.social || '',
        stuff: visionData.stuff || '',
        giving: visionData.giving || '',
        spirituality: visionData.spirituality || '',
        conclusion: visionData.conclusion || '',
        is_draft: true,
        is_active: false,
        richness_metadata: {},
        perspective: 'singular'
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ Error creating draft:', createError)
      console.error('❌ Full error object:', JSON.stringify(createError, null, 2))
      console.error('❌ Insert data was:', {
        user_id: user.id,
        title: 'Manual Vision Draft',
        completion_percent: visionData.completion_percent || 0,
        is_active: false,
        is_draft: true
      })
      return NextResponse.json({ 
        error: 'Failed to create draft', 
        details: createError.message,
        hint: createError.hint,
        code: createError.code,
        fullError: createError
      }, { status: 500 })
    }

    return NextResponse.json({ 
      draft,
      existed: false,
      message: 'Draft created successfully'
    })
  } catch (error) {
    console.error('❌ CAUGHT ERROR in POST /api/vision/draft/create-manual:', error)
    console.error('❌ Error type:', typeof error)
    console.error('❌ Error stringified:', JSON.stringify(error, null, 2))
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    return NextResponse.json({ 
      error: errorMessage,
      stack: errorStack,
      type: typeof error,
      raw: String(error)
    }, { status: 500 })
  }
}

