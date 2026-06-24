import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/projects - list the current member's own projects
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

    let query = supabase
      .from('projects')
      .select(`
        *,
        project_tasks(id, is_complete)
      `)
      .eq('created_by', user.id)

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
    }))

    return NextResponse.json({ projects })
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
    const { title, description, life_categories, due_date } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
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
