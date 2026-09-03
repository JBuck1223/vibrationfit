import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIToolConfig, buildOpenAIParams } from '@/lib/ai/database-config'
import { gatewayClient } from '@/lib/ai/gateway'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import {
  MANIFESTATION_ORGANIZE_SYSTEM_PROMPT,
  buildManifestationOrganizePrompt,
} from '@/lib/viva/prompts'
import { attachKitAsset } from '@/lib/manifestations/kit-helpers'

export const dynamic = 'force-dynamic'

interface OrganizedGroup {
  title: string
  tasks: string[]
}

interface MergeIntoExisting {
  existing_project_id: string
  existing_project_title?: string
  tasks_to_add: string[]
}

/**
 * POST /api/manifestations/[id]/organize
 *
 * Brain dump → inspired action for one manifestation.
 * - (default) { brainDump }  → VIVA organizes the dump into action groups; nothing saved
 * - { action: 'apply', groups, merge_into_existing } → create the groups (projects
 *   nested on this manifestation) with steps, and merge steps into existing groups
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: manifestation } = await supabase
      .from('manifestations')
      .select('id, name, description, why_it_matters, categories')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!manifestation) {
      return NextResponse.json({ error: 'Manifestation not found' }, { status: 404 })
    }

    const body = await request.json()

    // ------------------------------------------------------------------
    // Apply — create groups + steps on this manifestation
    // ------------------------------------------------------------------
    if (body.action === 'apply') {
      const groups: OrganizedGroup[] = Array.isArray(body.groups) ? body.groups : []
      const merges: MergeIntoExisting[] = Array.isArray(body.merge_into_existing) ? body.merge_into_existing : []

      if (groups.length === 0 && merges.length === 0) {
        return NextResponse.json({ error: 'Nothing to apply' }, { status: 400 })
      }

      const { data: maxRow } = await supabase
        .from('projects')
        .select('sort_order')
        .eq('created_by', user.id)
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle()

      let nextSortOrder = (maxRow?.sort_order ?? 0) + 1
      const created: { id: string; title: string; taskCount: number }[] = []

      for (const group of groups) {
        if (!group.title?.trim()) continue

        const { data: newProject, error: projError } = await supabase
          .from('projects')
          .insert({
            title: group.title.trim(),
            description: null,
            type: 'project',
            life_categories: manifestation.categories || [],
            status: 'active',
            priority: 'medium',
            sort_order: nextSortOrder++,
            created_by: user.id,
            manifestation_id: id,
          })
          .select('id')
          .single()

        if (projError || !newProject) {
          console.error('[Organize] create group failed:', projError)
          continue
        }

        const tasks = (Array.isArray(group.tasks) ? group.tasks : [])
          .map(t => (typeof t === 'string' ? t.trim() : String(t)))
          .filter(Boolean)

        if (tasks.length > 0) {
          const { error: taskError } = await supabase
            .from('project_tasks')
            .insert(tasks.map((title, i) => ({
              project_id: newProject.id,
              title,
              is_complete: false,
              sort_order: i,
            })))
          if (taskError) console.error('[Organize] create steps failed:', taskError)
        }

        await attachKitAsset(supabase, {
          kitId: id,
          slot: 'project',
          layer: 'project',
          entityType: 'projects',
          entityId: newProject.id,
          status: 'ready',
          pinnedBy: 'viva',
        })

        created.push({ id: newProject.id, title: group.title.trim(), taskCount: tasks.length })
      }

      const merged: { projectId: string; tasksAdded: number }[] = []
      for (const merge of merges) {
        if (!merge.existing_project_id || !Array.isArray(merge.tasks_to_add)) continue

        const { data: existing } = await supabase
          .from('projects')
          .select('id')
          .eq('id', merge.existing_project_id)
          .eq('created_by', user.id)
          .eq('manifestation_id', id)
          .maybeSingle()
        if (!existing) continue

        const { data: maxTaskRow } = await supabase
          .from('project_tasks')
          .select('sort_order')
          .eq('project_id', merge.existing_project_id)
          .order('sort_order', { ascending: false })
          .limit(1)
          .maybeSingle()

        let taskSortOrder = (maxTaskRow?.sort_order ?? -1) + 1
        const rows = merge.tasks_to_add
          .map(t => (typeof t === 'string' ? t.trim() : String(t)))
          .filter(Boolean)
          .map(title => ({
            project_id: merge.existing_project_id,
            title,
            is_complete: false,
            sort_order: taskSortOrder++,
          }))

        if (rows.length === 0) continue
        const { error: taskError } = await supabase.from('project_tasks').insert(rows)
        if (taskError) {
          console.error('[Organize] merge steps failed:', taskError)
          continue
        }
        merged.push({ projectId: merge.existing_project_id, tasksAdded: rows.length })
      }

      return NextResponse.json({ success: true, created, merged }, { status: 201 })
    }

    // ------------------------------------------------------------------
    // Organize the brain dump (default)
    // ------------------------------------------------------------------
    const brainDump = typeof body.brainDump === 'string' ? body.brainDump.trim() : ''
    if (!brainDump) {
      return NextResponse.json({ error: 'Brain dump text is required' }, { status: 400 })
    }

    const toolConfig = await getAIToolConfig('project_organize')

    const estimatedTokens = estimateTokensForText(brainDump, toolConfig.model_name)
    const tokenValidation = await validateTokenBalance(user.id, estimatedTokens, supabase)
    if (tokenValidation) {
      return NextResponse.json(
        { error: tokenValidation.error, tokensRemaining: tokenValidation.tokensRemaining },
        { status: tokenValidation.status },
      )
    }

    const { data: existingGroups } = await supabase
      .from('projects')
      .select('id, title, project_tasks(id)')
      .eq('manifestation_id', id)
      .eq('created_by', user.id)
      .neq('status', 'archived')

    const prompt = buildManifestationOrganizePrompt(
      brainDump,
      {
        name: manifestation.name,
        description: manifestation.description,
        why_it_matters: manifestation.why_it_matters,
        categories: manifestation.categories || [],
      },
      (existingGroups || []).map(g => ({
        id: g.id,
        title: g.title,
        task_count: (g.project_tasks || []).length,
      })),
    )

    const messages = [
      { role: 'system', content: MANIFESTATION_ORGANIZE_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ]
    const aiParams = buildOpenAIParams(toolConfig, messages)
    aiParams.model = `openai/${toolConfig.model_name}`
    const completion = await gatewayClient.chat.completions.create(aiParams)

    const responseText = completion.choices[0]?.message?.content || '{}'
    let organized: { groups?: OrganizedGroup[]; merge_into_existing?: MergeIntoExisting[]; unassigned?: string[] }
    try {
      const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      organized = JSON.parse(cleaned)
    } catch {
      organized = {}
    }

    await trackTokenUsage({
      user_id: user.id,
      action_type: 'project_organize',
      model_used: toolConfig.model_name,
      tokens_used: completion.usage?.total_tokens || 0,
      input_tokens: completion.usage?.prompt_tokens || 0,
      output_tokens: completion.usage?.completion_tokens || 0,
      provider: 'vercel_gateway',
      provider_request_id: completion.id,
      success: true,
      metadata: { manifestation_id: id, brain_dump_length: brainDump.length },
    }, supabase)

    return NextResponse.json({
      success: true,
      organized: {
        groups: Array.isArray(organized.groups) ? organized.groups : [],
        merge_into_existing: Array.isArray(organized.merge_into_existing) ? organized.merge_into_existing : [],
        unassigned: Array.isArray(organized.unassigned) ? organized.unassigned : [],
      },
    })
  } catch (error) {
    console.error('[Organize] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
