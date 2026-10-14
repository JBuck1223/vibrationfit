/**
 * Passage tagger — stores the member's OWN words per life category during the
 * first-vision Draft Session.
 *
 * VIVA's SEED notes are short paraphrases (a coverage label). The tagger runs
 * beside them: it slices the member's latest message into verbatim passages
 * and tags each with a category and polarity. Nothing is rewritten. These
 * passages are the "current state" text the compose pass later expands, and
 * their word count is what the depth gate measures.
 *
 * Pure (no HTTP). Used by /api/viva/vision-update (inside after()) and by
 * scripts/vision/replay-first-vision.ts.
 */

import { generateText } from 'ai'
import type { SupabaseClient } from '@supabase/supabase-js'
import { gateway, gatewayGenerationId } from '@/lib/ai/gateway'
import { trackTokenUsage } from '@/lib/tokens/tracking'
import { LIFE_CATEGORY_KEYS, isLifeCategoryKey, type LifeCategoryKey } from '@/lib/design-system/vision-categories'
import { normalizeNoteText, type NotePolarity } from '@/lib/life-vision/draft-session'

export const PASSAGE_TAGGER_MODEL = 'openai/gpt-4o-mini'

export interface TaggedPassage {
  category: LifeCategoryKey
  polarity: NotePolarity
  /** Verbatim text from the member's message. */
  passage: string
}

const TAGGER_PROMPT = `You tag a member's own words by life area. Output JSON only.

You receive the question VIVA asked and the member's reply. Split the MEMBER'S reply into passages and tag each one. A passage is one sentence or several consecutive sentences copied EXACTLY as written — same words, same order, same spelling. Never paraphrase, summarize, fix grammar, or merge non-adjacent sentences.

Life areas (category keys): ${LIFE_CATEGORY_KEYS.join(', ')}
- fun: hobbies, play, what they do for joy
- health: body, energy, fitness, food, rest, mental health
- travel: trips, places they go or want to go, adventure
- love: romantic partner, marriage, dating
- family: children, parents, siblings, chosen family, pets as family
- social: friends, community, people they spend time with
- home: the house, the neighborhood, home life rhythms, where they live
- work: job, career, business, calling, education toward work
- money: income, debt, savings, investing, financial beliefs
- stuff: possessions, car, clothes, things they own or want
- giving: service, generosity, helping, legacy
- spirituality: faith, meaning, practice, how they believe life works, inner work

Polarity:
- "contrast": what is true that they do not want, what hurts, what is missing, what they are done with
- "clarity": what they love, want, choose, or already enjoy
- "unknown": ONLY when they say they do not know yet or have not pictured this area (a partner they have not met, a home they cannot picture, a trip they have not chosen). A relationship in flux, a job they are unsure about, a body they are inconsistent with — those are "contrast", not "unknown". Passage is their exact words saying they do not know.

Rules:
- One passage may be tagged under more than one category when it truly belongs to both (a home evening with the kids is both home and family). Output it once per category.
- Short factual answers to VIVA's question count: names, ages, a city, a pet's breed, a number. Tag them under the area VIVA's question was about (pets and children are family and home; a partner's name is love).
- Skip filler ("Yes!", "okay", "sounds good"), questions back to VIVA, and anything about how they want to be coached, helped, or talked to. Never tag a coaching-style answer as unknown.
- If the reply has no life material, output [].
- Keep passages contiguous. Prefer a few longer passages over many fragments; a passage can be a whole paragraph if it stays on one area.

Output: a JSON array of { "category": "...", "polarity": "contrast" | "clarity" | "unknown", "passage": "..." }`

function normalizeForMatch(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function isVerbatim(passage: string, source: string): boolean {
  const p = normalizeForMatch(passage)
  if (p.length < 8) return false
  return normalizeForMatch(source).includes(p)
}

function sanitize(raw: unknown, source: string): TaggedPassage[] {
  if (!Array.isArray(raw)) return []
  const out: TaggedPassage[] = []
  const seen = new Set<string>()
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const { category, polarity, passage } = item as Record<string, unknown>
    if (typeof category !== 'string' || !isLifeCategoryKey(category)) continue
    if (polarity !== 'contrast' && polarity !== 'clarity' && polarity !== 'unknown') continue
    if (typeof passage !== 'string') continue
    const text = passage.trim()
    if (!text || !isVerbatim(text, source)) continue
    const key = `${category}|${polarity}|${normalizeNoteText(text)}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ category, polarity, passage: text })
  }
  return out
}

/**
 * Tag the member's latest message. `vivaQuestion` is the assistant turn that
 * preceded it (context only; never tagged).
 */
export async function tagMemberPassages(input: {
  memberMessage: string
  vivaQuestion?: string | null
  /**
   * The area the member was writing about (scratch flow). Passages default to
   * this category unless they are clearly about another area.
   */
  focusCategory?: LifeCategoryKey | null
  /** Token ledger owner. Null skips tracking (scripts). */
  userId?: string | null
  /** Client for the ledger; defaults to the server client inside API routes. */
  supabase?: SupabaseClient
}): Promise<TaggedPassage[]> {
  const memberMessage = input.memberMessage?.trim()
  if (!memberMessage || memberMessage.split(/\s+/).length < 3) return []

  const focusLine = input.focusCategory
    ? `The member was writing specifically about the "${input.focusCategory}" area. Tag passages under "${input.focusCategory}" by default; use another category only when a passage is clearly about that other area (it may also stay under "${input.focusCategory}").\n\n`
    : ''

  try {
    const result = await generateText({
      model: gateway(PASSAGE_TAGGER_MODEL),
      system: TAGGER_PROMPT,
      prompt: `${focusLine}${input.vivaQuestion?.trim() ? `VIVA asked:\n${input.vivaQuestion.trim()}\n\n` : ''}MEMBER replied:\n${memberMessage}`,
      temperature: 0,
    })

    if (result.usage?.totalTokens && input.userId) {
      trackTokenUsage(
        {
          user_id: input.userId,
          action_type: 'background_processing',
          model_used: PASSAGE_TAGGER_MODEL.split('/').pop() || PASSAGE_TAGGER_MODEL,
          tokens_used: result.usage.totalTokens,
          input_tokens: result.usage.inputTokens || 0,
          output_tokens: result.usage.outputTokens || 0,
          provider: 'vercel_gateway',
          provider_request_id: gatewayGenerationId(result),
          billable: false,
          success: true,
          metadata: { helper: 'passage_tagger' },
        },
        input.supabase,
      ).catch(() => {})
    }

    const cleaned = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return sanitize(JSON.parse(cleaned), memberMessage)
  } catch (error) {
    console.error('[Passage Tagger] Error:', error)
    return []
  }
}

/** Short label for the board caption: first ~12 words of the passage. */
export function passageLabel(passage: string): string {
  const words = passage.trim().split(/\s+/)
  if (words.length <= 12) return passage.trim()
  return `${words.slice(0, 12).join(' ')}…`
}

/** Persist tagged passages as member-sourced notes (dedup against existing). */
export async function persistMemberPassages(
  supabase: SupabaseClient,
  sessionId: string,
  passages: TaggedPassage[],
): Promise<number> {
  if (passages.length === 0) return 0

  const { data: existing } = await supabase
    .from('vision_draft_session_notes')
    .select('category, polarity, member_text')
    .eq('session_id', sessionId)
    .eq('source', 'member')

  const seen = new Set(
    (existing || []).map(
      (n) => `${n.category}|${n.polarity}|${normalizeNoteText(n.member_text || '')}`,
    ),
  )

  const rows = passages
    .filter((p) => {
      const key = `${p.category}|${p.polarity}|${normalizeNoteText(p.passage)}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map((p) => ({
      session_id: sessionId,
      category: p.category,
      polarity: p.polarity,
      text: passageLabel(p.passage),
      member_text: p.passage,
      source: 'member' as const,
    }))

  if (rows.length === 0) return 0
  const { error } = await supabase.from('vision_draft_session_notes').insert(rows)
  if (error) {
    console.error('[Passage Tagger] Failed to persist passages', error)
    return 0
  }
  return rows.length
}
