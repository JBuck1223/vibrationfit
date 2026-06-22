import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/projects - list the current member's own projects/lists
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const lifeCategory = searchParams.get('life_category')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'newest'

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

    if (type && (type === 'project' || type === 'list')) {
      query = query.eq('type', type)
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
      default:
        query = query.order('created_at', { ascending: false })
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

// POST /api/projects - create a project/list owned by the current member
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, type, life_categories, status, priority, due_date } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        title: title.trim(),
        description: description || null,
        type: type === 'list' ? 'list' : 'project',
        life_categories: Array.isArray(life_categories) ? life_categories : [],
        status: status || 'planned',
        priority: priority || 'medium',
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
