import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { createAdminClient } from '@/lib/supabase/admin'

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
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { id } = await params
    const supabase = createAdminClient()

    const { data: project, error } = await supabase
      .from('idea_projects')
      .select(`
        *,
        category:idea_categories(*),
        idea_project_tags(tag_id, idea_tags(*)),
        idea_tasks(*, id, title, is_complete, sort_order, created_at, updated_at),
        idea_comments(*, user_accounts:user_id(full_name, email)),
        idea_attachments(*),
        idea_custom_field_values(*, field:idea_custom_field_defs(*))
      `)
      .eq('id', id)
      .order('sort_order', { referencedTable: 'idea_tasks', ascending: true })
      .order('created_at', { referencedTable: 'idea_comments', ascending: false })
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }
      console.error('Error fetching idea:', error)
      return NextResponse.json({ error: 'Failed to fetch idea' }, { status: 500 })
    }

    const { data: linksOut } = await supabase
      .from('idea_project_links')
      .select('*, target:target_project_id(id, title, status, priority)')
      .eq('source_project_id', id)

    const { data: linksIn } = await supabase
      .from('idea_project_links')
      .select('*, source:source_project_id(id, title, status, priority)')
      .eq('target_project_id', id)

    const result = {
      ...project,
      tags: (project.idea_project_tags || []).map((pt: any) => pt.idea_tags).filter(Boolean),
      tasks: buildTaskTree(project.idea_tasks || []),
      comments: (project.idea_comments || []).map((c: any) => ({
        ...c,
        user_name: c.user_accounts?.full_name || null,
        user_email: c.user_accounts?.email || null,
        user_accounts: undefined,
      })),
      attachments: project.idea_attachments || [],
      custom_field_values: (project.idea_custom_field_values || []).map((v: any) => ({
        ...v,
        field: v.field || null,
      })),
      links_out: linksOut || [],
      links_in: linksIn || [],
      task_count: (project.idea_tasks || []).length,
      task_done_count: (project.idea_tasks || []).filter((t: any) => t.is_complete).length,
      idea_project_tags: undefined,
      idea_tasks: undefined,
      idea_comments: undefined,
      idea_attachments: undefined,
      idea_custom_field_values: undefined,
    }

    return NextResponse.json({ project: result })
  } catch (error) {
    console.error('Error in idea GET:', error)
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

    const { id } = await params
    const body = await request.json()
    const { title, description, category_id, status, priority, due_date, tag_ids } = body

    const supabase = createAdminClient()

    const oldProject = await supabase
      .from('idea_projects')
      .select('status, priority')
      .eq('id', id)
      .single()

    const updates: Record<string, unknown> = {}
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (category_id !== undefined) updates.category_id = category_id || null
    if (status !== undefined) updates.status = status
    if (priority !== undefined) updates.priority = priority
    if (due_date !== undefined) updates.due_date = due_date || null

    const { data: project, error } = await supabase
      .from('idea_projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating idea:', error)
      return NextResponse.json({ error: 'Failed to update idea' }, { status: 500 })
    }

    if (status !== undefined && oldProject.data?.status !== status) {
      await supabase.from('idea_comments').insert({
        project_id: id,
        user_id: auth.user.id,
        type: 'status_change',
        metadata: {
          old_status: oldProject.data?.status,
          new_status: status,
        },
      })
    }

    if (tag_ids !== undefined) {
      await supabase.from('idea_project_tags').delete().eq('project_id', id)
      if (tag_ids.length > 0) {
        const tagRows = tag_ids.map((tag_id: string) => ({
          project_id: id,
          tag_id,
        }))
        await supabase.from('idea_project_tags').insert(tagRows)
      }
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Error in idea PATCH:', error)
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

    const { id } = await params
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('idea_projects')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting idea:', error)
      return NextResponse.json({ error: 'Failed to delete idea' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in idea DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
