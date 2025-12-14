// /src/app/api/vision/convert-to-household/route.ts
// API route to convert a personal vision to a household vision

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const { sourceVisionId, householdId } = await request.json()

    if (!sourceVisionId || !householdId) {
      return NextResponse.json(
        { error: 'Missing required fields: sourceVisionId, householdId' },
        { status: 400 }
      )
    }

    // 1. Verify user has access to source vision
    const { data: sourceVision, error: fetchError } = await supabase
      .from('vision_versions')
      .select('*')
      .eq('id', sourceVisionId)
      .single()

    if (fetchError || !sourceVision) {
      return NextResponse.json(
        { error: 'Source vision not found' },
        { status: 404 }
      )
    }

    // 2. Verify source is a personal vision (not already household)
    if (sourceVision.household_id) {
      return NextResponse.json(
        { error: 'Source vision is already a household vision' },
        { status: 400 }
      )
    }

    // 3. Verify user owns the source vision
    if (sourceVision.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to convert this vision' },
        { status: 403 }
      )
    }

    // 4. Verify user is a member of the target household
    // Use SECURITY DEFINER function to bypass RLS on household_members
    const { data: isMember, error: memberError } = await supabase
      .rpc('is_active_household_member', { 
        h: householdId, 
        u: user.id 
      })

    if (memberError || !isMember) {
      return NextResponse.json(
        { error: 'You are not a member of this household' },
        { status: 403 }
      )
    }

    // 5. Check if household has an active vision
    const { data: existingActive } = await supabase
      .from('vision_versions')
      .select('id')
      .eq('household_id', householdId)
      .eq('is_active', true)
      .maybeSingle()

    const shouldBeActive = !existingActive  // If no active, make this active

    // 6. Clone the vision as a household vision
    const { data: householdVision, error: cloneError } = await supabase
      .from('vision_versions')
      .insert({
        // Ownership
        user_id: user.id,                       // Creator/initiator
        household_id: householdId,              // Belongs to household
        
        // Source tracking
        parent_id: sourceVisionId,              // Track where it came from
        
        // Perspective
        perspective: 'plural',                  // "we/our" language
        
        // Copy all content (will be pluralized next)
        title: sourceVision.title ? `${sourceVision.title} (Household)` : 'Our Vision',
        forward: sourceVision.forward,
        fun: sourceVision.fun,
        travel: sourceVision.travel,
        home: sourceVision.home,
        family: sourceVision.family,
        love: sourceVision.love,
        health: sourceVision.health,
        money: sourceVision.money,
        work: sourceVision.work,
        social: sourceVision.social,
        stuff: sourceVision.stuff,
        giving: sourceVision.giving,
        spirituality: sourceVision.spirituality,
        conclusion: sourceVision.conclusion,
        
        // State: Auto-activate if first household vision
        is_draft: !shouldBeActive,              // Draft only if already have active
        is_active: shouldBeActive,              // Active if first household vision
        
        // Copy metadata if present
        richness_metadata: sourceVision.richness_metadata,
      })
      .select()
      .single()

    if (cloneError || !householdVision) {
      console.error('Error creating household vision:', cloneError)
      return NextResponse.json(
        { error: 'Failed to create household vision' },
        { status: 500 }
      )
    }

    // 7. TODO: Call VIVA to pluralize each category
    // For now, we'll return the vision and let user refine manually
    // In Phase 2, we'll add automatic VIVA pluralization here

    console.log('✅ Converted personal vision to household:', {
      sourceVisionId,
      householdVisionId: householdVision.id,
      householdId,
      isActive: shouldBeActive
    })

    return NextResponse.json({
      success: true,
      visionId: householdVision.id,
      isActive: shouldBeActive,
      isDraft: !shouldBeActive,
      message: shouldBeActive 
        ? 'Household vision created and activated!' 
        : 'Household vision created as draft'
    })

  } catch (error) {
    console.error('Error in convert-to-household:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

