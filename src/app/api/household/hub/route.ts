import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getHouseholdContext } from '@/lib/household/context'
import { getVisionCategoryKeys } from '@/lib/design-system/vision-categories'

const VISION_SECTIONS = getVisionCategoryKeys()

function completionPercent(vision: Record<string, any>): number {
  const filled = VISION_SECTIONS.filter(
    (section) => String(vision[section] || '').trim().length > 0
  ).length
  return Math.round((filled / VISION_SECTIONS.length) * 100)
}

/**
 * GET /api/household/hub
 * Aggregated collaborative view for the Household home:
 * members, shared Life Visions, and shared Vision Board creations.
 * Uses the service client to safely read content shared by all members.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const household = await getHouseholdContext(user.id)
    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    const service = createServiceClient()

    // Shared Life Visions
    const { data: visionRows } = await service
      .from('vision_versions')
      .select('*')
      .eq('household_id', household.householdId)
      .order('created_at', { ascending: false })

    const visions = (visionRows || []).map((v) => ({
      id: v.id,
      title: v.title,
      user_id: v.user_id,
      perspective: v.perspective,
      is_active: v.is_active,
      is_draft: v.is_draft,
      created_at: v.created_at,
      completion_percent: completionPercent(v),
      member: household.memberMap[v.user_id]
        ? {
            displayName: household.memberMap[v.user_id].displayName,
            avatarUrl: household.memberMap[v.user_id].avatarUrl,
          }
        : null,
    }))

    // Shared Vision Board creations
    const { data: boardRows } = await service
      .from('vision_board_items')
      .select('id, user_id, name, description, image_url, status, categories, created_at')
      .eq('household_id', household.householdId)
      .order('created_at', { ascending: false })

    const boardItems = (boardRows || []).map((item) => ({
      ...item,
      member: household.memberMap[item.user_id]
        ? {
            displayName: household.memberMap[item.user_id].displayName,
            avatarUrl: household.memberMap[item.user_id].avatarUrl,
          }
        : null,
    }))

    return NextResponse.json({
      household: {
        id: household.householdId,
        name: household.householdName,
        planType: household.planType,
        isMultiMember: household.isMultiMember,
        isAdmin: household.isAdmin,
        sharedTokensEnabled: household.sharedTokensEnabled,
      },
      members: household.members,
      visions,
      boardItems,
      stats: {
        memberCount: household.members.length,
        visionCount: visions.length,
        boardItemCount: boardItems.length,
        actualizedCount: boardItems.filter((i) => i.status === 'actualized').length,
      },
    })
  } catch (error: any) {
    console.error('Error in GET /api/household/hub:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
