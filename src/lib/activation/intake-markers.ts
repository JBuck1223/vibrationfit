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

export function isIntakeReady(params: {
  current_state?: string | null
  dream_response?: Record<string, string> | null
  category?: string | null
}): boolean {
  const want = params.dream_response?.want?.trim()
  return !!(params.current_state?.trim() && want && params.category)
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
