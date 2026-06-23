import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projects, merge_into_existing } = body as {
      projects: { title: string; life_categories: string[]; tasks: string[] }[]
      merge_into_existing?: { existing_project_id: string; tasks_to_add: string[] }[]
    }

    if (!Array.isArray(projects) && !Array.isArray(merge_into_existing)) {
      return NextResponse.json({ error: 'projects or merge_into_existing array is required' }, { status: 400 })
    }

    // Get max sort_order for this user
    const { data: maxRow } = await supabase
      .from('projects')
      .select('sort_order')
      .eq('created_by', user.id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    let nextSortOrder = (maxRow?.sort_order ?? 0) + 1
    const created: { projectId: string; title: string; taskCount: number }[] = []

    // Create new projects
    if (Array.isArray(projects)) {
      for (const proj of projects) {
        if (!proj.title?.trim()) continue

        const { data: newProject, error: projError } = await supabase
          .from('projects')
          .insert({
            title: proj.title.trim(),
            description: null,
            type: 'project',
            life_categories: Array.isArray(proj.life_categories) ? proj.life_categories : [],
            status: 'active',
            priority: 'medium',
            sort_order: nextSortOrder++,
            due_date: null,
            created_by: user.id,
          })
          .select('id')
          .single()

        if (projError || !newProject) {
          console.error('Error creating project:', projError)
          continue
        }

        // Create tasks for this project
        const tasks = Array.isArray(proj.tasks) ? proj.tasks : []
        if (tasks.length > 0) {
          const taskRows = tasks.map((title, i) => ({
            project_id: newProject.id,
            title: typeof title === 'string' ? title.trim() : String(title),
            is_complete: false,
            sort_order: i,
          }))

          const { error: taskError } = await supabase
            .from('project_tasks')
            .insert(taskRows)

          if (taskError) {
            console.error('Error creating tasks:', taskError)
          }
        }

        created.push({
          projectId: newProject.id,
          title: proj.title.trim(),
          taskCount: tasks.length,
        })
      }
    }

    // Merge tasks into existing projects
    const merged: { projectId: string; tasksAdded: number }[] = []
    if (Array.isArray(merge_into_existing)) {
      for (const merge of merge_into_existing) {
        if (!merge.existing_project_id || !Array.isArray(merge.tasks_to_add)) continue

        // Verify ownership
        const { data: existing } = await supabase
          .from('projects')
          .select('id')
          .eq('id', merge.existing_project_id)
          .eq('created_by', user.id)
          .single()

        if (!existing) continue

        // Get current max sort_order for tasks in this project
        const { data: maxTaskRow } = await supabase
          .from('project_tasks')
          .select('sort_order')
          .eq('project_id', merge.existing_project_id)
          .order('sort_order', { ascending: false })
          .limit(1)
          .single()

        let taskSortOrder = (maxTaskRow?.sort_order ?? -1) + 1

        const taskRows = merge.tasks_to_add.map((title) => ({
          project_id: merge.existing_project_id,
          title: typeof title === 'string' ? title.trim() : String(title),
          is_complete: false,
          sort_order: taskSortOrder++,
        }))

        const { error: taskError } = await supabase
          .from('project_tasks')
          .insert(taskRows)

        if (taskError) {
          console.error('Error merging tasks:', taskError)
          continue
        }

        merged.push({
          projectId: merge.existing_project_id,
          tasksAdded: merge.tasks_to_add.length,
        })
      }
    }

    return NextResponse.json({
      success: true,
      created,
      merged,
      totalProjectsCreated: created.length,
      totalTasksMerged: merged.reduce((sum, m) => sum + m.tasksAdded, 0),
    }, { status: 201 })
  } catch (error) {
    console.error('Error in project organize apply:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
