/**
 * Word-level alignment for a first-pass read-aloud check.
 * Expected page words vs what Whisper heard. Not a fluency grade.
 */

const FILLERS = new Set(['um', 'uh', 'er', 'ah', 'hmm', 'mm', 'uhh'])

export type ReadAloudStatus = 'hit' | 'miss' | 'sub'

export interface PageToken {
  display: string
  norm: string
  isWord: boolean
}

export interface WordResult {
  display: string
  norm: string
  status: ReadAloudStatus
  heard?: string | null
}

export function normalizeWord(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function tokenizePage(text: string): PageToken[] {
  const parts = text.match(/\s+|[A-Za-z0-9']+|[^\sA-Za-z0-9']+/g) || []
  return parts.map((display) => {
    const norm = normalizeWord(display)
    return { display, norm, isWord: norm.length > 0 }
  })
}

export function expectedWords(text: string): PageToken[] {
  return tokenizePage(text).filter((t) => t.isWord)
}

export function heardWords(
  transcript: string,
  whisperWords?: Array<{ word?: string } | string>
): string[] {
  const raw = whisperWords?.length
    ? whisperWords.map((w) => (typeof w === 'string' ? w : w.word || ''))
    : transcript.split(/\s+/)
  return raw.map(normalizeWord).filter((w) => w.length > 0 && !FILLERS.has(w))
}

export function alignReadAloud(expected: PageToken[], heard: string[]): WordResult[] {
  let j = 0
  const results: WordResult[] = []

  for (let i = 0; i < expected.length; i++) {
    const word = expected[i]
    while (j < heard.length && FILLERS.has(heard[j])) j++
    const cur = heard[j]
    if (cur && cur === word.norm) {
      results.push({ display: word.display, norm: word.norm, status: 'hit', heard: cur })
      j++
      continue
    }

    const ahead = heard.slice(j, j + 3).findIndex((w) => w === word.norm)
    if (ahead >= 0) {
      results.push({ display: word.display, norm: word.norm, status: 'hit', heard: heard[j + ahead] })
      j += ahead + 1
      continue
    }

    const next = expected[i + 1]
    const nextMatchesCur = Boolean(cur && next && cur === next.norm)
    if (cur && !nextMatchesCur) {
      results.push({ display: word.display, norm: word.norm, status: 'sub', heard: cur })
      j++
    } else {
      results.push({ display: word.display, norm: word.norm, status: 'miss', heard: null })
    }
  }

  return results
}

export function summarizeResults(results: WordResult[]): { hit_count: number; miss_count: number } {
  let hit_count = 0
  let miss_count = 0
  for (const r of results) {
    if (r.status === 'hit') hit_count++
    else miss_count++
  }
  return { hit_count, miss_count }
}
