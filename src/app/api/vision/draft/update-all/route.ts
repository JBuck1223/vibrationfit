import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * PATCH /api/vision/draft/update-all
 * Updates all fields of a draft vision at once
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { draftId, visionData } = await request.json()

    if (!draftId || !visionData) {
      return NextResponse.json({ error: 'Missing draftId or visionData' }, { status: 400 })
    }

    // Verify the draft belongs to the user
    const { data: existingDraft, error: fetchError } = await supabase
      .from('vision_versions')
      .select('*')
      .eq('id', draftId)
      .eq('user_id', user.id)
      .eq('is_draft', true)
      .eq('is_active', false)
      .single()

    if (fetchError || !existingDraft) {
      return NextResponse.json({ error: 'Draft not found or access denied' }, { status: 404 })
    }

    // Update the draft with all provided fields
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
      .eq('id', draftId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating draft:', updateError)
      return NextResponse.json({ error: 'Failed to update draft', details: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      draft: updatedDraft,
      message: 'Draft updated successfully'
    })
  } catch (error) {
    console.error('Error in PATCH /api/vision/draft/update-all:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

