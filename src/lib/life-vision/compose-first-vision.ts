/**
 * Compose the first Life Vision from the Draft Session, the intensive way.
 *
 * Per life category, two passes:
 *   1. Starter — buildImaginationStarterPrompt over the member's own words
 *      (verbatim passages). Carries the richness ladder, so length tracks
 *      how much they actually said.
 *   2. Writer — buildIndividualCategoryPrompt over starter + the member's
 *      imagination additions (unleash) + contrast as the invisible anchor.
 *
 * Forward and conclusion come from the bookend templates. Nothing is invented
 * to fill a category: an area with no member words gets a short, honest
 * write from what the rest of their life already named.
 *
 * Pure: no HTTP, no Next.js. Used by POST /api/vision/draft/compose-first and
 * scripts/vision/replay-first-vision.ts.
 */

import { generateText } from 'ai'
import type { SupabaseClient } from '@supabase/supabase-js'
import { gateway, gatewayGenerationId, VISION_MODEL } from '@/lib/ai/gateway'
import { trackTokenUsage } from '@/lib/tokens/tracking'
import {
  LIFE_CATEGORY_KEYS,
  getVisionCategoryLabel,
  type LifeCategoryKey,
} from '@/lib/design-system/vision-categories'
import { getBookendTemplate } from '@/lib/viva/bookend-templates'
import { buildImaginationStarterPrompt } from '@/lib/viva/prompts/imagination-starter-prompt'
import { buildIndividualCategoryPrompt } from '@/lib/viva/prompts/single-category-vision-prompt'
import { getQuestionsForCategory } from '@/lib/life-vision/ideal-state-questions'
import {
  groupNotesByCategory,
  type CategoryCoverage,
  type DraftSessionCategoryText,
  type DraftSessionNote,
} from '@/lib/life-vision/draft-session'

export const DEFAULT_WRITER_SYSTEM_PROMPT =
  'You are VIVA, a vibrationally intelligent assistant that writes beautiful, human-sounding life vision text.'

export type ComposeStage = 'starter' | 'vision'

export interface ComposedCategory {
  category: LifeCategoryKey
  starterText: string
  imaginationText: string
  visionText: string
  memberWords: number
  starterWords: number
  visionWords: number
}

export interface ComposeFirstVisionResult {
  forward: string
  conclusion: string
  categories: ComposedCategory[]
}

export interface ComposeFirstVisionOptions {
  notes: DraftSessionNote[]
  categoryText?: DraftSessionCategoryText[]
  perspective: 'singular' | 'plural'
  /** Subset to (re)write. Defaults to all 12. */
  categories?: LifeCategoryKey[]
  /** System prompt for both passes; defaults to the category-vision fallback. */
  systemPrompt?: string
  model?: string
  /** Token ledger. Omit to skip tracking. */
  tracking?: { supabase?: SupabaseClient; userId: string | null; billable: boolean }
  /** Progress callback as each pass lands. */
  onStage?: (category: LifeCategoryKey, stage: ComposeStage, text: string) => void | Promise<void>
}

function words(text: string): number {
  const t = text.trim()
  return t ? t.split(/\s+/).length : 0
}

/**
 * The member's words for a category, as the starter's "current state" input.
 * Clarity first (what they choose), then contrast (what is true now). The
 * starter prompt turns both into present-tense declarations.
 */
export function memberStateText(group: CategoryCoverage): string {
  const parts: string[] = []
  if (group.memberClarity.length) parts.push(group.memberClarity.join('\n\n'))
  if (group.memberContrast.length) parts.push(group.memberContrast.join('\n\n'))
  return parts.join('\n\n')
}

/**
 * When a category has none of the member's words, the starter gets only
 * VIVA's labels for that area (each one came from the conversation). Nothing
 * from other areas is poured in: that is how a Travel section ends up with
 * trains and coastlines the member never mentioned.
 */
function fallbackStateText(group: CategoryCoverage): string {
  return [...group.clarity, ...group.contrast].join(' ')
}

/** Word ceiling for the starter when the member said little about an area. */
export function thinAreaCap(memberWords: number): number {
  if (memberWords === 0) return 80
  return Math.max(100, Math.min(220, Math.round(memberWords * 2.5)))
}

async function runPass(
  prompt: string,
  opts: ComposeFirstVisionOptions,
  meta: { category: LifeCategoryKey; stage: ComposeStage },
): Promise<string> {
  const model = opts.model || VISION_MODEL
  const result = await generateText({
    model: gateway(model),
    system: opts.systemPrompt || DEFAULT_WRITER_SYSTEM_PROMPT,
    prompt,
  })

  if (opts.tracking && result.usage?.totalTokens) {
    trackTokenUsage(
      {
        user_id: opts.tracking.userId,
        action_type: meta.stage === 'starter' ? 'imagination_starter' : 'life_vision_category_generation',
        model_used: model.split('/').pop() || model,
        tokens_used: result.usage.totalTokens,
        input_tokens: result.usage.inputTokens || 0,
        output_tokens: result.usage.outputTokens || 0,
        provider: 'vercel_gateway',
        provider_request_id: gatewayGenerationId(result),
        billable: opts.tracking.billable,
        success: true,
        metadata: { category: meta.category, stage: meta.stage, source: 'compose_first_vision' },
      },
      opts.tracking.supabase,
    ).catch(() => {})
  }

  return result.text.trim()
}

export async function composeCategory(
  group: CategoryCoverage,
  imaginationText: string,
  opts: ComposeFirstVisionOptions,
): Promise<ComposedCategory> {
  const key = group.category
  const label = getVisionCategoryLabel(key)
  const ownWords = memberStateText(group)
  const stateText = ownWords || fallbackStateText(group)
  const cleared = group.depth === 'cleared'
  // Inspiration themes only where they gave a real scene; otherwise the
  // starter would weave in a life they did not describe.
  const questions = cleared ? getQuestionsForCategory(key).map((q) => q.text) : []

  const starterPrompt = buildImaginationStarterPrompt(
    key,
    label,
    stateText,
    {},
    questions,
    opts.perspective,
    cleared ? {} : { thinArea: { maxWords: thinAreaCap(group.memberWords) } },
  )
  const starterText = await runPass(starterPrompt, opts, { category: key, stage: 'starter' })
  await opts.onStage?.(key, 'starter', starterText)

  // Contrast is the invisible anchor: shapes tone, never quoted.
  const contrastText = group.memberContrast.join('\n\n')
  const writerPrompt = buildIndividualCategoryPrompt(
    key,
    label,
    starterText,
    imaginationText,
    contrastText,
    opts.perspective,
    '',
    {
      strictFacts: true,
      ...(cleared ? {} : { thinArea: { maxWords: thinAreaCap(group.memberWords) } }),
    },
  )
  const visionText = await runPass(writerPrompt, opts, { category: key, stage: 'vision' })
  await opts.onStage?.(key, 'vision', visionText)

  return {
    category: key,
    starterText,
    imaginationText,
    visionText,
    memberWords: group.memberWords,
    starterWords: words(starterText),
    visionWords: words(visionText),
  }
}

export async function composeFirstVision(opts: ComposeFirstVisionOptions): Promise<ComposeFirstVisionResult> {
  const grouped = groupNotesByCategory(opts.notes)
  const wanted = new Set<LifeCategoryKey>(opts.categories?.length ? opts.categories : [...LIFE_CATEGORY_KEYS])
  const imagination = new Map<string, string>()
  for (const row of opts.categoryText || []) {
    if ((row.imagination_text || '').trim()) imagination.set(row.category, row.imagination_text!.trim())
  }

  const categories = await Promise.all(
    grouped
      .filter((g) => wanted.has(g.category))
      .map((g) => composeCategory(g, imagination.get(g.category) || '', opts)),
  )

  const bookends = getBookendTemplate('medium', opts.perspective)
  return {
    forward: bookends.forward,
    conclusion: bookends.conclusion,
    categories,
  }
}
