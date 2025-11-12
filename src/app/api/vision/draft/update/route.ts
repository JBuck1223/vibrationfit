import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * PATCH /api/vision/draft/update
 * Updates a specific category in a draft vision
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { draftId, category, content } = await request.json()

    if (!draftId || !category) {
      return NextResponse.json({ 
        error: 'Missing required fields: draftId, category' 
      }, { status: 400 })
    }

    // Verify draft exists and user owns it
    const { data: draft, error: draftError } = await supabase
      .from('vision_versions')
      .select('id, user_id, is_draft, is_active')
      .eq('id', draftId)
      .eq('user_id', user.id)
      .single()

    if (draftError || !draft) {
      return NextResponse.json({ 
        error: 'Draft not found or access denied' 
      }, { status: 404 })
    }

    if (!draft.is_draft || draft.is_active) {
      return NextResponse.json({ 
        error: 'Vision is not a draft' 
      }, { status: 400 })
    }

    // Valid category names (map to actual column names)
    const validCategories = [
      'forward', 'fun', 'travel', 'home', 'family', 'love', 'health',
      'money', 'work', 'social', 'stuff', 'giving', 'spirituality', 'conclusion'
    ]

    if (!validCategories.includes(category)) {
      return NextResponse.json({ 
        error: `Invalid category: ${category}` 
      }, { status: 400 })
    }

    // Get current refined_categories
    const { data: currentDraft } = await supabase
      .from('vision_versions')
      .select('refined_categories')
      .eq('id', draftId)
      .single()

    let refinedCategories = currentDraft?.refined_categories || []
    
    // Add category to refined list if not already present
    if (!refinedCategories.includes(category)) {
      refinedCategories = [...refinedCategories, category]
    }

    // Update the specific category and refined_categories tracking
    const updates: any = {
      [category]: content || '',
      refined_categories: refinedCategories,
      updated_at: new Date().toISOString()
    }

    const { data: updatedDraft, error: updateError } = await supabase
      .from('vision_versions')
      .update(updates)
      .eq('id', draftId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating draft:', updateError)
      return NextResponse.json({ error: 'Failed to update draft' }, { status: 500 })
    }

    return NextResponse.json({ 
      draft: updatedDraft,
      category,
      refinedCategories: updatedDraft.refined_categories || [],
      message: 'Draft updated successfully'
    })
  } catch (error) {
    console.error('Error in PATCH /api/vision/draft/update:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

