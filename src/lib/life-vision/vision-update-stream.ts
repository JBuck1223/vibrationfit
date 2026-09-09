/**
 * Parser for the VIVA vision-update / first-vision stream.
 *
 * Assistant replies interleave conversation with:
 *
 *   <<<VISION fun>>>
 *   (full replacement text for the category)
 *   <<<END VISION>>>
 *
 * and, in create-mode gathering:
 *
 *   <<<SEED fun contrast>>>
 *   (a contrast or clarity note)
 *   <<<END SEED>>>
 *
 * The parser splits a (possibly partial, still-streaming) assistant message
 * into chat text, per-category proposals, and session seeds — hiding
 * partially-streamed markers so nothing flickers in the chat bubble.
 */

import { isLifeCategoryKey, isValidVisionCategory } from '@/lib/design-system/vision-categories'

const VISION_OPEN_RE = /<<<VISION\s+([a-z_]+)\s*>>>/
const SEED_OPEN_RE = /<<<SEED\s+([a-z_]+)\s+(contrast|clarity)\s*>>>/
const VISION_CLOSE = '<<<END VISION>>>'
const SEED_CLOSE = '<<<END SEED>>>'

export const VISION_SEED_OPEN_PREFIX = '<<<SEED '
export const VISION_SEED_CLOSE = SEED_CLOSE

export type SeedPolarity = 'contrast' | 'clarity'

export interface VisionUpdateProposal {
  category: string
  text: string
  /** False while the proposal is still streaming (no closing marker yet). */
  complete: boolean
}

export interface VisionUpdateSeed {
  category: string
  polarity: SeedPolarity
  text: string
  complete: boolean
}

export interface ParsedVisionUpdateMessage {
  /** Conversation text with proposal and seed blocks removed. */
  chatText: string
  proposals: VisionUpdateProposal[]
  seeds: VisionUpdateSeed[]
}

type OpenHit =
  | { kind: 'vision'; index: number; category: string; length: number }
  | { kind: 'seed'; index: number; category: string; polarity: SeedPolarity; length: number }

function nextOpen(rest: string): OpenHit | null {
  const vision = VISION_OPEN_RE.exec(rest)
  const seed = SEED_OPEN_RE.exec(rest)
  const visionIndex = vision?.index ?? Infinity
  const seedIndex = seed?.index ?? Infinity
  if (visionIndex === Infinity && seedIndex === Infinity) return null
  if (vision && visionIndex <= seedIndex) {
    return {
      kind: 'vision',
      index: visionIndex,
      category: vision[1],
      length: vision[0].length,
    }
  }
  if (seed) {
    return {
      kind: 'seed',
      index: seedIndex,
      category: seed[1],
      polarity: seed[2] as SeedPolarity,
      length: seed[0].length,
    }
  }
  return null
}

/** Trim a trailing partial marker so it never renders. */
function trimPartialMarker(text: string): string {
  for (let len = Math.min(text.length, 48); len > 0; len--) {
    const tail = text.slice(-len)
    if (
      '<<<VISION '.startsWith(tail) ||
      '<<<SEED '.startsWith(tail) ||
      VISION_CLOSE.startsWith(tail) ||
      SEED_CLOSE.startsWith(tail) ||
      /^<<<VISION\s+[a-z_]*>?>?$/.test(tail) ||
      /^<<<SEED\s+[a-z_]*(\s+[a-z]*)?>?>?$/.test(tail)
    ) {
      return text.slice(0, -len)
    }
  }
  return text
}

export function parseVisionUpdateMessage(raw: string): ParsedVisionUpdateMessage {
  const proposals: VisionUpdateProposal[] = []
  const seeds: VisionUpdateSeed[] = []
  let chatText = ''
  let rest = raw

  while (rest.length > 0) {
    const hit = nextOpen(rest)
    if (!hit) {
      chatText += trimPartialMarker(rest)
      break
    }

    chatText += rest.slice(0, hit.index)
    const afterOpen = rest.slice(hit.index + hit.length)

    if (hit.kind === 'vision') {
      const closeIdx = afterOpen.indexOf(VISION_CLOSE)
      const valid = isValidVisionCategory(hit.category)

      if (closeIdx === -1) {
        if (valid) {
          proposals.push({
            category: hit.category,
            text: trimPartialMarker(afterOpen).replace(/^\n/, ''),
            complete: false,
          })
        } else {
          chatText += trimPartialMarker(afterOpen)
        }
        break
      }

      const body = afterOpen.slice(0, closeIdx).replace(/^\n/, '').replace(/\n$/, '')
      if (valid) {
        proposals.push({ category: hit.category, text: body, complete: true })
      } else {
        chatText += body
      }
      rest = afterOpen.slice(closeIdx + VISION_CLOSE.length)
      continue
    }

    const closeIdx = afterOpen.indexOf(SEED_CLOSE)
    const valid = isLifeCategoryKey(hit.category)

    if (closeIdx === -1) {
      if (valid) {
        seeds.push({
          category: hit.category,
          polarity: hit.polarity,
          text: trimPartialMarker(afterOpen).replace(/^\n/, ''),
          complete: false,
        })
      } else {
        chatText += trimPartialMarker(afterOpen)
      }
      break
    }

    const body = afterOpen.slice(0, closeIdx).replace(/^\n/, '').replace(/\n$/, '')
    if (valid) {
      seeds.push({
        category: hit.category,
        polarity: hit.polarity,
        text: body,
        complete: true,
      })
    } else {
      chatText += body
    }
    rest = afterOpen.slice(closeIdx + SEED_CLOSE.length)
  }

  return { chatText: chatText.trim(), proposals, seeds }
}
