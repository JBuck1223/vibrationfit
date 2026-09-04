/**
 * VIVA Cleanse — optional pre-commit vibrational-grammar check for
 * /life-vision/update. Reviews ONLY the categories that changed from the
 * active vision and returns sentence-level findings ONLY where clear
 * violations exist (questions, future/wanting, absence-naming, recovery
 * framing, leaked labels). Each finding is one verbatim sentence plus its
 * correction — a category can carry several. Clean drafts return an empty
 * list — no busywork edits.
 *
 * Never writes to the draft; the client applies checked findings through the
 * normal draft-save path.
 */

import { generateText } from 'ai'
import { gateway } from '@/lib/ai/gateway'
import { createClient } from '@/lib/supabase/server'
import { trackTokenUsage, validateTokenBalance } from '@/lib/tokens/tracking'
import {
  VISION_CLEANSE_SYSTEM_PROMPT,
  buildVisionCleanseUserPrompt,
} from '@/lib/viva/prompts/vision-update-prompts'
import {
  ORDERED_VISION_CATEGORIES,
  getVisionCategoryLabel,
  type VisionCategoryKey,
} from '@/lib/design-system/vision-categories'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

const CLEANSE_MODEL = 'openai/gpt-5.6-terra'
const CATEGORY_KEYS = ORDERED_VISION_CATEGORIES.map((c) => c.key)

const norm = (v: unknown) =>
  typeof v === 'string' ? v.replace(/\r\n/g, '\n').trim() : ''

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const { draftId } = await req.json()
    if (!draftId) {
      return new Response(JSON.stringify({ error: 'Missing draftId' }), { status: 400 })
    }

    const { data: draft } = await supabase
      .from('vision_versions')
      .select('*')
      .eq('id', draftId)
      .eq('is_draft', true)
      .single()
    if (!draft || draft.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Draft not found' }), { status: 404 })
    }

    let activeQuery = supabase
      .from('vision_versions')
      .select('*')
      .eq('is_active', true)
      .eq('is_draft', false)
    activeQuery = draft.household_id
      ? activeQuery.eq('household_id', draft.household_id)
      : activeQuery.eq('user_id', user.id).is('household_id', null)
    const { data: active } = await activeQuery.maybeSingle()

    // Only cleanse categories the member actually changed this draft — VIVA
    // never relitigates the already-committed active vision.
    const sections: Array<{ key: string; label: string; text: string }> = []
    for (const key of CATEGORY_KEYS) {
      const draftText = norm(draft[key])
      if (!draftText) continue
      if (active && draftText === norm(active[key])) continue
      if (!active && !draftText) continue
      sections.push({
        key,
        label: getVisionCategoryLabel(key as VisionCategoryKey),
        text: draftText,
      })
    }

    if (sections.length === 0) {
      return Response.json({ findings: [] })
    }

    const balanceCheck = await validateTokenBalance(user.id, 3_000, supabase)
    if (balanceCheck) {
      return new Response(
        JSON.stringify({ error: balanceCheck.error, tokensRemaining: balanceCheck.tokensRemaining }),
        { status: balanceCheck.status || 402, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const result = await generateText({
      model: gateway(CLEANSE_MODEL),
      system: VISION_CLEANSE_SYSTEM_PROMPT,
      prompt: buildVisionCleanseUserPrompt(sections),
    })

    let parsed: { findings?: unknown } = {}
    try {
      const raw = result.text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
      parsed = JSON.parse(raw)
    } catch {
      // Unparseable output — treat as clean rather than surfacing junk edits
      parsed = {}
    }

    // Keep only findings whose original text can actually be located verbatim
    // in the category we sent — anything else would be unappliable junk.
    const sectionByKey = new Map(sections.map((s) => [s.key, s.text]))
    const findings: Array<{ category: string; original: string; revised: string }> = []
    for (const item of Array.isArray(parsed.findings) ? parsed.findings : []) {
      if (!item || typeof item !== 'object') continue
      const { category, original, revised } = item as Record<string, unknown>
      if (typeof category !== 'string' || typeof original !== 'string' || typeof revised !== 'string') continue
      const sectionText = sectionByKey.get(category)
      if (!sectionText) continue
      const orig = original.trim()
      const rev = revised.trim()
      if (!orig || !rev || orig === rev) continue
      if (!sectionText.includes(orig)) continue
      findings.push({ category, original: orig, revised: rev })
    }

    const usage = result.usage
    if (usage) {
      await trackTokenUsage({
        user_id: user.id,
        action_type: 'vision_refinement',
        model_used: CLEANSE_MODEL,
        tokens_used: usage.totalTokens || 0,
        input_tokens: usage.inputTokens || 0,
        output_tokens: usage.outputTokens || 0,
        actual_cost_cents: 0,
        provider: 'vercel_gateway',
        success: true,
        metadata: { feature: 'vision_cleanse', draft_id: draftId },
      }).catch(() => {})
    }

    return Response.json({ findings })
  } catch (error) {
    console.error('[VIVA VISION CLEANSE] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
