import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { IdeaTask } from '@/lib/projects/types'

export const dynamic = 'force-dynamic'

function buildTaskTree(tasks: IdeaTask[]): IdeaTask[] {
  const topLevel: IdeaTask[] = []
  const byParent = new Map<string, IdeaTask[]>()

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
    parent.subtasks = (byParent.get(parent.id) || []).sort((a, b) => a.sort_order - b.sort_order)
  }

  return topLevel
}

// Confirm the current member can collaborate on the project: RLS returns the
// row for the owner and for household members it is shared with.
async function assertOwnership(supabase: any, projectId: string, _userId: string) {
  const { data } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .single()
  return !!data
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

    const { data, error } = await supabase
      .from('project_tasks')
      .select('*')
      .eq('project_id', id)
      .order('sort_order', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    const tree = buildTaskTree((data || []) as IdeaTask[])
    return NextResponse.json({ tasks: tree })
  } catch (error) {
    console.error('Error in member tasks GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
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
    if (!(await assertOwnership(supabase, id, user.id))) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const body = await request.json()
    const { title, parent_task_id, description } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const siblingFilter = supabase
      .from('project_tasks')
      .select('sort_order')
      .eq('project_id', id)
      .order('sort_order', { ascending: false })
      .limit(1)

    if (parent_task_id) {
      siblingFilter.eq('parent_task_id', parent_task_id)
    } else {
      siblingFilter.is('parent_task_id', null)
    }

    const { data: existing } = await siblingFilter
    const nextOrder = existing?.[0] ? existing[0].sort_order + 1 : 0

    const insertPayload: Record<string, unknown> = {
      project_id: id,
      title: title.trim(),
      sort_order: nextOrder,
    }
    if (parent_task_id) insertPayload.parent_task_id = parent_task_id
    if (description !== undefined) insertPayload.description = description || null

    const { data, error } = await supabase
      .from('project_tasks')
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      console.error('Member task creation error:', error)
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
    }

    return NextResponse.json({ task: data }, { status: 201 })
  } catch (error) {
    console.error('Error in member tasks POST:', error)
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
    const { task_id, title, is_complete, sort_order, description, target_project_id } = body

    if (!task_id) {
      return NextResponse.json({ error: 'task_id is required' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}
    if (title !== undefined) updates.title = title
    if (is_complete !== undefined) updates.is_complete = is_complete
    if (sort_order !== undefined) updates.sort_order = sort_order
    if (description !== undefined) updates.description = description

    // Move the task to another project (RLS confirms access to the target).
    const isMove = target_project_id && target_project_id !== id
    if (isMove) {
      const { data: target } = await supabase
        .from('projects')
        .select('id')
        .eq('id', target_project_id)
        .single()
      if (!target) {
        return NextResponse.json({ error: 'Target project not found' }, { status: 404 })
      }

      const { data: existing } = await supabase
        .from('project_tasks')
        .select('sort_order')
        .eq('project_id', target_project_id)
        .is('parent_task_id', null)
        .order('sort_order', { ascending: false })
        .limit(1)

      updates.project_id = target_project_id
      // A moved subtask becomes a top-level task in the target project
      updates.parent_task_id = null
      updates.sort_order = existing?.[0] ? existing[0].sort_order + 1 : 0
    }

    const { data, error } = await supabase
      .from('project_tasks')
      .update(updates)
      .eq('id', task_id)
      .eq('project_id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
    }

    // Bring any subtasks along with their parent
    if (isMove) {
      const { error: subError } = await supabase
        .from('project_tasks')
        .update({ project_id: target_project_id })
        .eq('parent_task_id', task_id)
      if (subError) {
        console.error('Error moving subtasks with task:', subError)
      }
    }

    return NextResponse.json({ task: data })
  } catch (error) {
    console.error('Error in member tasks PATCH:', error)
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
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('task_id')

    if (!taskId) {
      return NextResponse.json({ error: 'task_id is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('project_tasks')
      .delete()
      .eq('id', taskId)
      .eq('project_id', id)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in member tasks DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
