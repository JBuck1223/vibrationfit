/**
 * Parser for the VIVA vision-update stream.
 *
 * Assistant replies interleave conversation with category proposals framed as:
 *
 *   <<<VISION fun>>>
 *   (full replacement text for the category)
 *   <<<END VISION>>>
 *
 * The parser splits a (possibly partial, still-streaming) assistant message
 * into chat text and per-category proposals, hiding partially-streamed markers
 * so nothing flickers in the chat bubble.
 */

import { isValidVisionCategory } from '@/lib/design-system/vision-categories'

const OPEN_RE = /<<<VISION\s+([a-z_]+)\s*>>>/
const CLOSE_MARKER = '<<<END VISION>>>'

export interface VisionUpdateProposal {
  category: string
  text: string
  /** False while the proposal is still streaming (no closing marker yet). */
  complete: boolean
}

export interface ParsedVisionUpdateMessage {
  /** Conversation text with proposal blocks removed. */
  chatText: string
  proposals: VisionUpdateProposal[]
}

/** Trim a trailing partial marker ("<<<VIS", "<<<END VI") so it never renders. */
function trimPartialMarker(text: string): string {
  for (let len = Math.min(text.length, 40); len > 0; len--) {
    const tail = text.slice(-len)
    if ('<<<VISION '.startsWith(tail) || CLOSE_MARKER.startsWith(tail) || /^<<<VISION\s+[a-z_]*>?>?$/.test(tail)) {
      return text.slice(0, -len)
    }
  }
  return text
}

export function parseVisionUpdateMessage(raw: string): ParsedVisionUpdateMessage {
  const proposals: VisionUpdateProposal[] = []
  let chatText = ''
  let rest = raw

  while (rest.length > 0) {
    const match = OPEN_RE.exec(rest)
    if (!match || match.index === undefined) {
      chatText += trimPartialMarker(rest)
      break
    }

    chatText += rest.slice(0, match.index)
    const category = match[1]
    const afterOpen = rest.slice(match.index + match[0].length)
    const closeIdx = afterOpen.indexOf(CLOSE_MARKER)

    const valid = isValidVisionCategory(category)

    if (closeIdx === -1) {
      // Still streaming this proposal
      if (valid) {
        proposals.push({ category, text: trimPartialMarker(afterOpen).replace(/^\n/, ''), complete: false })
      } else {
        chatText += trimPartialMarker(afterOpen)
      }
      break
    }

    const body = afterOpen.slice(0, closeIdx).replace(/^\n/, '').replace(/\n$/, '')
    if (valid) {
      proposals.push({ category, text: body, complete: true })
    } else {
      chatText += body
    }
    rest = afterOpen.slice(closeIdx + CLOSE_MARKER.length)
  }

  return { chatText: chatText.trim(), proposals }
}
