/**
 * Hidden markers VIVA writes during Activation chat. Stripped from the
 * member-facing stream; parsed on the server to fill activations columns.
 */

import { LIFE_CATEGORY_KEYS, isLifeCategoryKey } from '@/lib/design-system/vision-categories'
import type { ActivationSeedNote } from '@/lib/activation/orchestrator'

export const FIELD_OPEN = '<<<FIELD '
export const FIELD_OPEN_CLOSE = '>>>'
export const FIELD_CLOSE = '<<<END FIELD>>>'
export const READY_MARKER = '<<<READY>>>'
export const SEED_OPEN = '<<<SEED '
export const SEED_CLOSE = '<<<END SEED>>>'

export type DreamKey = 'want' | 'why' | 'feel' | 'become'
export type SeedPolarity = 'contrast' | 'clarity'

/** A seed as VIVA wrote it this turn, before it is merged into the row. */
export interface IntakeSeed {
  category: string
  polarity: SeedPolarity
  key: string
  text: string
}

export interface IntakeExtract {
  current_state?: string
  reflection?: string
  dream: Partial<Record<DreamKey, string>>
  category?: string
  needs_support?: boolean
  seeds: IntakeSeed[]
  ready: boolean
}

const DREAM_KEYS: DreamKey[] = ['want', 'why', 'feel', 'become']
const FIELD_RE = /<<<FIELD\s+([a-z._]+)>>>[\r\n]*([\s\S]*?)<<<END FIELD>>>/gi
// <<<SEED category polarity [key]>>> ... <<<END SEED>>>  — key is optional for robustness.
const SEED_RE = /<<<SEED\s+([a-z_]+)\s+(contrast|clarity)(?:\s+([a-z0-9][a-z0-9-]*))?\s*>>>[\r\n]*([\s\S]*?)<<<END SEED>>>/gi

export function stripIntakeMarkers(text: string): string {
  return hideIncompleteMarkers(
    text
      .replace(FIELD_RE, '')
      .replace(SEED_RE, '')
      .replace(READY_MARKER, ''),
  )
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Strip complete markers and hide a trailing incomplete marker while streaming. */
export function stripIntakeMarkersLive(text: string): string {
  const out = text.replace(FIELD_RE, '').replace(SEED_RE, '').replace(READY_MARKER, '')
  return hideIncompleteMarkers(out).replace(/\n{3,}/g, '\n\n')
}

function hideIncompleteMarkers(text: string): string {
  const fieldOpen = text.lastIndexOf(FIELD_OPEN)
  if (fieldOpen !== -1 && !text.slice(fieldOpen).includes(FIELD_CLOSE)) {
    return text.slice(0, fieldOpen)
  }
  const seedOpen = text.lastIndexOf(SEED_OPEN)
  if (seedOpen !== -1 && !text.slice(seedOpen).includes(SEED_CLOSE)) {
    return text.slice(0, seedOpen)
  }
  const readyOpen = text.lastIndexOf('<<<READY')
  if (readyOpen !== -1 && !text.slice(readyOpen).startsWith(READY_MARKER)) {
    return text.slice(0, readyOpen)
  }
  const partial = text.lastIndexOf('<<<')
  if (partial !== -1 && !/<<<(FIELD |END FIELD>>>|SEED |END SEED>>>|READY>>>)/.test(text.slice(partial))) {
    return text.slice(0, partial)
  }
  return text
}

export function normalizeSeedText(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim().toLowerCase()
}

/** Stable fallback key when VIVA omits one: short hash of the normalized text. */
function hashKey(text: string): string {
  let hash = 0
  const normalized = normalizeSeedText(text)
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 31 + normalized.charCodeAt(i)) | 0
  }
  return `auto-${(hash >>> 0).toString(36)}`
}

function parseSeedMarkers(raw: string): IntakeSeed[] {
  const seeds: IntakeSeed[] = []
  const re = new RegExp(SEED_RE.source, 'gi')
  let match: RegExpExecArray | null
  while ((match = re.exec(raw)) !== null) {
    const category = match[1].trim().toLowerCase()
    const polarity = match[2].trim().toLowerCase() as SeedPolarity
    const text = match[4].replace(/\n$/, '').trim()
    if (!text || !isLifeCategoryKey(category)) continue
    const key = (match[3] || '').trim().toLowerCase() || hashKey(text)
    seeds.push({ category, polarity, key, text })
  }
  return seeds
}

export function parseIntakeMarkers(raw: string): IntakeExtract {
  const extract: IntakeExtract = {
    dream: {},
    seeds: parseSeedMarkers(raw),
    ready: raw.includes(READY_MARKER),
  }
  const re = new RegExp(FIELD_RE.source, 'gi')
  let match: RegExpExecArray | null
  while ((match = re.exec(raw)) !== null) {
    const name = match[1].trim().toLowerCase()
    const value = match[2].trim()
    if (!value) continue
    if (name === 'current_state') extract.current_state = value
    else if (name === 'reflection') extract.reflection = value
    else if (name === 'needs_support') extract.needs_support = /^(true|yes|1)$/i.test(value)
    else if (name === 'category') {
      if ((LIFE_CATEGORY_KEYS as readonly string[]).includes(value)) extract.category = value
    } else if (name.startsWith('dream.')) {
      const key = name.slice(6) as DreamKey
      if (DREAM_KEYS.includes(key)) extract.dream[key] = value
    }
  }
  return extract
}

/**
 * Floors for the words that actually feed the Activation vision.
 * The generator never sees the raw chat — only these fields. A real Life
 * Vision area on a finished version runs from about 190 words up. The
 * conversation has no turn cap, so VIVA stays until the source can carry
 * a vision at least that long.
 */
export const ACTIVATION_VISION_SOURCE_MIN = {
  userWords: 200,
  currentStateWords: 60,
  wantWords: 90,
  textureWords: 40,
} as const

export function countWords(text: string | null | undefined): number {
  const trimmed = text?.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

export function userMessageWords(
  conversation: Array<{ role?: string; content?: string }> | null | undefined,
): number {
  if (!conversation?.length) return 0
  return conversation.reduce((sum, message) => {
    if (message?.role !== 'user') return sum
    return sum + countWords(message.content)
  }, 0)
}

export interface IntakeSubstance {
  userWords: number
  currentWords: number
  wantWords: number
  textureWords: number
  ready: boolean
  gaps: string[]
}

export function describeIntakeSubstance(params: {
  current_state?: string | null
  dream_response?: Record<string, string> | null
  category?: string | null
  conversation?: Array<{ role?: string; content?: string }> | null
}): IntakeSubstance {
  const min = ACTIVATION_VISION_SOURCE_MIN
  const currentWords = countWords(params.current_state)
  const wantWords = countWords(params.dream_response?.want)
  const textureWords = countWords(
    [params.dream_response?.why, params.dream_response?.feel, params.dream_response?.become]
      .filter((part) => part?.trim())
      .join(' '),
  )
  const userWords = userMessageWords(params.conversation)
  const gaps: string[] = []

  if (!params.category) gaps.push('category is not chosen')
  if (currentWords < min.currentStateWords) {
    gaps.push(
      `current_state is ${currentWords} words — write at least ${min.currentStateWords} of their specifics`,
    )
  }
  if (wantWords < min.wantWords) {
    gaps.push(
      `dream.want is ${wantWords} words — write at least ${min.wantWords} of the life they want, in scenes`,
    )
  }
  if (textureWords < min.textureWords) {
    gaps.push(
      `why / feel / become together are ${textureWords} words — need at least ${min.textureWords} of why it matters or how it feels`,
    )
  }
  if (userWords < min.userWords) {
    gaps.push(
      `they have written ${userWords} words — keep listening until at least ${min.userWords}`,
    )
  }

  return {
    userWords,
    currentWords,
    wantWords,
    textureWords,
    ready: gaps.length === 0,
    gaps,
  }
}

export function isIntakeReady(params: {
  current_state?: string | null
  dream_response?: Record<string, string> | null
  category?: string | null
  conversation?: Array<{ role?: string; content?: string }> | null
}): boolean {
  return describeIntakeSubstance(params).ready
}

/**
 * Merge this turn's seeds into the stored list. The same category+polarity+key
 * replaces the earlier note (richer detail on one fact stays one seed). A
 * different key with identical text is also collapsed so a forgotten key
 * cannot double count.
 */
export function mergeSeeds(
  prev: ActivationSeedNote[] | null | undefined,
  next: IntakeSeed[],
  turn: number,
): ActivationSeedNote[] {
  const byKey = new Map<string, ActivationSeedNote>()
  const byText = new Map<string, string>()

  const put = (seed: ActivationSeedNote) => {
    const keyId = `${seed.category}|${seed.polarity}|${seed.key}`
    const textId = `${seed.category}|${seed.polarity}|${normalizeSeedText(seed.text)}`
    const existingKeyForText = byText.get(textId)
    if (existingKeyForText && existingKeyForText !== keyId) {
      // Same words under a different key — keep the first key, refresh the turn.
      const existing = byKey.get(existingKeyForText)
      if (existing) byKey.set(existingKeyForText, { ...existing, turn: seed.turn })
      return
    }
    const existing = byKey.get(keyId)
    if (existing) {
      byText.delete(`${seed.category}|${seed.polarity}|${normalizeSeedText(existing.text)}`)
    }
    byKey.set(keyId, seed)
    byText.set(textId, keyId)
  }

  for (const seed of asSeedNotes(prev)) put(seed)
  for (const seed of next) {
    put({ category: seed.category, polarity: seed.polarity, key: seed.key, text: seed.text, turn })
  }
  return Array.from(byKey.values())
}

export function asSeedNotes(value: unknown): ActivationSeedNote[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (s): s is ActivationSeedNote =>
      !!s &&
      typeof s === 'object' &&
      typeof (s as ActivationSeedNote).category === 'string' &&
      isLifeCategoryKey((s as ActivationSeedNote).category) &&
      ((s as ActivationSeedNote).polarity === 'contrast' || (s as ActivationSeedNote).polarity === 'clarity') &&
      typeof (s as ActivationSeedNote).text === 'string' &&
      !!(s as ActivationSeedNote).text.trim(),
  ).map((s) => ({
    category: s.category,
    polarity: s.polarity,
    key: typeof s.key === 'string' && s.key ? s.key : hashKey(s.text),
    text: s.text,
    turn: typeof s.turn === 'number' ? s.turn : 0,
  }))
}

export function mergeDream(
  prev: Record<string, string> | null | undefined,
  next: Partial<Record<DreamKey, string>>,
): Record<string, string> {
  return {
    want: next.want ?? prev?.want ?? '',
    why: next.why ?? prev?.why ?? '',
    feel: next.feel ?? prev?.feel ?? '',
    become: next.become ?? prev?.become ?? '',
  }
}
