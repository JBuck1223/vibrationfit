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
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'newest'

    const supabase = createAdminClient()

    let query = supabase
      .from('idea_projects')
      .select(`
        *,
        category:idea_categories(*),
        idea_project_tags(tag_id, idea_tags(*)),
        idea_tasks(id, is_complete)
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
      console.error('Error fetching ideas:', error)
      return NextResponse.json({ error: 'Failed to fetch ideas' }, { status: 500 })
    }

    const projects = (data || []).map((p: any) => ({
      ...p,
      tags: (p.idea_project_tags || []).map((pt: any) => pt.idea_tags).filter(Boolean),
      task_count: (p.idea_tasks || []).length,
      task_done_count: (p.idea_tasks || []).filter((t: any) => t.is_complete).length,
      idea_project_tags: undefined,
      idea_tasks: undefined,
    }))

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Error in ideas GET:', error)
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
    const { title, description, category_id, status, priority, due_date, tag_ids } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: project, error } = await supabase
      .from('idea_projects')
      .insert({
        title: title.trim(),
        description: description || null,
        category_id: category_id || null,
        status: status || 'idea',
        priority: priority || 'medium',
        due_date: due_date || null,
        created_by: auth.user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating idea:', error)
      return NextResponse.json({ error: 'Failed to create idea' }, { status: 500 })
    }

    if (tag_ids?.length > 0) {
      const tagRows = tag_ids.map((tag_id: string) => ({
        project_id: project.id,
        tag_id,
      }))
      await supabase.from('idea_project_tags').insert(tagRows)
    }

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error('Error in ideas POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
