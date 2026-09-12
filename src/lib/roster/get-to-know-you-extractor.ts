/**
 * Get to Know You extractor — runs in the background (via after()) during the
 * first Life Vision conversation. One LLM pass reads the recent transcript
 * and returns BOTH:
 *
 * - member_roster facts (people, dates, place, vocation, losses)
 * - member_persona updates (identity, values, season, desires, relating)
 *
 * Invisible to the member. Never blocks the stream. Modeled on
 * src/lib/viva/memory-extractor.ts, but writes to the roster/persona tables
 * through the non-destructive merge helpers in ./store.
 *
 * Durability filter: persona is durable understanding, not momentary states.
 * The prompt forces a fact / durable / momentary classification and discards
 * momentary. Provenance: every persona item is stated or inferred, with
 * short evidence quotes supporting inferences. No numeric confidence.
 */

import { generateText } from 'ai'
import { gateway, gatewayGenerationId } from '@/lib/ai/gateway'
import type { SupabaseClient } from '@supabase/supabase-js'
import { trackTokenUsage } from '@/lib/tokens/tracking'
import { saveRosterUpdate, savePersonaUpdate } from './store'
import type {
  PersonaItem,
  PersonaUpdate,
  RosterUpdate,
} from './types'

// Mid-tier on purpose: this pass handles partial dates, stated-vs-inferred
// provenance, and the durability filter — too delicate for a mini model.
const EXTRACTOR_MODEL = 'openai/gpt-4o'

const EXTRACTION_PROMPT = `You are VIVA's quiet memory. During a get-to-know-you conversation, you extract two kinds of knowledge from the member's own words. The member never sees this. Output JSON only.

1. ROSTER — objectively true facts about their world. Only what the MEMBER stated. Partial dates are fine and expected: "2018-06-12", "2018-06", or "2018". Never invent precision they did not give ("she's 7" is an age hint, not a birthday — put nothing in birthday). Fields:
- partner: { name, birthday, married_on }
- children: [{ name, birthday }]
- pets: [{ name, kind, age }]  (age as they said it: "4", "about 10")
- people: [{ name, role, birthday, deceased }]  (parents, siblings, best friends — role like "mom", "brother", "best friend")
- place: { city, region }
- named_things: [{ name, what }]  (a named boat, car, house — "Second Wind", "their sailboat")
- tender_ground: [{ who, note, date }]  (losses, griefs, estrangements — note is ONE neutral factual line; date only if they offered it)
- days_that_matter: [{ date, what, weight }]  (weight: "celebrate" for birthdays/anniversaries, "gentle" for loss anniversaries and hard dates)
- vocation: what they do, in their words
- pronouns: ONLY if the member explicitly stated their pronouns. Never infer from names or context. Usually null.

If they lost a child or person: the person goes in tender_ground (and people with deceased: true if named as family). Respect how THEY count their children.

2. PERSONA — what helps VIVA understand them. Every item: { "value": "...", "source": "stated" | "inferred", "evidence": ["short quote"] }.
- "stated": they said it in so many words. Evidence optional.
- "inferred": your working hypothesis from patterns in what they said. Evidence REQUIRED — 1-3 short quotes or tight paraphrases from the conversation that support it.

DURABILITY FILTER — before writing any persona item, classify it:
(a) a fact about the person -> roster, not persona
(b) a durable preference, value, desire, pattern, or self-understanding -> persona
(c) merely true in this moment -> DISCARD. "I'm so sick of homeschooling today" is not ready_to_release. "I just want to sell everything and move to Italy" after a bad day is not a secret want. Momentary states color the conversation; they do not become identity.

Persona sections and fields (all optional — fill only what has real material):
- self: identity_language[], core_values[], joy_sources[], hobbies[], strengths[], important_roles[], what_matters_most[], feels_most_like_me[], non_negotiables[], formative_stories[]
- season: season_name, what_is_working[], current_tensions[], ready_for_more[], ready_to_release[]
- desire: deferred_dreams[], secret_wants[], desired_experiences[], desired_identity[], freedom_means, enough_means, success_means
- relating: coaching_style, challenge_level, processing_style, support_preferences[], meaning_frame, preferred_spiritual_language[], language_to_avoid[]

Notes:
- preferred_spiritual_language: the actual words they use for how life works (God, Universe, Source, energy, faith). language_to_avoid: vocabulary they pushed back on or that clearly is not theirs.
- desired_identity: who they are becoming in the life they want, not what they own.
- formative_stories: one-line distillations ("moving every few years taught her to make friends fast").
- Do not duplicate what is already known (provided below). Only new facts or genuinely deeper versions.
- Each value: one clear sentence or phrase, member's vocabulary where possible.

Return JSON:
{
  "roster": { ...only fields with new material... },
  "persona": { "self": {...}, "season": {...}, "desire": {...}, "relating": {...} }
}
If nothing new: { "roster": {}, "persona": {} }
No markdown fences. JSON only.`

export interface GetToKnowYouExtractionResult {
  roster: RosterUpdate
  persona: PersonaUpdate
}

const str = (v: unknown, max = 300): string | undefined => {
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  return t ? t.slice(0, max) : undefined
}

function sanitizeItem(raw: unknown): PersonaItem | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const r = raw as Record<string, unknown>
  const value = str(r.value, 500)
  if (!value) return undefined
  const source = r.source === 'stated' ? 'stated' : 'inferred'
  const evidence = Array.isArray(r.evidence)
    ? r.evidence.map((e) => str(e, 240)).filter((e): e is string => Boolean(e)).slice(0, 3)
    : []
  return { value, source, ...(evidence.length > 0 ? { evidence } : {}) }
}

function sanitizeItemArray(raw: unknown): PersonaItem[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const items = raw.map(sanitizeItem).filter((i): i is PersonaItem => Boolean(i))
  return items.length > 0 ? items.slice(0, 20) : undefined
}

function sanitizePersonaSection(
  raw: unknown,
  arrayKeys: string[],
  scalarKeys: string[],
): Record<string, PersonaItem | PersonaItem[]> | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const r = raw as Record<string, unknown>
  const out: Record<string, PersonaItem | PersonaItem[]> = {}
  for (const key of arrayKeys) {
    const items = sanitizeItemArray(r[key])
    if (items) out[key] = items
  }
  for (const key of scalarKeys) {
    const item = sanitizeItem(r[key])
    if (item) out[key] = item
  }
  return Object.keys(out).length > 0 ? out : undefined
}

function sanitizeEntityArray<T>(
  raw: unknown,
  mapFn: (r: Record<string, unknown>) => T | undefined,
): T[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const items = raw
    .map((e) => (e && typeof e === 'object' ? mapFn(e as Record<string, unknown>) : undefined))
    .filter((e): e is T => Boolean(e))
  return items.length > 0 ? items.slice(0, 30) : undefined
}

function sanitize(parsed: Record<string, unknown>): GetToKnowYouExtractionResult {
  const rawRoster = (parsed.roster || {}) as Record<string, unknown>
  const rawPersona = (parsed.persona || {}) as Record<string, unknown>

  const roster: RosterUpdate = {}
  if (rawRoster.partner && typeof rawRoster.partner === 'object') {
    const p = rawRoster.partner as Record<string, unknown>
    const partner = { name: str(p.name), birthday: str(p.birthday, 20), married_on: str(p.married_on, 20) }
    if (partner.name || partner.birthday || partner.married_on) roster.partner = partner
  }
  roster.children = sanitizeEntityArray(rawRoster.children, (c) => {
    const name = str(c.name)
    return name ? { name, birthday: str(c.birthday, 20) } : undefined
  })
  roster.pets = sanitizeEntityArray(rawRoster.pets, (p) => {
    const name = str(p.name)
    return name ? { name, kind: str(p.kind), age: str(p.age, 40) } : undefined
  })
  roster.people = sanitizeEntityArray(rawRoster.people, (p) => {
    const name = str(p.name)
    return name
      ? { name, role: str(p.role), birthday: str(p.birthday, 20), deceased: p.deceased === true || undefined }
      : undefined
  })
  if (rawRoster.place && typeof rawRoster.place === 'object') {
    const pl = rawRoster.place as Record<string, unknown>
    const place = { city: str(pl.city), region: str(pl.region) }
    if (place.city || place.region) roster.place = place
  }
  roster.named_things = sanitizeEntityArray(rawRoster.named_things, (n) => {
    const nm = str(n.name)
    return nm ? { name: nm, what: str(n.what) } : undefined
  })
  roster.tender_ground = sanitizeEntityArray(rawRoster.tender_ground, (t) => {
    const who = str(t.who)
    const note = str(t.note, 500)
    return who || note ? { who, note, date: str(t.date, 20) } : undefined
  })
  roster.days_that_matter = sanitizeEntityArray(rawRoster.days_that_matter, (d) => {
    const what = str(d.what)
    if (!what) return undefined
    return { what, date: str(d.date, 20), weight: d.weight === 'gentle' ? 'gentle' as const : 'celebrate' as const }
  })
  const vocation = str(rawRoster.vocation, 500)
  if (vocation) roster.vocation = vocation
  const pronouns = str(rawRoster.pronouns, 40)
  if (pronouns) roster.pronouns = pronouns

  // Drop undefined array keys so merge doesn't touch them
  for (const key of Object.keys(roster) as (keyof RosterUpdate)[]) {
    if (roster[key] === undefined) delete roster[key]
  }

  const persona: PersonaUpdate = {}
  const self = sanitizePersonaSection(
    rawPersona.self,
    ['identity_language', 'core_values', 'joy_sources', 'hobbies', 'strengths', 'important_roles', 'what_matters_most', 'feels_most_like_me', 'non_negotiables', 'formative_stories'],
    [],
  )
  if (self) persona.self = self
  const season = sanitizePersonaSection(
    rawPersona.season,
    ['what_is_working', 'current_tensions', 'ready_for_more', 'ready_to_release'],
    ['season_name'],
  )
  if (season) persona.season = season
  const desire = sanitizePersonaSection(
    rawPersona.desire,
    ['deferred_dreams', 'secret_wants', 'desired_experiences', 'desired_identity'],
    ['freedom_means', 'enough_means', 'success_means'],
  )
  if (desire) persona.desire = desire
  const relating = sanitizePersonaSection(
    rawPersona.relating,
    ['support_preferences', 'preferred_spiritual_language', 'language_to_avoid'],
    ['coaching_style', 'challenge_level', 'processing_style', 'meaning_frame'],
  )
  if (relating) persona.relating = relating

  return { roster, persona }
}

/**
 * Extracts roster + persona updates from recent conversation turns.
 * `knownContext` is the already-rendered roster/persona so the model
 * doesn't re-extract what is known.
 */
export async function extractGetToKnowYou(
  messages: { role: string; content: string }[],
  knownContext: string,
  userId?: string,
): Promise<GetToKnowYouExtractionResult> {
  const empty: GetToKnowYouExtractionResult = { roster: {}, persona: {} }
  try {
    const conversationText = messages
      .map((m) => `${m.role === 'user' ? 'MEMBER' : 'VIVA'}: ${m.content}`)
      .join('\n\n')
    if (!conversationText.trim()) return empty

    const contextNote = knownContext.trim()
      ? `Already known about this member (do not re-extract; only new or deeper):\n${knownContext.trim()}\n\n`
      : ''

    const result = await generateText({
      model: gateway(EXTRACTOR_MODEL),
      system: EXTRACTION_PROMPT,
      prompt: `${contextNote}Conversation:\n\n${conversationText}`,
      temperature: 0.2,
    })

    // Cost ledger only — background helper never deducts member tokens.
    if (result.usage?.totalTokens) {
      trackTokenUsage({
        user_id: userId ?? null,
        action_type: 'background_processing',
        model_used: EXTRACTOR_MODEL.split('/').pop() || EXTRACTOR_MODEL,
        tokens_used: result.usage.totalTokens,
        input_tokens: result.usage.inputTokens || 0,
        output_tokens: result.usage.outputTokens || 0,
        provider: 'vercel_gateway',
        provider_request_id: gatewayGenerationId(result),
        billable: false,
        success: true,
        metadata: { helper: 'get_to_know_you_extractor' },
      }).catch(() => {})
    }

    const cleaned = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return sanitize(JSON.parse(cleaned))
  } catch (error) {
    console.error('[Get To Know You Extractor] Error:', error)
    return empty
  }
}

/** Extract from the latest turns and persist through the merge helpers. */
export async function runGetToKnowYouExtraction(
  supabase: SupabaseClient,
  userId: string,
  messages: { role: string; content: string }[],
  knownContext: string,
): Promise<void> {
  const { roster, persona } = await extractGetToKnowYou(messages, knownContext, userId)
  const hasRoster = Object.keys(roster).length > 0
  const hasPersona = Object.keys(persona).length > 0
  if (hasRoster) await saveRosterUpdate(supabase, userId, roster)
  if (hasPersona) await savePersonaUpdate(supabase, userId, persona)
}
