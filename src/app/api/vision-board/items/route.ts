import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateImage } from '@/lib/services/imageService'
import { LIFE_CATEGORY_KEYS } from '@/lib/design-system/vision-categories'
import { getHouseholdContext } from '@/lib/household/context'
import { getShareAllMemberIds } from '@/lib/household/sharing'

// Image generation (fal/DALL-E) often takes 20-60s; avoid Vercel killing the request
export const maxDuration = 120

/**
 * GET /api/vision-board/items
 * Fetch vision board items for the authenticated user.
 *
 * Query params:
 *   scope=mine       (default) items the user created
 *   scope=household  items shared with the user's household (by any member)
 *   scope=all        union of the user's items and household-shared items
 *
 * Household-scoped items are enriched with `member` (creator attribution).
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const scope = (new URL(request.url).searchParams.get('scope') || 'mine') as
      | 'mine'
      | 'household'
      | 'all'

    // Always resolve household context so the client can decide whether to
    // surface the household lens and attribute shared items.
    const household = await getHouseholdContext(user.id)

    // Members with "share all" enabled contribute everything they created,
    // even items without an explicit household_id (visible via RLS).
    const shareAllIds = household?.isMultiMember
      ? await getShareAllMemberIds(supabase, household.householdId, 'vision_board')
      : []
    const shareAllSet = new Set(shareAllIds)

    let query = supabase.from('vision_board_items').select('*')

    if (scope === 'mine' || !household) {
      query = query.eq('user_id', user.id)
    } else {
      const conditions = [`household_id.eq.${household.householdId}`]
      if (shareAllIds.length > 0) {
        conditions.push(`user_id.in.(${shareAllIds.join(',')})`)
      }
      if (scope === 'all') {
        conditions.push(`user_id.eq.${user.id}`)
      }
      query = query.or(conditions.join(','))
    }

    const { data: items, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching vision board items:', error)
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
    }

    // Attribute shared items to their creator so the UI can show "whose" it is
    const enriched = (items || []).map((item) => ({
      ...item,
      isShared: !!item.household_id || shareAllSet.has(item.user_id),
      isMine: item.user_id === user.id,
      member: household?.memberMap?.[item.user_id]
        ? {
            userId: item.user_id,
            displayName: household.memberMap[item.user_id].displayName,
            avatarUrl: household.memberMap[item.user_id].avatarUrl,
            isSelf: item.user_id === user.id,
          }
        : null,
    }))

    return NextResponse.json({
      items: enriched,
      household: household
        ? {
            id: household.householdId,
            name: household.householdName,
            isMultiMember: household.isMultiMember,
            members: household.members,
          }
        : null,
    })

  } catch (error: any) {
    console.error('❌ VISION BOARD ITEMS GET ERROR:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch items' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/vision-board/items
 * Create a new vision board item with optional VIVA image generation
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      name, 
      description, 
      categories, 
      status = 'active',
      generateImage: shouldGenerateImage = false,
      shareWithHousehold = false,
    } = body

    // Validation
    if (!name || !description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      )
    }

    // Resolve household if the creation should be shared with the household
    let householdId: string | null = null
    if (shareWithHousehold) {
      const household = await getHouseholdContext(user.id)
      if (household?.isMultiMember) {
        householdId = household.householdId
      }
    }

    let imageUrl = null

    // Generate VIVA image if requested
    if (shouldGenerateImage) {
      console.log('🎨 Generating VIVA image for vision board item:', name)
      
      // Create a prompt from the name and description
      const imagePrompt = `${name}. ${description}`
      
      try {
        const imageResult = await generateImage({
          userId: user.id,
          prompt: imagePrompt,
          dimension: 'landscape_4_3',
          quality: 'standard',
          style: 'vivid',
          context: 'vision_board',
        })

        if (imageResult.success && imageResult.imageUrl) {
          imageUrl = imageResult.imageUrl
          console.log('✅ Image generated successfully:', imageUrl)
        } else {
          console.error('❌ Image generation failed:', imageResult.error)
          // Don't fail the whole request if image generation fails
        }
      } catch (imageError) {
        console.error('❌ Image generation error:', imageError)
        // Don't fail the whole request if image generation fails
      }
    }

    // Create vision board item
    const { data: newItem, error: insertError } = await supabase
      .from('vision_board_items')
      .insert({
        user_id: user.id,
        name,
        description,
        image_url: imageUrl,
        categories: categories || [],
        status: status || 'active',
        household_id: householdId,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating vision board item:', insertError)
      return NextResponse.json(
        { error: 'Failed to create item' },
        { status: 500 }
      )
    }

    // Check if user now has items in all 12 life categories
    // and update intensive_checklist if so
    try {
      // Get all user's vision board items
      const { data: allItems } = await supabase
        .from('vision_board_items')
        .select('categories')
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (allItems && allItems.length > 0) {
        // Collect all categories that have at least one item
        const coveredCategories = new Set<string>()
        allItems.forEach(item => {
          if (item.categories && Array.isArray(item.categories)) {
            item.categories.forEach((cat: string) => coveredCategories.add(cat))
          }
        })

        // Check if all 12 life categories are covered
        const allCategoriesCovered = LIFE_CATEGORY_KEYS.every(cat => coveredCategories.has(cat))

        if (allCategoriesCovered) {
          const now = new Date().toISOString()
          const { error: checklistError } = await supabase
            .from('intensive_checklist')
            .update({
              vision_board_completed: true,
              vision_board_completed_at: now
            })
            .eq('user_id', user.id)
            .in('status', ['pending', 'in_progress'])
            .is('vision_board_completed', false)
          
          if (!checklistError) {
            console.log('[VISION BOARD] Marked vision_board_completed in intensive_checklist')
          } else {
            console.log('[VISION BOARD] No intensive checklist to update (user may not be in intensive mode)')
          }
        } else {
          console.log(`🎨 [VISION BOARD] ${coveredCategories.size}/${LIFE_CATEGORY_KEYS.length} categories covered`)
        }
      }
    } catch (checkError) {
      // Don't fail the request if checklist update fails
      console.log('🎨 [VISION BOARD] Could not check/update intensive checklist:', checkError)
    }

    return NextResponse.json({
      success: true,
      item: newItem,
    })

  } catch (error: any) {
    console.error('❌ VISION BOARD ITEMS POST ERROR:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create item' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/vision-board/items
 * Update an existing vision board item
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    // Strip non-column helper fields that GET enrichment may have added,
    // and pull out the explicit sharing toggle.
    const {
      id,
      shareWithHousehold,
      member: _member,
      isShared: _isShared,
      isMine: _isMine,
      ...updates
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 })
    }

    // Handle the "include in household" toggle explicitly
    if (shareWithHousehold === true) {
      const household = await getHouseholdContext(user.id)
      if (household?.isMultiMember) {
        updates.household_id = household.householdId
      }
    } else if (shareWithHousehold === false) {
      // Only the creator can unshare (enforced again by RLS)
      updates.household_id = null
    }

    // Update the item. We intentionally do NOT filter by user_id here:
    // RLS allows the creator to edit their own items, and any active household
    // member to collaboratively edit items shared with the household.
    const { data: updatedItem, error: updateError } = await supabase
      .from('vision_board_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating vision board item:', updateError)
      return NextResponse.json(
        { error: 'Failed to update item' },
        { status: 500 }
      )
    }

    if (!updatedItem) {
      return NextResponse.json(
        { error: 'Item not found or you do not have permission to edit it' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      item: updatedItem,
    })

  } catch (error: any) {
    console.error('❌ VISION BOARD ITEMS PUT ERROR:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update item' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/vision-board/items
 * Delete a vision board item
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 })
    }

    // RLS enforces permission: the creator can delete their own items, and for
    // household-shared items the creator or a household admin can delete.
    const { error: deleteError } = await supabase
      .from('vision_board_items')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting vision board item:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete item' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('❌ VISION BOARD ITEMS DELETE ERROR:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete item' },
      { status: 500 }
    )
  }
}

