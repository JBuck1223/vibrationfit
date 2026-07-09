import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getHouseholdContext } from '@/lib/household/context'

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

    // No created_by filter: RLS grants access to the owner and to household
    // members the project is shared with (explicitly or via share-all).
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_tasks(*)
      `)
      .eq('id', id)
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
      isMine: project.created_by === user.id,
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
    const { title, description, life_categories, status, sort_order, due_date, shareWithHousehold } = body

    const VALID_STATUSES = ['active', 'done', 'archived']
    const updates: Record<string, unknown> = {}
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (life_categories !== undefined) updates.life_categories = Array.isArray(life_categories) ? life_categories : []
    if (status !== undefined && VALID_STATUSES.includes(status)) updates.status = status
    if (sort_order !== undefined) updates.sort_order = sort_order
    if (due_date !== undefined) updates.due_date = due_date || null

    // Explicit household sharing toggle (creator only; enforced again by RLS)
    if (shareWithHousehold === true) {
      const household = await getHouseholdContext(user.id)
      if (household?.isMultiMember) {
        updates.household_id = household.householdId
      }
    } else if (shareWithHousehold === false) {
      updates.household_id = null
    }

    // No created_by filter: RLS allows the owner and household collaborators
    // (shared project or share-all) to edit.
    const { data: project, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
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

    // RLS enforces delete rights: owner always; for household-shared projects
    // the creator or a household admin.
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

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
