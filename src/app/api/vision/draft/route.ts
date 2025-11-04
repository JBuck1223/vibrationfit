import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'

/**
 * GET /api/vision/draft
 * Returns a draft vision that combines:
 * - Active vision values for categories without refinement drafts
 * - Refinement draft values for categories with drafts
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const visionId = searchParams.get('id')

    if (!visionId) {
      return NextResponse.json({ error: 'Missing visionId parameter' }, { status: 400 })
    }

    // Get the active vision
    const { data: vision, error: visionError } = await supabase
      .from('vision_versions')
      .select('*')
      .eq('id', visionId)
      .eq('user_id', user.id)
      .single()

    if (visionError || !vision) {
      return NextResponse.json({ error: 'Vision not found' }, { status: 404 })
    }

    // Get all refinement drafts for this vision
    const { data: refinements, error: refinementsError } = await supabase
      .from('refinements')
      .select('category, output_text, created_at')
      .eq('user_id', user.id)
      .eq('vision_id', visionId)
      .eq('operation_type', 'refine_vision')
      .order('created_at', { ascending: false })

    if (refinementsError) {
      console.error('Error fetching refinements:', refinementsError)
      // Continue even if refinements fetch fails - we'll just use active vision
    }

    // Build draft vision by combining active vision with refinement drafts
    const draftVision = { ...vision }
    const draftCategories: string[] = []
    const activeCategories: string[] = []

    // Map refinements by category (take the most recent one per category)
    const refinementMap = new Map<string, string>()
    if (refinements) {
      refinements.forEach((refinement: any) => {
        if (refinement.category && refinement.output_text && !refinementMap.has(refinement.category)) {
          refinementMap.set(refinement.category, refinement.output_text)
        }
      })
    }

    // Combine vision values with draft refinements
    VISION_CATEGORIES.forEach(category => {
      const categoryKey = category.key as keyof typeof vision
      
      if (refinementMap.has(category.key)) {
        // Use draft value from refinement
        const draftValue = refinementMap.get(category.key)!
        draftVision[categoryKey] = draftValue as any
        draftCategories.push(category.key)
      } else {
        // Use active vision value (already in draftVision)
        activeCategories.push(category.key)
      }
    })

    // Calculate completion percentage for draft
    const completedSections = VISION_CATEGORIES.filter(category => {
      const categoryKey = category.key as keyof typeof draftVision
      const value = draftVision[categoryKey] as string
      return value && value.trim().length > 0
    })
    const draftCompletionPercentage = Math.round((completedSections.length / VISION_CATEGORIES.length) * 100)

    return NextResponse.json({
      draftVision: {
        ...draftVision,
        completion_percent: draftCompletionPercentage,
        status: 'draft'
      },
      draftCategories,
      activeCategories,
      draftCount: draftCategories.length,
      totalCategories: VISION_CATEGORIES.length
    })
  } catch (error) {
    console.error('Error in GET /api/vision/draft:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

