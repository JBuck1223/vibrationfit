import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const priority = searchParams.get('priority')
    const type = searchParams.get('type')
    const lifeCategory = searchParams.get('life_category')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'newest'

    const supabase = createAdminClient()

    let query = supabase
      .from('projects')
      .select(`
        *,
        category:project_categories(*),
        project_tag_links(tag_id, project_tags(*)),
        project_tasks(id, is_complete)
      `)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    } else {
      query = query.neq('status', 'archived')
    }

    if (category) {
      query = query.eq('category_id', category)
    }

    if (priority) {
      query = query.eq('priority', priority)
    }

    if (type && type === 'project') {
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
      case 'priority':
        query = query.order('priority', { ascending: true }).order('created_at', { ascending: false })
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
      console.error('Error fetching projects:', error)
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }

    const projects = (data || []).map((p: any) => ({
      ...p,
      tags: (p.project_tag_links || []).map((pt: any) => pt.project_tags).filter(Boolean),
      task_count: (p.project_tasks || []).length,
      task_done_count: (p.project_tasks || []).filter((t: any) => t.is_complete).length,
      project_tag_links: undefined,
      project_tasks: undefined,
    }))

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Error in projects GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const { title, description, type, category_id, life_categories, status, priority, due_date, tag_ids } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        title: title.trim(),
        description: description || null,
        type: 'project',
        category_id: category_id || null,
        life_categories: Array.isArray(life_categories) ? life_categories : [],
        status: status || 'active',
        priority: priority || 'medium',
        due_date: due_date || null,
        created_by: auth.user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', error)
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
    }

    if (tag_ids?.length > 0) {
      const tagRows = tag_ids.map((tag_id: string) => ({
        project_id: project.id,
        tag_id,
      }))
      await supabase.from('project_tag_links').insert(tagRows)
    }

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error('Error in projects POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
