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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { visionData } = await request.json()

    if (!visionData) {
      return NextResponse.json({ error: 'Missing visionData' }, { status: 400 })
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
      // Update existing draft instead of creating new one
      const { data: updatedDraft, error: updateError } = await supabase
        .from('vision_versions')
        .update({
          ...visionData,
          updated_at: new Date().toISOString()
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
    const { data: existingVersions } = await supabase
      .from('vision_versions')
      .select('version_number')
      .eq('user_id', user.id)
      .order('version_number', { ascending: false })
      .limit(1)

    const nextVersion = existingVersions && existingVersions.length > 0 
      ? existingVersions[0].version_number + 1 
      : 1

    // Create new draft vision from scratch
    const { data: draft, error: createError } = await supabase
      .from('vision_versions')
      .insert({
        user_id: user.id,
        version_number: nextVersion,
        title: 'Manual Vision Draft',
        status: 'draft',
        
        // Use provided vision data
        ...visionData,
        
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
      return NextResponse.json({ error: 'Failed to create draft', details: createError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      draft,
      existed: false,
      message: 'Draft created successfully'
    })
  } catch (error) {
    console.error('Error in POST /api/vision/draft/create-manual:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

