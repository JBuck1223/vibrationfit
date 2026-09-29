/**
 * Hidden markers VIVA writes during Activation chat. Stripped from the
 * member-facing stream; parsed on the server to fill activations columns.
 */

import { LIFE_CATEGORY_KEYS } from '@/lib/design-system/vision-categories'

export const FIELD_OPEN = '<<<FIELD '
export const FIELD_OPEN_CLOSE = '>>>'
export const FIELD_CLOSE = '<<<END FIELD>>>'
export const READY_MARKER = '<<<READY>>>'

export type DreamKey = 'want' | 'why' | 'feel' | 'become'

export interface IntakeExtract {
  current_state?: string
  reflection?: string
  dream: Partial<Record<DreamKey, string>>
  category?: string
  needs_support?: boolean
  ready: boolean
}

const DREAM_KEYS: DreamKey[] = ['want', 'why', 'feel', 'become']
const FIELD_RE = /<<<FIELD\s+([a-z._]+)>>>[\r\n]*([\s\S]*?)<<<END FIELD>>>/gi

export function stripIntakeMarkers(text: string): string {
  return hideIncompleteMarkers(
    text
      .replace(FIELD_RE, '')
      .replace(READY_MARKER, ''),
  )
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Strip complete markers and hide a trailing incomplete marker while streaming. */
export function stripIntakeMarkersLive(text: string): string {
  let out = text.replace(FIELD_RE, '').replace(READY_MARKER, '')
  return hideIncompleteMarkers(out).replace(/\n{3,}/g, '\n\n')
}

function hideIncompleteMarkers(text: string): string {
  const fieldOpen = text.lastIndexOf('<<<FIELD ')
  if (fieldOpen !== -1 && !text.slice(fieldOpen).includes(FIELD_CLOSE)) {
    return text.slice(0, fieldOpen)
  }
  const readyOpen = text.lastIndexOf('<<<READY')
  if (readyOpen !== -1 && !text.slice(readyOpen).startsWith(READY_MARKER)) {
    return text.slice(0, readyOpen)
  }
  const partial = text.lastIndexOf('<<<')
  if (partial !== -1 && !/<<<(FIELD |END FIELD>>>|READY>>>)/.test(text.slice(partial))) {
    return text.slice(0, partial)
  }
  return text
}

export function parseIntakeMarkers(raw: string): IntakeExtract {
  const extract: IntakeExtract = { dream: {}, ready: raw.includes(READY_MARKER) }
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
