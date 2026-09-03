import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIToolConfig, buildOpenAIParams } from '@/lib/ai/database-config'
import { gatewayClient } from '@/lib/ai/gateway'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import { flattenProfile } from '@/lib/viva/prompt-flatteners'
import {
  MANIFESTATION_DISTILL_SYSTEM_PROMPT,
  buildManifestationDistillPrompt,
} from '@/lib/viva/prompts'
import { LIFE_CATEGORY_KEYS } from '@/lib/design-system/vision-categories'

export const dynamic = 'force-dynamic'

/**
 * POST /api/manifestations/[id]/distill
 *
 * Distills "why you want it" and "what it feels like" for one manifestation
 * from everything VIVA knows: active Life Vision, attached journal entries,
 * the linked VIVA conversation, and inspired action.
 *
 * Actions:
 * - (default)                     → generate a draft; nothing is saved
 * - { action: 'save', ... }       → save text onto the manifestation and record a version
 * - { action: 'restore', version_id } → restore a previous version (recorded as a new version)
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
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!manifestation) {
      return NextResponse.json({ error: 'Manifestation not found' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))

    // ------------------------------------------------------------------
    // Save (records a version) and restore
    // ------------------------------------------------------------------
    if (body.action === 'save' || body.action === 'restore') {
      let why: string | null = null
      let feels: string | null = null
      let source: 'viva' | 'member' = body.source === 'member' ? 'member' : 'viva'

      if (body.action === 'restore') {
        const { data: version } = await supabase
          .from('manifestation_essence_versions')
          .select('*')
          .eq('id', body.version_id)
          .eq('manifestation_id', id)
          .eq('user_id', user.id)
          .maybeSingle()
        if (!version) {
          return NextResponse.json({ error: 'Version not found' }, { status: 404 })
        }
        why = version.why_it_matters
        feels = version.what_it_feels_like
        source = 'member'
      } else {
        why = typeof body.why_it_matters === 'string' ? body.why_it_matters.trim() || null : null
        feels = typeof body.what_it_feels_like === 'string' ? body.what_it_feels_like.trim() || null : null
      }

      const { error: updateError } = await supabase
        .from('manifestations')
        .update({
          why_it_matters: why,
          what_it_feels_like: feels,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('[Distill] save failed:', updateError)
        return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
      }

      const { data: maxRow } = await supabase
        .from('manifestation_essence_versions')
        .select('version_number')
        .eq('manifestation_id', id)
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle()

      const { data: version } = await supabase
        .from('manifestation_essence_versions')
        .insert({
          manifestation_id: id,
          user_id: user.id,
          why_it_matters: why,
          what_it_feels_like: feels,
          source,
          version_number: (maxRow?.version_number ?? 0) + 1,
        })
        .select()
        .single()

      return NextResponse.json({
        success: true,
        why_it_matters: why,
        what_it_feels_like: feels,
        version,
      })
    }

    // ------------------------------------------------------------------
    // Generate a draft (default)
    // ------------------------------------------------------------------
    const toolConfig = await getAIToolConfig('manifestation_distill')

    const seed = `${manifestation.name} ${manifestation.description || ''}`
    const estimatedTokens = estimateTokensForText(seed, toolConfig.model_name)
    const tokenValidation = await validateTokenBalance(user.id, estimatedTokens, supabase)
    if (tokenValidation) {
      return NextResponse.json(
        { error: tokenValidation.error, tokensRemaining: tokenValidation.tokensRemaining },
        { status: tokenValidation.status },
      )
    }

    const categories: string[] = manifestation.categories || []

    const [visionResult, profileResult, assetsResult, projectsResult] = await Promise.all([
      supabase
        .from('vision_versions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .is('household_id', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('manifestation_assets')
        .select('entity_id, slot')
        .eq('manifestation_id', id)
        .eq('slot', 'journal'),
      supabase
        .from('projects')
        .select('title, project_tasks(title, is_complete)')
        .eq('manifestation_id', id)
        .neq('status', 'archived'),
    ])

    // Life Vision text for this manifestation's categories (all when uncategorized)
    let visionContext = ''
    if (visionResult.data) {
      const vision = visionResult.data as Record<string, unknown>
      const keys = categories.length > 0
        ? LIFE_CATEGORY_KEYS.filter(k => categories.includes(k))
        : LIFE_CATEGORY_KEYS
      visionContext = keys
        .map(key => {
          const value = vision[key]
          if (!value || !String(value).trim()) return null
          return `### ${key}\n${String(value).slice(0, 600)}`
        })
        .filter(Boolean)
        .join('\n\n')
    }

    // Attached journal entries
    let journalContext = ''
    const journalIds = (assetsResult.data || [])
      .map(a => a.entity_id)
      .filter((v): v is string => Boolean(v))
    if (journalIds.length > 0) {
      const { data: entries } = await supabase
        .from('journal_entries')
        .select('title, content, date, journal_tag')
        .in('id', journalIds)
        .order('date', { ascending: false })
        .limit(10)
      journalContext = (entries || [])
        .map(e => `[${e.date}${e.journal_tag ? ` · ${e.journal_tag}` : ''}] ${e.title || 'Untitled'}\n${String(e.content || '').slice(0, 500)}`)
        .join('\n\n')
    }

    // Linked VIVA conversation
    let conversationContext = ''
    if (manifestation.conversation_id) {
      const { data: messages } = await supabase
        .from('ai_conversations')
        .select('role, message')
        .eq('conversation_id', manifestation.conversation_id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(40)
      conversationContext = (messages || [])
        .map(m => `${m.role === 'user' ? 'Member' : 'VIVA'}: ${String(m.message || '').slice(0, 400)}`)
        .join('\n')
    }

    // Inspired action
    const actionContext = (projectsResult.data || [])
      .map(g => {
        const steps = (g.project_tasks || [])
          .map((t: { title: string; is_complete: boolean }) => `  - [${t.is_complete ? 'done' : 'open'}] ${t.title}`)
          .join('\n')
        return `${g.title}${steps ? `\n${steps}` : ''}`
      })
      .join('\n')

    const profileContext = profileResult.data ? flattenProfile(profileResult.data, 40) : ''

    const prompt = buildManifestationDistillPrompt({
      name: manifestation.name,
      description: manifestation.description,
      categories,
      currentWhy: manifestation.why_it_matters,
      currentFeelsLike: manifestation.what_it_feels_like,
      visionContext,
      journalContext,
      conversationContext,
      actionContext,
      profileContext,
    })

    const messages = [
      { role: 'system', content: MANIFESTATION_DISTILL_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ]
    const aiParams = buildOpenAIParams(toolConfig, messages)
    aiParams.model = `openai/${toolConfig.model_name}`
    const completion = await gatewayClient.chat.completions.create(aiParams)

    const responseText = completion.choices[0]?.message?.content || '{}'
    let distilled: { why_it_matters?: string; what_it_feels_like?: string } = {}
    try {
      const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      distilled = JSON.parse(cleaned)
    } catch {
      distilled = {}
    }

    await trackTokenUsage({
      user_id: user.id,
      action_type: 'manifestation_distill',
      model_used: toolConfig.model_name,
      tokens_used: completion.usage?.total_tokens || 0,
      input_tokens: completion.usage?.prompt_tokens || 0,
      output_tokens: completion.usage?.completion_tokens || 0,
      provider: 'vercel_gateway',
      provider_request_id: completion.id,
      success: true,
      metadata: { manifestation_id: id },
    }, supabase)

    if (!distilled.why_it_matters && !distilled.what_it_feels_like) {
      return NextResponse.json({ error: 'VIVA could not distill this manifestation yet.' }, { status: 502 })
    }

    return NextResponse.json({
      success: true,
      why_it_matters: distilled.why_it_matters || null,
      what_it_feels_like: distilled.what_it_feels_like || null,
    })
  } catch (error) {
    console.error('[Distill] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
