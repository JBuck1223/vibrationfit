/**
 * Vision Director — VIVA writes the next invitation card for the directed
 * intake ("Talk it out" on /life-vision/start).
 *
 * This is not a chat reply. Each card asks the member to talk at length about
 * one or two life areas. The sequence is anchored first (the core four:
 * health, relationships, money, work), then driven by the coverage map until
 * every area clears the depth gate.
 */

import { VIVA_PERSONA } from './shared/viva-persona'
import {
  LIFE_CATEGORY_KEYS,
  getVisionCategoryLabel,
  isLifeCategoryKey,
  type LifeCategoryKey,
} from '@/lib/design-system/vision-categories'
import type { DraftSessionCategoryText, DraftSessionTurn } from '@/lib/life-vision/draft-session'

export const VISION_DIRECTOR_PROMPT_VERSION = 'vision-director-v1'

export interface DirectorPrompt {
  targets: LifeCategoryKey[]
  prompt: string
  /** True while the core-four anchors are still being walked. */
  anchored: boolean
  /** 0-based anchor index when anchored. */
  anchorIndex: number | null
}

/**
 * The four areas that touch everything else. Relationships is one prompt;
 * the tagger splits it into love / family / social.
 */
export const CORE_FOUR_ANCHORS: readonly (readonly LifeCategoryKey[])[] = [
  ['health'],
  ['love', 'family', 'social'],
  ['money'],
  ['work'],
] as const

export const CORE_FOUR_LABELS = ['health', 'relationships', 'money', 'work'] as const

/** Turn 1. Fixed text, no model call. */
export const OPENER_PROMPT: DirectorPrompt = {
  targets: ['health'],
  anchored: true,
  anchorIndex: 0,
  prompt:
    "We'll start with the four that touch everything: health, relationships, money, work. After that I'll ask about whatever I haven't heard yet.\n\nYour body first. Tell me what's actually going on with your health, the honest version: energy, sleep, how you move, what you eat, how you feel in your skin. Then let yourself want what you want. What would you love to be true here? If other parts of your life come up while you're talking, follow them. I'll sort it out.",
}

/**
 * The first anchor whose areas have not been asked about in a turn and have
 * no row beats written. Null once all four are covered.
 */
export function nextAnchor(
  turns: Pick<DraftSessionTurn, 'target_categories'>[],
  categoryText: Pick<DraftSessionCategoryText, 'category' | 'now_text' | 'dream_text'>[],
): { index: number; targets: LifeCategoryKey[] } | null {
  const asked = new Set<string>()
  for (const t of turns) for (const c of t.target_categories || []) asked.add(c)
  const written = new Set<string>()
  for (const row of categoryText) {
    if ((row.now_text || '').trim() || (row.dream_text || '').trim()) written.add(row.category)
  }
  for (let i = 0; i < CORE_FOUR_ANCHORS.length; i++) {
    const targets = CORE_FOUR_ANCHORS[i]
    const covered = targets.some((c) => asked.has(c)) || targets.every((c) => written.has(c))
    if (!covered) return { index: i, targets: [...targets] }
  }
  return null
}

export function buildDirectorSystemPrompt(params: {
  firstName?: string | null
  rosterBlock?: string | null
  personaBlock?: string | null
}): string {
  const name = params.firstName?.trim() || 'the member'
  const known: string[] = []
  if (params.rosterBlock?.trim()) known.push(params.rosterBlock.trim())
  if (params.personaBlock?.trim()) {
    known.push(`Understanding so far ([hypothesis] = your working read, never assert it as fact):\n${params.personaBlock.trim()}`)
  }
  const knownBlock = known.length
    ? `\nWHAT YOU ALREADY KNOW ABOUT ${name.toUpperCase()}\n${known.join('\n')}\n`
    : ''

  return `${VIVA_PERSONA}

You are writing the NEXT INVITATION CARD in ${name}'s Life Vision intake. This is not a chat reply and not a question-and-answer. ${name} reads your card, then talks (usually out loud, into a microphone) for a few minutes. The more they say, the better the vision you write later. Your job is to open the door to a long answer and get out of the way.
${knownBlock}
THE CARD
- 40 to 80 words. One paragraph, or two short ones.
- Open with ONE sentence that shows you heard what they just said: a name they used, a place, a phrase of theirs, or a thread that carried across areas. Only if there is a last turn. Never recite facts back as proof of listening; never praise ("great job", "love that").
- Then name the area (or two) you want next, in plain words, and ask for both halves: what's actually true there right now, and what they would love to be true. Invite specifics: who, where, when, what it looks like on an ordinary day.
- Write it the way a person talks across a table. Never "First, describe... Then, tell me..." Never number or sequence the steps. Never list instructions. If it could be a form label, rewrite it.
- The permission line "or tell me you haven't pictured this yet, and we'll leave it blank" is ONLY for an EMPTY area in a gap-filling turn, and never for health, money, or work (everyone has something true there). Omit it otherwise.
- Say drifting into other areas is fine at most once every few cards, in your own words, and only when it fits. The member already knows you sort it.
- One ask. Never stack questions. Never make it sound like a form.
- Use their vocabulary for how life works (God, Universe, Source, energy, none of it). Never convert them.
- Second person, warm, direct. No emojis. No bullet points. No headings.

SAFETY
- Honor pain before anything else. No silver linings, no "at least".
- Never diagnose. Never give medical, legal, or financial advice.

OUTPUT: strict JSON only, no markdown fences:
{ "targets": ["<category key>", ...], "prompt": "<the card text>" }
Category keys: ${LIFE_CATEGORY_KEYS.join(', ')}`
}

export function buildDirectorUserPrompt(params: {
  coverageBlock: string
  /** Core-four anchor still to walk. When set, targets are fixed. */
  forcedTargets?: LifeCategoryKey[] | null
  anchorIndex?: number | null
}): string {
  const parts: string[] = [params.coverageBlock, '']
  if (params.forcedTargets?.length) {
    const labels = params.forcedTargets.map((c) => getVisionCategoryLabel(c)).join(', ')
    const anchorLabel = params.anchorIndex != null ? CORE_FOUR_LABELS[params.anchorIndex] : labels
    parts.push(
      `THIS TURN IS ANCHORED. Targets are fixed: ${params.forcedTargets.join(', ')} (${anchorLabel}). Write the card for exactly these targets. Return "targets" as given.`,
      'If the coverage shows they already touched these areas while talking about something else, build on that excerpt instead of starting cold.',
    )
  } else {
    parts.push(
      'THIS TURN FILLS GAPS. Pick 1 or 2 target areas from the coverage map using this priority:',
      '1. EMPTY areas before THIN areas.',
      '2. Among THIN: areas with no dream yet before areas that only need more words.',
      '3. Skip CLEARED and UNKNOWN areas entirely.',
      '4. Prefer pairing two areas only when they naturally sit together for this person (home + family, work + money).',
      'If every remaining area is THIN only on words, pick the thinnest and ask for the ordinary-day detail.',
    )
  }
  parts.push('', 'Write the card now. Strict JSON only.')
  return parts.join('\n')
}

/** Parse the model's JSON; fall back to the forced targets when it misbehaves. */
export function parseDirectorOutput(
  raw: string,
  fallbackTargets: LifeCategoryKey[],
): { targets: LifeCategoryKey[]; prompt: string } | null {
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  try {
    const parsed = JSON.parse(cleaned) as { targets?: unknown; prompt?: unknown }
    const prompt = typeof parsed.prompt === 'string' ? parsed.prompt.trim() : ''
    if (!prompt) return null
    const targets = Array.isArray(parsed.targets)
      ? parsed.targets.filter((t): t is LifeCategoryKey => typeof t === 'string' && isLifeCategoryKey(t))
      : []
    return { targets: fallbackTargets.length ? fallbackTargets : targets.slice(0, 2), prompt }
  } catch {
    return null
  }
}

/**
 * Model-free fallback when the director call fails: a plain card for the
 * given targets so the member is never stuck.
 */
export function fallbackDirectorPrompt(targets: LifeCategoryKey[], empty: boolean): string {
  const labels = targets.map((c) => getVisionCategoryLabel(c).toLowerCase())
  const area = labels.length === 1 ? labels[0] : `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`
  const permission = empty
    ? " Or tell me you haven't pictured this yet, and we'll leave it blank."
    : ''
  return `Let's go to ${area}. Tell me what's actually true there right now, the honest version, and then what you would love to be true. Who's there, where you are, what an ordinary day looks like.${permission}`
}
