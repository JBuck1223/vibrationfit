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
