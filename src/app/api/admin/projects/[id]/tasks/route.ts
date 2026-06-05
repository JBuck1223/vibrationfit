import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import type { IdeaTask } from '@/lib/ideas/types'

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { id } = await params
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('idea_tasks')
      .select('*')
      .eq('project_id', id)
      .order('sort_order', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    const tree = buildTaskTree((data || []) as IdeaTask[])
    return NextResponse.json({ tasks: tree })
  } catch (error) {
    console.error('Error in tasks GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { id } = await params
    const body = await request.json()
    const { title, parent_task_id, description } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const siblingFilter = supabase
      .from('idea_tasks')
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
      .from('idea_tasks')
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      console.error('Task creation error:', error)
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
    }

    return NextResponse.json({ task: data }, { status: 201 })
  } catch (error) {
    console.error('Error in tasks POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    await params
    const body = await request.json()
    const { task_id, title, is_complete, sort_order, description } = body

    if (!task_id) {
      return NextResponse.json({ error: 'task_id is required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const updates: Record<string, unknown> = {}
    if (title !== undefined) updates.title = title
    if (is_complete !== undefined) updates.is_complete = is_complete
    if (sort_order !== undefined) updates.sort_order = sort_order
    if (description !== undefined) updates.description = description

    const { data, error } = await supabase
      .from('idea_tasks')
      .update(updates)
      .eq('id', task_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
    }

    return NextResponse.json({ task: data })
  } catch (error) {
    console.error('Error in tasks PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    await params
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('task_id')

    if (!taskId) {
      return NextResponse.json({ error: 'task_id is required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('idea_tasks')
      .delete()
      .eq('id', taskId)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in tasks DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
