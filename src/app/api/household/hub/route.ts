// Household Hub API
//
// GET /api/household/hub - everything currently shared with the household,
// with creator attribution. Two consumers, one payload:
//
//   /account/household (legacy shape): household { id, name, ... }, members,
//     visions + boardItems (explicitly household-shared rows, service client),
//     stats.
//   /household hub (new shape): household { householdId, householdName,
//     members[] with isSelf/isAdmin }, features - recent shared items across
//     all six shareable features, queried under the user's RLS session
//     ("shared" = visible to me AND (household row OR another member's row)).

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getHouseholdContext } from '@/lib/household/context'
import { getVisionCategoryKeys } from '@/lib/design-system/vision-categories'

export const dynamic = 'force-dynamic'

const ITEM_LIMIT = 5

const VISION_SECTIONS = getVisionCategoryKeys()

function completionPercent(vision: Record<string, any>): number {
  const filled = VISION_SECTIONS.filter(
    (section) => String(vision[section] || '').trim().length > 0
  ).length
  return Math.round((filled / VISION_SECTIONS.length) * 100)
}

interface HubItem {
  id: string
  title: string
  sublabel: string | null
  ownerId: string
  createdAt: string
  href: string
}

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

    const memberOf = (userId: string) =>
      household.memberMap[userId]
        ? {
            displayName: household.memberMap[userId].displayName,
            avatarUrl: household.memberMap[userId].avatarUrl,
          }
        : null

    // ── Legacy sections: explicitly household-shared Life Visions + Vision Board
    const service = createServiceClient()

    const [{ data: visionRows }, { data: boardRows }] = await Promise.all([
      service
        .from('vision_versions')
        .select('*')
        .eq('household_id', household.householdId)
        .order('created_at', { ascending: false }),
      service
        .from('vision_board_items')
        .select('id, user_id, name, description, image_url, status, categories, created_at')
        .eq('household_id', household.householdId)
        .order('created_at', { ascending: false }),
    ])

    const visions = (visionRows || []).map((v) => ({
      id: v.id,
      title: v.title,
      user_id: v.user_id,
      perspective: v.perspective,
      is_active: v.is_active,
      is_draft: v.is_draft,
      created_at: v.created_at,
      completion_percent: completionPercent(v),
      member: memberOf(v.user_id),
    }))

    const boardItems = (boardRows || []).map((item) => ({
      ...item,
      member: memberOf(item.user_id),
    }))

    // ── New hub: recent shared items per feature, under the user's RLS session
    let features: Record<string, { count: number; items: HubItem[] }> | null = null

    if (household.isMultiMember) {
      const sharedOr = `household_id.not.is.null,user_id.neq.${user.id}`

      const [sharedVisions, sharedBoard, abundance, audioSets, projects, stories] = await Promise.all([
        supabase
          .from('vision_versions')
          .select('id, user_id, household_id, is_active, created_at', { count: 'exact' })
          .eq('is_draft', false)
          .or(sharedOr)
          .order('created_at', { ascending: false })
          .limit(ITEM_LIMIT),
        supabase
          .from('vision_board_items')
          .select('id, user_id, household_id, name, image_url, status, created_at', { count: 'exact' })
          .or(sharedOr)
          .order('created_at', { ascending: false })
          .limit(ITEM_LIMIT),
        supabase
          .from('abundance_events')
          .select('id, user_id, household_id, note, amount, value_type, date, created_at', { count: 'exact' })
          .or(sharedOr)
          .order('date', { ascending: false })
          .limit(ITEM_LIMIT),
        supabase
          .from('audio_sets')
          .select('id, user_id, household_id, name, variant, created_at', { count: 'exact' })
          .or(sharedOr)
          .order('created_at', { ascending: false })
          .limit(ITEM_LIMIT),
        supabase
          .from('projects')
          .select('id, created_by, household_id, title, status, created_at', { count: 'exact' })
          .or(`household_id.not.is.null,created_by.neq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(ITEM_LIMIT),
        supabase
          .from('stories')
          .select('id, user_id, household_id, title, word_count, created_at', { count: 'exact' })
          .or(sharedOr)
          .order('created_at', { ascending: false })
          .limit(ITEM_LIMIT),
      ])

      const dateLabel = (iso: string) =>
        new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

      features = {
        life_visions: {
          count: sharedVisions.count ?? 0,
          items: (sharedVisions.data || []).map((v): HubItem => ({
            id: v.id,
            title: v.household_id ? 'Life We Choose Vision' : 'Life Vision',
            sublabel: `${v.is_active ? 'Active · ' : ''}${dateLabel(v.created_at)}`,
            ownerId: v.user_id,
            createdAt: v.created_at,
            href: `/life-vision/${v.id}`,
          })),
        },
        vision_board: {
          count: sharedBoard.count ?? 0,
          items: (sharedBoard.data || []).map((i): HubItem => ({
            id: i.id,
            title: i.name,
            sublabel: i.status === 'actualized' ? 'Actualized' : dateLabel(i.created_at),
            ownerId: i.user_id,
            createdAt: i.created_at,
            href: '/vision-board',
          })),
        },
        abundance: {
          count: abundance.count ?? 0,
          items: (abundance.data || []).map((e): HubItem => ({
            id: e.id,
            title: e.note,
            sublabel: e.value_type === 'money' && e.amount != null
              ? `$${Number(e.amount).toLocaleString()} · ${dateLabel(e.date)}`
              : dateLabel(e.date),
            ownerId: e.user_id,
            createdAt: e.created_at,
            href: '/abundance-tracker',
          })),
        },
        audio: {
          count: audioSets.count ?? 0,
          items: (audioSets.data || []).map((s): HubItem => ({
            id: s.id,
            title: s.name,
            sublabel: dateLabel(s.created_at),
            ownerId: s.user_id,
            createdAt: s.created_at,
            href: '/audio',
          })),
        },
        projects: {
          count: projects.count ?? 0,
          items: (projects.data || []).map((p): HubItem => ({
            id: p.id,
            title: p.title,
            sublabel: p.status === 'done' ? 'Complete' : dateLabel(p.created_at),
            ownerId: p.created_by,
            createdAt: p.created_at,
            href: `/projects/${p.id}`,
          })),
        },
        stories: {
          count: stories.count ?? 0,
          items: (stories.data || []).map((s): HubItem => ({
            id: s.id,
            title: s.title || 'Untitled Story',
            sublabel: s.word_count ? `${Number(s.word_count).toLocaleString()} words` : dateLabel(s.created_at),
            ownerId: s.user_id,
            createdAt: s.created_at,
            href: `/story/${s.id}`,
          })),
        },
      }
    }

    return NextResponse.json({
      household: {
        // Legacy keys (account page)
        id: household.householdId,
        name: household.householdName,
        planType: household.planType,
        isMultiMember: household.isMultiMember,
        isAdmin: household.isAdmin,
        sharedTokensEnabled: household.sharedTokensEnabled,
        // New keys (household hub page)
        householdId: household.householdId,
        householdName: household.householdName,
        members: household.members.map((m) => ({
          userId: m.userId,
          firstName: m.firstName,
          displayName: m.displayName,
          avatarUrl: m.avatarUrl,
          isSelf: m.isSelf,
          isAdmin: m.isAdmin,
        })),
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
      features,
    })
  } catch (error) {
    console.error('Error in GET /api/household/hub:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
