// /src/app/api/vision/merge/route.ts
// API route to merge two personal visions into one household vision

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mergeVisionSections } from '@/lib/viva/merge-vision'

// Synthesizing all 14 categories runs parallel AI calls; allow time for long visions
export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const { visionId1, visionId2, householdId } = await request.json()

    if (!visionId1 || !visionId2 || !householdId) {
      return NextResponse.json(
        { error: 'Missing required fields: visionId1, visionId2, householdId' },
        { status: 400 }
      )
    }

    if (visionId1 === visionId2) {
      return NextResponse.json(
        { error: 'Cannot merge a vision with itself' },
        { status: 400 }
      )
    }

    // 1. Fetch both source visions
    const { data: visions, error: fetchError } = await supabase
      .from('vision_versions')
      .select('*')
      .in('id', [visionId1, visionId2])

    if (fetchError || !visions || visions.length !== 2) {
      return NextResponse.json(
        { error: 'Could not find both source visions' },
        { status: 404 }
      )
    }

    const vision1 = visions[0]
    const vision2 = visions[1]

    // 2. Verify both are personal visions (not household)
    if (vision1.household_id || vision2.household_id) {
      return NextResponse.json(
        { error: 'Can only merge personal visions, not household visions' },
        { status: 400 }
      )
    }

    // 3. Verify user is a member of the target household
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

    // 4. Verify user has access to at least one of the visions
    // (RLS will handle this, but we can also check explicitly)
    const userHasAccess = 
      vision1.user_id === user.id || 
      vision2.user_id === user.id

    if (!userHasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to merge these visions' },
        { status: 403 }
      )
    }

    // 5. Get owner names for attribution
    const ownerIds = [vision1.user_id, vision2.user_id].filter(Boolean)
    const { data: owners } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name')
      .in('user_id', ownerIds)
      .eq('is_active', true)

    const ownerNames = owners?.map(o => o.first_name || 'Unknown').join(' & ') || 'Unknown'

    // 6. Check if household has an active vision
    const { data: existingActive } = await supabase
      .from('vision_versions')
      .select('id')
      .eq('household_id', householdId)
      .eq('is_active', true)
      .maybeSingle()

    const shouldBeActive = !existingActive  // If no active, make this active

    // 7. Synthesize both visions per category into shared "we/our" text.
    // Falls back to the longer source text per category if the AI step fails.
    const categories = [
      'forward', 'fun', 'travel', 'home', 'family', 'love',
      'health', 'money', 'work', 'social', 'stuff', 'giving',
      'spirituality', 'conclusion'
    ]

    const nameByUserId = new Map(
      (owners || []).map(o => [o.user_id, o.first_name || 'Partner'])
    )
    const name1 = nameByUserId.get(vision1.user_id) || 'Partner 1'
    const name2 = nameByUserId.get(vision2.user_id) || 'Partner 2'

    const sectionPairs: Record<string, [string, string]> = {}
    for (const category of categories) {
      sectionPairs[category] = [
        (vision1[category as keyof typeof vision1] as string) || '',
        (vision2[category as keyof typeof vision2] as string) || '',
      ]
    }

    let mergedContent: Record<string, string> = {}
    let failedSections: string[] = []
    try {
      const synthesis = await mergeVisionSections({
        sections: sectionPairs,
        memberName1: name1,
        memberName2: name2,
        userId: user.id,
      })
      mergedContent = synthesis.sections
      failedSections = synthesis.failedSections
      console.log(`[Merge] Synthesized ${synthesis.mergedSections.length} categories` +
        (failedSections.length ? `, ${failedSections.length} fell back to longer text: ${failedSections.join(', ')}` : ''))
    } catch (err) {
      // AI unavailable entirely: fall back to the longer text per category
      console.error('[Merge] Synthesis unavailable, falling back to longer text per category:', err)
      for (const category of categories) {
        const [content1, content2] = sectionPairs[category]
        mergedContent[category] = content1.length > content2.length ? content1 : content2
      }
      failedSections = categories.filter(c => sectionPairs[c][0] || sectionPairs[c][1])
    }

    const { data: householdVision, error: createError } = await supabase
      .from('vision_versions')
      .insert({
        // Ownership
        user_id: user.id,                       // Creator/initiator
        household_id: householdId,
        
        // Source tracking (store both source IDs as JSON array)
        parent_id: null, // Not used for merges
        // Note: We could add a source_visions JSONB column for tracking multiple sources
        
        // Perspective
        perspective: 'plural',
        
        // Content (merged)
        title: `Our Merged Vision (${ownerNames})`,
        ...mergedContent,
        
        // State: Auto-activate if first household vision (activation happens
        // via set_vision_active below so cross-scope rules apply uniformly)
        is_draft: !shouldBeActive,              // Draft only if already have active
        is_active: false,
      })
      .select()
      .single()

    if (createError || !householdVision) {
      console.error('Error creating merged vision:', createError)
      return NextResponse.json(
        { error: 'Failed to create merged household vision' },
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
        console.error('Error activating merged household vision:', activateError)
        return NextResponse.json(
          { error: 'Merged vision created but could not be activated' },
          { status: 500 }
        )
      }
    }

    console.log('✅ Merged two visions into household vision:', {
      visionId1,
      visionId2,
      householdVisionId: householdVision.id,
      householdId,
      isActive: shouldBeActive,
      synthesisFailedSections: failedSections
    })

    return NextResponse.json({
      success: true,
      visionId: householdVision.id,
      isActive: shouldBeActive,
      isDraft: !shouldBeActive,
      synthesisFailedSections: failedSections,
      message: shouldBeActive
        ? `Merged visions from ${ownerNames} - now your active household vision!`
        : `Merged visions from ${ownerNames}`,
      note: shouldBeActive 
        ? 'Vision is active! Refine together to improve with VIVA.'
        : 'Draft created. Refine together to synthesize with VIVA.'
    })

  } catch (error) {
    console.error('Error in merge vision:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

