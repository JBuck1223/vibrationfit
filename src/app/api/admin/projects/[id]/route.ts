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
      .from('projects')
      .select(`
        *,
        category:project_categories(*),
        project_tag_links(tag_id, project_tags(*)),
        project_tasks(*),
        project_comments(*),
        project_attachments(*),
        project_custom_field_values(*, field:project_custom_field_defs(*))
      `)
      .eq('id', id)
      .order('sort_order', { referencedTable: 'project_tasks', ascending: true })
      .order('created_at', { referencedTable: 'project_comments', ascending: false })
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }
      console.error('Error fetching project:', error)
      return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
    }

    // project_comments.user_id has no FK to user_accounts, so resolve author names
    // in a separate lookup instead of a PostgREST embed (which would error).
    const commentUserIds = [
      ...new Set(
        (project.project_comments || [])
          .map((c: any) => c.user_id)
          .filter(Boolean)
      ),
    ]
    let userMap: Record<string, { full_name: string | null; email: string | null }> = {}
    if (commentUserIds.length > 0) {
      const { data: users } = await supabase
        .from('user_accounts')
        .select('id, full_name, email')
        .in('id', commentUserIds)
      userMap = Object.fromEntries(
        (users || []).map((u: any) => [u.id, { full_name: u.full_name, email: u.email }])
      )
    }

    const { data: linksOut } = await supabase
      .from('project_links')
      .select('*, target:target_project_id(id, title, status, priority)')
      .eq('source_project_id', id)

    const { data: linksIn } = await supabase
      .from('project_links')
      .select('*, source:source_project_id(id, title, status, priority)')
      .eq('target_project_id', id)

    const result = {
      ...project,
      tags: (project.project_tag_links || []).map((pt: any) => pt.project_tags).filter(Boolean),
      tasks: buildTaskTree(project.project_tasks || []),
      comments: (project.project_comments || []).map((c: any) => ({
        ...c,
        user_name: userMap[c.user_id]?.full_name || null,
        user_email: userMap[c.user_id]?.email || null,
      })),
      attachments: project.project_attachments || [],
      custom_field_values: (project.project_custom_field_values || []).map((v: any) => ({
        ...v,
        field: v.field || null,
      })),
      links_out: linksOut || [],
      links_in: linksIn || [],
      task_count: (project.project_tasks || []).length,
      task_done_count: (project.project_tasks || []).filter((t: any) => t.is_complete).length,
      project_tag_links: undefined,
      project_tasks: undefined,
      project_comments: undefined,
      project_attachments: undefined,
      project_custom_field_values: undefined,
    }

    return NextResponse.json({ project: result })
  } catch (error) {
    console.error('Error in project GET:', error)
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
    const { title, description, type, category_id, life_categories, status, priority, due_date, tag_ids } = body

    const supabase = createAdminClient()

    const oldProject = await supabase
      .from('projects')
      .select('status, priority')
      .eq('id', id)
      .single()

    const updates: Record<string, unknown> = {}
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (type !== undefined && (type === 'project' || type === 'list')) updates.type = type
    if (category_id !== undefined) updates.category_id = category_id || null
    if (life_categories !== undefined) updates.life_categories = Array.isArray(life_categories) ? life_categories : []
    if (status !== undefined) updates.status = status
    if (priority !== undefined) updates.priority = priority
    if (due_date !== undefined) updates.due_date = due_date || null

    const { data: project, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating project:', error)
      return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
    }

    if (status !== undefined && oldProject.data?.status !== status) {
      await supabase.from('project_comments').insert({
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
      await supabase.from('project_tag_links').delete().eq('project_id', id)
      if (tag_ids.length > 0) {
        const tagRows = tag_ids.map((tag_id: string) => ({
          project_id: id,
          tag_id,
        }))
        await supabase.from('project_tag_links').insert(tagRows)
      }
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Error in project PATCH:', error)
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
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting project:', error)
      return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in project DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
