/**
 * Vision Director runner — decides the next invitation card for the directed
 * intake and asks VIVA to write it.
 *
 * Sequence: the fixed opener (health) when nothing exists yet, then the
 * remaining core-four anchors with the target forced, then coverage gaps
 * until every area clears. Pure of HTTP; used by /api/vision/draft/start and
 * /api/vision/draft/turn.
 */

import { generateText } from 'ai'
import type { SupabaseClient } from '@supabase/supabase-js'
import { gateway, gatewayGenerationId, VISION_MODEL } from '@/lib/ai/gateway'
import { trackTokenUsage } from '@/lib/tokens/tracking'
import type { LifeCategoryKey } from '@/lib/design-system/vision-categories'
import { loadRoster, loadPersona } from '@/lib/roster/store'
import { renderRosterForPrompt, renderPersonaForPrompt } from '@/lib/roster/render'
import {
  computeDepth,
  formatCoverageForDirector,
  groupNotesByCategory,
  type DepthSummary,
  type DraftSessionPayload,
} from '@/lib/life-vision/draft-session'
import {
  OPENER_PROMPT,
  buildDirectorSystemPrompt,
  buildDirectorUserPrompt,
  fallbackDirectorPrompt,
  nextAnchor,
  parseDirectorOutput,
  type DirectorPrompt,
} from '@/lib/viva/prompts/vision-director-prompts'

export const VISION_DIRECTOR_MODEL = VISION_MODEL

export interface DirectorContext {
  firstName: string | null
  rosterBlock: string | null
  personaBlock: string | null
}

export async function loadDirectorContext(
  supabase: SupabaseClient,
  userId: string,
): Promise<DirectorContext> {
  const [{ data: profile }, { data: account }, roster, persona] = await Promise.all([
    supabase.from('user_profiles').select('first_name').eq('user_id', userId).maybeSingle(),
    supabase.from('user_accounts').select('first_name').eq('id', userId).maybeSingle(),
    loadRoster(supabase, userId),
    loadPersona(supabase, userId),
  ])
  return {
    firstName: profile?.first_name || account?.first_name || null,
    rosterBlock: renderRosterForPrompt(roster) || null,
    personaBlock: renderPersonaForPrompt(persona) || null,
  }
}

/**
 * The next card, or null when every area is cleared / unknown. Never throws:
 * a failed model call falls back to a plain card for the chosen targets.
 *
 * Turn 1 is always the fixed opener while health is still the first anchor,
 * even when activation seed notes exist. The model only writes cards from
 * turn 2 on, where it has a last turn to build on.
 */
export async function nextDirectorPrompt(
  supabase: SupabaseClient,
  userId: string,
  session: DraftSessionPayload,
  opts?: { context?: DirectorContext; depth?: DepthSummary },
): Promise<DirectorPrompt | null> {
  const depth = opts?.depth ?? computeDepth(session.notes, session.categoryText)
  if (depth.readyToCompose) return null

  const anchor = nextAnchor(session.turns, session.categoryText)
  if (session.turns.length === 0 && anchor?.index === 0) return OPENER_PROMPT

  const grouped = groupNotesByCategory(session.notes, session.categoryText)
  const coverageBlock = formatCoverageForDirector(grouped, depth, session.turns)
  const context = opts?.context ?? (await loadDirectorContext(supabase, userId))

  const forcedTargets: LifeCategoryKey[] | null = anchor ? anchor.targets : null
  const system = buildDirectorSystemPrompt(context)
  const prompt = buildDirectorUserPrompt({
    coverageBlock,
    forcedTargets,
    anchorIndex: anchor?.index ?? null,
  })

  try {
    const result = await generateText({
      model: gateway(VISION_DIRECTOR_MODEL),
      system,
      prompt,
      temperature: 0.7,
    })
    if (result.usage?.totalTokens) {
      trackTokenUsage(
        {
          user_id: userId,
          action_type: 'background_processing',
          model_used: VISION_DIRECTOR_MODEL.split('/').pop() || VISION_DIRECTOR_MODEL,
          tokens_used: result.usage.totalTokens,
          input_tokens: result.usage.inputTokens || 0,
          output_tokens: result.usage.outputTokens || 0,
          provider: 'vercel_gateway',
          provider_request_id: gatewayGenerationId(result),
          billable: false,
          success: true,
          metadata: { helper: 'vision_director', anchored: !!anchor },
        },
        supabase,
      ).catch(() => {})
    }
    const parsed = parseDirectorOutput(result.text, forcedTargets || [])
    if (parsed && parsed.targets.length > 0) {
      return {
        targets: parsed.targets,
        prompt: parsed.prompt,
        anchored: !!anchor,
        anchorIndex: anchor?.index ?? null,
      }
    }
  } catch (error) {
    console.error('[vision-director] model call failed', error)
  }

  // Fallback: forced targets, or the first empty / thin area.
  const targets: LifeCategoryKey[] = forcedTargets
    || (depth.empty[0] ? [depth.empty[0]] : depth.thin[0] ? [depth.thin[0]] : [])
  if (targets.length === 0) return null
  const empty = targets.every((t) => depth.empty.includes(t))
  return {
    targets,
    prompt: fallbackDirectorPrompt(targets, empty),
    anchored: !!anchor,
    anchorIndex: anchor?.index ?? null,
  }
}

/** Compact per-area view the client renders in rows and the progress bar. */
export function summarizeAreas(session: DraftSessionPayload) {
  const grouped = groupNotesByCategory(session.notes, session.categoryText)
  return grouped.map((g) => ({
    category: g.category,
    depth: g.depth,
    memberWords: g.memberWords,
    nowDone: g.nowDone,
    dreamDone: g.dreamDone,
    unknownYet: g.unknownYet,
    contrast: g.memberContrast,
    clarity: g.memberClarity,
    unknown: g.memberUnknown,
  }))
}

export type AreaSummary = ReturnType<typeof summarizeAreas>[number]
