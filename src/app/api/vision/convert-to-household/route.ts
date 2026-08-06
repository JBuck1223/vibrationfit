// /src/app/api/vision/convert-to-household/route.ts
// API route to convert a personal vision to a household vision

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { pluralizeVisionSections } from '@/lib/viva/pluralize-vision'

// Pluralizing all 14 sections runs parallel AI calls; allow time for long visions
export const maxDuration = 300

const VISION_SECTION_KEYS = [
  'forward', 'fun', 'travel', 'home', 'family', 'love',
  'health', 'money', 'work', 'social', 'stuff', 'giving',
  'spirituality', 'conclusion',
] as const

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

    // 1. Verify user is a member of the target household
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

    // 2. Fetch source vision using service client (bypasses RLS so any
    //    household member can convert another member's personal vision)
    const { createServiceClient } = await import('@/lib/supabase/service')
    const serviceClient = createServiceClient()

    const { data: sourceVision, error: fetchError } = await serviceClient
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

    // 3. Verify source is a personal vision (not already household)
    if (sourceVision.household_id) {
      return NextResponse.json(
        { error: 'Source vision is already a household vision' },
        { status: 400 }
      )
    }

    // 4. Verify the source vision owner is also in this household
    const { data: ownerIsMember } = await supabase
      .rpc('is_active_household_member', {
        h: householdId,
        u: sourceVision.user_id
      })

    if (!ownerIsMember) {
      return NextResponse.json(
        { error: 'Vision owner is not a member of this household' },
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

    // 6. Rewrite section text into "we/our" household perspective.
    // Household member first names let VIVA fold partner references
    // (e.g. "Jordan and I") into "we". Falls back to the original text
    // per section if the AI step fails.
    const { data: members } = await serviceClient
      .from('household_members')
      .select('user_id')
      .eq('household_id', householdId)
      .eq('status', 'active')

    const memberIds = (members || []).map(m => m.user_id).filter(Boolean)
    let memberFirstNames: string[] = []
    if (memberIds.length > 0) {
      const { data: profiles } = await serviceClient
        .from('user_profiles')
        .select('first_name')
        .in('user_id', memberIds)
        .eq('is_active', true)
      memberFirstNames = (profiles || []).map(p => p.first_name).filter(Boolean)
    }

    const sourceSections: Record<string, string | null> = {}
    for (const key of VISION_SECTION_KEYS) {
      sourceSections[key] = sourceVision[key] ?? null
    }

    let pluralizedSections = sourceSections
    let failedSections: string[] = []
    try {
      const pluralized = await pluralizeVisionSections({
        sections: sourceSections,
        memberFirstNames,
        userId: user.id,
        visionId: sourceVisionId,
      })
      pluralizedSections = pluralized.sections
      failedSections = pluralized.failedSections
      console.log(`[Convert] Pluralized ${pluralized.pluralizedSections.length} sections` +
        (failedSections.length ? `, ${failedSections.length} kept original text: ${failedSections.join(', ')}` : ''))
    } catch (err) {
      console.error('[Convert] Pluralization unavailable, copying text as-is:', err)
    }

    // 7. Clone the vision as a household vision
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
        
        title: sourceVision.title ? `${sourceVision.title} (Household)` : 'Our Vision',
        ...pluralizedSections,
        
        // State: Auto-activate if first household vision (activation happens
        // via set_vision_active below so cross-scope rules apply uniformly)
        is_draft: !shouldBeActive,              // Draft only if already have active
        is_active: false,
        
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

    // 7b. Activate through set_vision_active so the same rules run as when
    // committing a household draft (deactivates other household actives and
    // the actor's personal active vision).
    if (shouldBeActive) {
      const { error: activateError } = await supabase
        .rpc('set_vision_active', {
          p_vision_id: householdVision.id,
          p_user_id: user.id
        })

      if (activateError) {
        console.error('Error activating household vision:', activateError)
        return NextResponse.json(
          { error: 'Household vision created but could not be activated' },
          { status: 500 }
        )
      }
    }

    console.log('✅ Converted personal vision to household:', {
      sourceVisionId,
      householdVisionId: householdVision.id,
      householdId,
      isActive: shouldBeActive,
      pluralizationFailedSections: failedSections
    })

    return NextResponse.json({
      success: true,
      visionId: householdVision.id,
      isActive: shouldBeActive,
      isDraft: !shouldBeActive,
      pluralizationFailedSections: failedSections,
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

