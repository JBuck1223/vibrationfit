import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function buildTaskTree(tasks: any[]): any[] {
  const topLevel: any[] = []
  const byParent = new Map<string, any[]>()

  for (const t of tasks) {
    if (t.parent_task_id) {
      const arr = byParent.get(t.parent_task_id) || []
      arr.push(t)
      byParent.set(t.parent_task_id, arr)
    } else {
      topLevel.push(t)
    }
  }

  for (const parent of topLevel) {
    parent.subtasks = (byParent.get(parent.id) || []).sort((a: any, b: any) => a.sort_order - b.sort_order)
  }

  return topLevel
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_tasks(*)
      `)
      .eq('id', id)
      .eq('created_by', user.id)
      .order('sort_order', { referencedTable: 'project_tasks', ascending: true })
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }
      console.error('Error fetching member project:', error)
      return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
    }

    const result = {
      ...project,
      tasks: buildTaskTree(project.project_tasks || []),
      task_count: (project.project_tasks || []).length,
      task_done_count: (project.project_tasks || []).filter((t: any) => t.is_complete).length,
      project_tasks: undefined,
    }

    return NextResponse.json({ project: result })
  } catch (error) {
    console.error('Error in member project GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { title, description, life_categories, status, sort_order, due_date } = body

    const VALID_STATUSES = ['active', 'done', 'archived']
    const updates: Record<string, unknown> = {}
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (life_categories !== undefined) updates.life_categories = Array.isArray(life_categories) ? life_categories : []
    if (status !== undefined && VALID_STATUSES.includes(status)) updates.status = status
    if (sort_order !== undefined) updates.sort_order = sort_order
    if (due_date !== undefined) updates.due_date = due_date || null

    const { data: project, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .eq('created_by', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating member project:', error)
      return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Error in member project PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('created_by', user.id)

    if (error) {
      console.error('Error deleting member project:', error)
      return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in member project DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
