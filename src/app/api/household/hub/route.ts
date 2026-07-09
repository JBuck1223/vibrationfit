// Household Hub API
//
// GET /api/household/hub - everything currently shared with the household,
// across all six shareable features, with creator attribution. Queries run
// under the user's RLS session, so "shared" is simply: rows visible to me
// that are household rows or belong to another member (share-all).

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getHouseholdContext } from '@/lib/household/context'

export const dynamic = 'force-dynamic'

const ITEM_LIMIT = 5

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
    if (!household || !household.isMultiMember) {
      return NextResponse.json({ household: household ?? null, features: null })
    }

    const sharedOr = `household_id.not.is.null,user_id.neq.${user.id}`

    const [visions, boardItems, abundance, audioSets, projects, stories] = await Promise.all([
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

    const features = {
      life_visions: {
        count: visions.count ?? 0,
        items: (visions.data || []).map((v): HubItem => ({
          id: v.id,
          title: v.household_id ? 'Life We Choose Vision' : 'Life Vision',
          sublabel: `${v.is_active ? 'Active · ' : ''}${dateLabel(v.created_at)}`,
          ownerId: v.user_id,
          createdAt: v.created_at,
          href: `/life-vision/${v.id}`,
        })),
      },
      vision_board: {
        count: boardItems.count ?? 0,
        items: (boardItems.data || []).map((i): HubItem => ({
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

    return NextResponse.json({
      household: {
        householdId: household.householdId,
        householdName: household.householdName,
        isMultiMember: household.isMultiMember,
        members: household.members.map((m) => ({
          userId: m.userId,
          firstName: m.firstName,
          displayName: m.displayName,
          avatarUrl: m.avatarUrl,
          isSelf: m.isSelf,
          isAdmin: m.isAdmin,
        })),
      },
      features,
    })
  } catch (error) {
    console.error('Error in GET /api/household/hub:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
