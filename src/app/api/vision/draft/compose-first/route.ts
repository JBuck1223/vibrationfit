/**
 * POST /api/vision/draft/compose-first
 *
 * Writes the member's first Life Vision from their Draft Session, one
 * category at a time through the intensive-era starter + category writer
 * (src/lib/life-vision/compose-first-vision.ts). Triggered by the client when
 * VIVA emits <<<COMPOSE>>> after the member says yes, and again per category
 * after an IMAGINE addition.
 *
 * Body: { draftId: string, categories?: LifeCategoryKey[] }
 * Streams NDJSON lines:
 *   { type: 'start', categories: [...] }
 *   { type: 'stage', category, stage: 'starter' | 'vision', text }
 *   { type: 'bookends', forward, conclusion }
 *   { type: 'done', words: { [category]: number } }
 *   { type: 'error', message }
 *
 * Each finished category is written to the draft row as it lands, so a
 * refresh mid-compose shows what is already there.
 */

import { createClient } from '@/lib/supabase/server'
import { getAIToolConfig } from '@/lib/ai/database-config'
import { validateTokenBalance } from '@/lib/tokens/tracking'
import { isLifeCategoryKey, LIFE_CATEGORY_KEYS, type LifeCategoryKey } from '@/lib/design-system/vision-categories'
import {
  computeDepth,
  loadDraftSession,
  markDraftSessionComposed,
  upsertCategoryText,
} from '@/lib/life-vision/draft-session'
import { composeFirstVision } from '@/lib/life-vision/compose-first-vision'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const draftId = typeof body?.draftId === 'string' ? body.draftId : null
  if (!draftId) {
    return new Response(JSON.stringify({ error: 'Missing draftId' }), { status: 400 })
  }
  const requested: LifeCategoryKey[] = Array.isArray(body?.categories)
    ? body.categories.filter((k: unknown): k is LifeCategoryKey => typeof k === 'string' && isLifeCategoryKey(k))
    : []
  const categories: LifeCategoryKey[] = requested.length ? requested : [...LIFE_CATEGORY_KEYS]
  const fullCompose = categories.length === LIFE_CATEGORY_KEYS.length

  const { data: draft } = await supabase
    .from('vision_versions')
    .select('id, user_id, is_draft, is_active, perspective, forward, conclusion')
    .eq('id', draftId)
    .single()
  if (!draft || draft.user_id !== user.id || !draft.is_draft || draft.is_active) {
    return new Response(JSON.stringify({ error: 'Draft not found' }), { status: 404 })
  }

  const session = await loadDraftSession(supabase, draftId)
  if (!session) {
    return new Response(JSON.stringify({ error: 'No draft session' }), { status: 404 })
  }

  // The first full write waits for the depth gate: every area cleared or
  // marked unknown. Per-category rewrites after compose are not gated.
  if (fullCompose && session.status === 'gathering') {
    const depth = computeDepth(session.notes, session.categoryText)
    if (!depth.readyToCompose) {
      const open = [...depth.empty, ...depth.thin]
      return new Response(
        JSON.stringify({
          error: `VIVA needs more in ${open.length} ${open.length === 1 ? 'area' : 'areas'} before she can write`,
          depth,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }
  }

  // Two passes per category; rough budget so an empty balance fails before we spend.
  const balanceCheck = await validateTokenBalance(user.id, 4_000 * categories.length, supabase)
  if (balanceCheck) {
    return new Response(
      JSON.stringify({ error: balanceCheck.error, tokensRemaining: balanceCheck.tokensRemaining }),
      { status: balanceCheck.status || 402, headers: { 'Content-Type': 'application/json' } },
    )
  }

  let systemPrompt: string | undefined
  try {
    systemPrompt = (await getAIToolConfig('master_vision_assembly')).system_prompt || undefined
  } catch {
    systemPrompt = undefined
  }

  const perspective: 'singular' | 'plural' = draft.perspective === 'plural' ? 'plural' : 'singular'
  const encoder = new TextEncoder()
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
  const writer = writable.getWriter()
  const send = async (obj: Record<string, unknown>) => {
    await writer.write(encoder.encode(`${JSON.stringify(obj)}\n`))
  }

  void (async () => {
    try {
      await send({ type: 'start', categories })
      const words: Record<string, number> = {}

      const result = await composeFirstVision({
        notes: session.notes,
        categoryText: session.categoryText,
        perspective,
        categories,
        systemPrompt,
        tracking: { supabase, userId: user.id, billable: true },
        onStage: async (category, stage, text) => {
          await send({ type: 'stage', category, stage, text })
          if (stage === 'starter') {
            await upsertCategoryText(supabase, session.id, category, { starter_text: text })
            return
          }
          await upsertCategoryText(supabase, session.id, category, { vision_text: text })
          words[category] = text.trim() ? text.trim().split(/\s+/).length : 0
          await supabase
            .from('vision_versions')
            .update({ [category]: text, updated_at: new Date().toISOString() })
            .eq('id', draftId)
        },
      })

      if (fullCompose) {
        const forward = (draft.forward || '').trim() || result.forward
        const conclusion = (draft.conclusion || '').trim() || result.conclusion
        await supabase
          .from('vision_versions')
          .update({ forward, conclusion, updated_at: new Date().toISOString() })
          .eq('id', draftId)
        await send({ type: 'bookends', forward, conclusion })
        await markDraftSessionComposed(supabase, session.id)
      }

      await send({ type: 'done', words })
    } catch (err) {
      console.error('[compose-first] failed', err)
      await send({ type: 'error', message: err instanceof Error ? err.message : 'Compose failed' })
    } finally {
      await writer.close()
    }
  })()

  return new Response(readable, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}
