/**
 * Format transcribed speech into readable paragraphs without VIVA/LLM.
 * Uses Whisper word timestamps (pauses) when available; otherwise sentence grouping.
 */

export interface TranscriptionWord {
  word: string
  start: number
  end: number
}

/** Long pause between words → new paragraph (natural breath / topic shift). */
const PAUSE_PARAGRAPH_SEC = 1.6
/** Shorter pause after a sentence end → paragraph break. */
const SHORT_PAUSE_SEC = 0.9
/** Max sentences per paragraph when grouping by punctuation only. */
const MAX_SENTENCES_PER_PARAGRAPH = 3

/** Whisper usually prefixes tokens with a space; some responses omit it. */
function joinWordTokens(tokens: string[]): string {
  if (tokens.length === 0) return ''

  const sample = tokens.slice(0, Math.min(24, tokens.length))
  const usesLeadingSpace = sample.some((t) => /^\s/.test(t))

  if (usesLeadingSpace) {
    return tokens.join('').replace(/\s+/g, ' ').trim()
  }

  return tokens
    .map((t) => t.trim())
    .filter(Boolean)
    .join(' ')
}

/** Word-join dropped spaces but raw Whisper text still has them. */
export function transcriptLostSpaces(formatted: string, raw: string): boolean {
  const f = formatted.replace(/\s+/g, '').toLowerCase()
  const r = raw.replace(/\s+/g, '').toLowerCase()
  if (!f || f !== r) return false
  return /\s/.test(raw) && !/\s/.test(formatted)
}

/** Long glue with no spaces (bad word-join or copy/paste). */
export function transcriptLooksCollapsed(text: string): boolean {
  const trimmed = text.trim()
  if (trimmed.length < 80) return false
  if (/\s/.test(trimmed)) return false
  return true
}

function endsSentence(token: string): boolean {
  return /[.!?]["']?$/.test(token.trim())
}

function splitIntoSentences(text: string): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return []

  const matches = normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g)
  if (!matches) return [normalized]
  return matches.map((s) => s.trim()).filter(Boolean)
}

/**
 * Build paragraphs from Whisper word timestamps using pause gaps.
 */
export function formatTranscriptFromWords(words: TranscriptionWord[]): string {
  if (!words.length) return ''

  const paragraphs: string[] = []
  let buffer: string[] = []
  let sentenceCount = 0

  for (let i = 0; i < words.length; i++) {
    const current = words[i]
    const token = current.word ?? ''
    buffer.push(token)

    if (endsSentence(token)) {
      sentenceCount += 1
    }

    const next = words[i + 1]
    const gap = next ? next.start - current.end : 0
    const isLast = i === words.length - 1
    const sentenceEnd = endsSentence(token)

    const longPause = gap >= PAUSE_PARAGRAPH_SEC
    const shortPauseAfterSentence =
      gap >= SHORT_PAUSE_SEC && sentenceEnd && sentenceCount >= 1
    const maxSentencesReached = sentenceEnd && sentenceCount >= MAX_SENTENCES_PER_PARAGRAPH

    if (isLast || longPause || shortPauseAfterSentence || maxSentencesReached) {
      const paragraph = joinWordTokens(buffer)
      if (paragraph) paragraphs.push(paragraph)
      buffer = []
      sentenceCount = 0
    }
  }

  return paragraphs.join('\n\n')
}

/**
 * Format plain transcript text (no timestamps) into paragraphs.
 */
export function formatTranscriptParagraphs(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return ''

  // Cannot split sentences without spaces — caller should pass Whisper raw text
  if (transcriptLooksCollapsed(trimmed)) {
    return trimmed
  }

  if (/\n\s*\n/.test(trimmed)) {
    return trimmed
      .split(/\n\s*\n+/)
      .map((p) => p.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join('\n\n')
  }

  const sentences = splitIntoSentences(trimmed)
  if (sentences.length <= 1) return trimmed

  const paragraphs: string[] = []
  for (let i = 0; i < sentences.length; i += MAX_SENTENCES_PER_PARAGRAPH) {
    paragraphs.push(sentences.slice(i, i + MAX_SENTENCES_PER_PARAGRAPH).join(' '))
  }
  return paragraphs.join('\n\n')
}

/**
 * Prefer pause-aware formatting from words; fall back to sentence grouping.
 * Never returns empty when Whisper provided non-empty text (avoids wiping journal content).
 */
export function formatTranscript(
  text: string,
  words?: TranscriptionWord[] | null
): string {
  const raw = text.trim()
  if (!raw) return ''

  if (words?.length) {
    const fromWords = formatTranscriptFromWords(words)
    if (fromWords.trim() && !transcriptLostSpaces(fromWords, raw)) {
      return fromWords
    }
  }

  const fromText = formatTranscriptParagraphs(raw)
  if (fromText.trim() && !transcriptLostSpaces(fromText, raw)) {
    return fromText
  }
  return raw
}

/** True when text is one block with no blank-line paragraph breaks. */
export function transcriptLooksLikeWallOfText(text: string): boolean {
  const trimmed = text.trim()
  if (trimmed.length < 120) return false
  return !/\n\s*\n/.test(trimmed)
}
