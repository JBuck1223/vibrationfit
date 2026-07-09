import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getHouseholdContext } from '@/lib/household/context'
import { getShareAllMemberIds } from '@/lib/household/sharing'

export const dynamic = 'force-dynamic'

// GET /api/projects - list the member's projects (scope=all adds household-shared)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const lifeCategory = searchParams.get('life_category')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'sort_order'
    const scope = searchParams.get('scope') === 'all' ? 'all' : 'mine'

    const household = await getHouseholdContext(user.id)

    let query = supabase
      .from('projects')
      .select(`
        *,
        project_tasks(id, is_complete)
      `)

    if (scope === 'all' && household?.isMultiMember) {
      const shareAllIds = await getShareAllMemberIds(supabase, household.householdId, 'projects')
      const conditions = [`created_by.eq.${user.id}`, `household_id.eq.${household.householdId}`]
      if (shareAllIds.length > 0) {
        conditions.push(`created_by.in.(${shareAllIds.join(',')})`)
      }
      query = query.or(conditions.join(','))
    } else {
      query = query.eq('created_by', user.id)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    } else {
      query = query.neq('status', 'archived')
    }

    if (lifeCategory) {
      query = query.contains('life_categories', [lifeCategory])
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    switch (sort) {
      case 'oldest':
        query = query.order('created_at', { ascending: true })
        break
      case 'due_date':
        query = query.order('due_date', { ascending: true, nullsFirst: false })
        break
      case 'updated':
        query = query.order('updated_at', { ascending: false })
        break
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      default:
        query = query.order('sort_order', { ascending: false })
    }

    const { data, error } = await query
    if (error) {
      console.error('Error fetching member projects:', error)
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }

    const projects = (data || []).map((p: any) => ({
      ...p,
      task_count: (p.project_tasks || []).length,
      task_done_count: (p.project_tasks || []).filter((t: any) => t.is_complete).length,
      project_tasks: undefined,
      isMine: p.created_by === user.id,
      member: household?.memberMap?.[p.created_by]
        ? {
            userId: p.created_by,
            displayName: household.memberMap[p.created_by].displayName,
            avatarUrl: household.memberMap[p.created_by].avatarUrl,
            isSelf: p.created_by === user.id,
          }
        : null,
    }))

    return NextResponse.json({
      projects,
      household: household?.isMultiMember
        ? {
            id: household.householdId,
            name: household.householdName,
            isMultiMember: household.isMultiMember,
            members: household.members,
          }
        : null,
    })
  } catch (error) {
    console.error('Error in member projects GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/projects - create a project owned by the current member
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, life_categories, due_date, shareWithHousehold } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    let householdId: string | null = null
    if (shareWithHousehold === true) {
      const household = await getHouseholdContext(user.id)
      if (household?.isMultiMember) {
        householdId = household.householdId
      }
    }

    // Get max sort_order for this user to place new project at top
    const { data: maxRow } = await supabase
      .from('projects')
      .select('sort_order')
      .eq('created_by', user.id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const nextSortOrder = (maxRow?.sort_order ?? 0) + 1

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        title: title.trim(),
        description: description || null,
        type: 'project',
        life_categories: Array.isArray(life_categories) ? life_categories : [],
        status: 'active',
        priority: 'medium',
        sort_order: nextSortOrder,
        due_date: due_date || null,
        created_by: user.id,
        household_id: householdId,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating member project:', error)
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
    }

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error('Error in member projects POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/projects - bulk update sort_order for drag-and-drop reordering
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { updates } = body as { updates: { id: string; sort_order: number }[] }

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'updates array is required' }, { status: 400 })
    }

    for (const { id, sort_order } of updates) {
      const { error } = await supabase
        .from('projects')
        .update({ sort_order })
        .eq('id', id)
        .eq('created_by', user.id)

      if (error) {
        console.error('Error updating sort_order:', error)
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in member projects PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
