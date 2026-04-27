/**
 * Lyrics alignment utility.
 *
 * Given user-provided lyrics (with line breaks) and Whisper word-level
 * timestamps, produces a timed lyrics structure suitable for synced display.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface WhisperWord {
  word: string
  start: number
  end: number
}

export interface TimedWord {
  word: string
  startTime: number
  endTime: number
}

export interface TimedLine {
  text: string
  startTime: number
  endTime: number
  words: TimedWord[]
}

export interface SyncedLyrics {
  lines: TimedLine[]
}

// ── Helpers ────────────────────────────────────────────────────────────────

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[^\w\s']/g, '')
    .trim()
}

/**
 * Levenshtein distance between two short strings.
 * Used to fuzzy-match lyrics words against Whisper output.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i]![0] = i
  for (let j = 0; j <= n; j++) dp[0]![j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + cost,
      )
    }
  }
  return dp[m]![n]!
}

function isFuzzyMatch(a: string, b: string, maxDist = 2): boolean {
  if (a === b) return true
  if (Math.abs(a.length - b.length) > maxDist) return false
  return levenshtein(a, b) <= maxDist
}

// ── Core alignment ─────────────────────────────────────────────────────────

/**
 * Greedy forward alignment: walk through lyric words and Whisper words in
 * parallel. For each lyric word, search a window of upcoming Whisper words
 * for the best fuzzy match, then consume up to that point.
 *
 * Words that can't be matched get interpolated timestamps from their neighbours.
 */
function alignWords(
  lyricWords: string[],
  whisperWords: WhisperWord[],
): TimedWord[] {
  const result: TimedWord[] = []
  let wIdx = 0
  const WINDOW = 8

  for (const rawWord of lyricWords) {
    const normalizedLyric = normalize(rawWord)
    if (!normalizedLyric) continue

    let bestIdx = -1
    let bestDist = Infinity

    const searchEnd = Math.min(wIdx + WINDOW, whisperWords.length)
    for (let j = wIdx; j < searchEnd; j++) {
      const normalizedWhisper = normalize(whisperWords[j]!.word)
      const dist = levenshtein(normalizedLyric, normalizedWhisper)
      if (dist < bestDist) {
        bestDist = dist
        bestIdx = j
      }
      if (dist === 0) break
    }

    const maxAllowedDist = Math.max(2, Math.floor(normalizedLyric.length * 0.4))

    if (bestIdx >= 0 && bestDist <= maxAllowedDist) {
      const matched = whisperWords[bestIdx]!
      result.push({
        word: rawWord,
        startTime: matched.start,
        endTime: matched.end,
      })
      wIdx = bestIdx + 1
    } else {
      result.push({
        word: rawWord,
        startTime: -1,
        endTime: -1,
      })
    }
  }

  return result
}

/**
 * Fill in any unmatched words (-1 timestamps) by interpolating between
 * their nearest matched neighbours.
 */
function interpolateGaps(words: TimedWord[]): TimedWord[] {
  if (words.length === 0) return words

  const result = [...words.map(w => ({ ...w }))]

  let i = 0
  while (i < result.length) {
    if (result[i]!.startTime >= 0) {
      i++
      continue
    }

    const gapStart = i
    while (i < result.length && result[i]!.startTime < 0) i++
    const gapEnd = i

    const prevTime = gapStart > 0 ? result[gapStart - 1]!.endTime : 0
    const nextTime =
      gapEnd < result.length
        ? result[gapEnd]!.startTime
        : prevTime + (gapEnd - gapStart) * 0.4

    const gapCount = gapEnd - gapStart
    const step = (nextTime - prevTime) / (gapCount + 1)

    for (let g = 0; g < gapCount; g++) {
      const idx = gapStart + g
      result[idx]!.startTime = prevTime + step * (g + 1)
      result[idx]!.endTime = prevTime + step * (g + 2)
    }
  }

  return result
}

// ── Timestamp parsing ──────────────────────────────────────────────────────

/**
 * Parse "M:SS" or "MM:SS" timestamp string to seconds.
 */
function parseTimestamp(ts: string): number {
  const parts = ts.trim().split(':')
  if (parts.length === 2) {
    return parseInt(parts[0]!) * 60 + parseInt(parts[1]!)
  }
  if (parts.length === 3) {
    return parseInt(parts[0]!) * 3600 + parseInt(parts[1]!) * 60 + parseInt(parts[2]!)
  }
  return 0
}

/**
 * Parse lyrics that already have timestamps (e.g. from Mureka, LRC files).
 * Accepts formats like:
 *   "Everything I asked for's at my door  0:03"
 *   "[00:03] Everything I asked for's at my door"
 *   "0:03 Everything I asked for's at my door"
 *
 * Lines without timestamps or section headers like "[Verse 1]" are skipped.
 */
export function parseTimestampedLyrics(input: string): SyncedLyrics {
  const rawLines = input.split(/\r?\n/)
  const parsed: { text: string; startTime: number }[] = []

  for (const raw of rawLines) {
    const line = raw.trim()
    if (!line) continue

    // Skip section labels like "[Intro]", "Verse 1", "Pre-Chorus", "Chorus", "Bridge", "Final Chorus"
    if (/^\[?(?:intro|verse|pre-chorus|chorus|bridge|outro|final chorus|hook)\]?\s*\d*$/i.test(line)) continue
    if (/^(?:intro|verse|pre-chorus|chorus|bridge|outro|final chorus|hook)\s*\d*$/i.test(line)) continue

    let text: string | null = null
    let time: number | null = null

    // Format: "lyrics text  M:SS" (timestamp at end, separated by 2+ spaces or tab)
    const endMatch = line.match(/^(.+?)\s{2,}(\d{1,2}:\d{2})\s*$/)
    if (endMatch) {
      text = endMatch[1]!.trim()
      time = parseTimestamp(endMatch[2]!)
    }

    // Format: "[MM:SS] lyrics text" or "[M:SS] lyrics text"
    if (!text) {
      const bracketMatch = line.match(/^\[(\d{1,2}:\d{2})\]\s*(.+)$/)
      if (bracketMatch) {
        time = parseTimestamp(bracketMatch[1]!)
        text = bracketMatch[2]!.trim()
      }
    }

    // Format: "M:SS lyrics text" (timestamp at start)
    if (!text) {
      const startMatch = line.match(/^(\d{1,2}:\d{2})\s+(.+)$/)
      if (startMatch) {
        time = parseTimestamp(startMatch[1]!)
        text = startMatch[2]!.trim()
      }
    }

    if (text && time !== null) {
      // Skip lines that are just section headers even if they matched a timestamp
      if (/^(?:intro|verse|pre-chorus|chorus|bridge|outro|final chorus|hook)\s*\d*$/i.test(text)) continue
      parsed.push({ text, startTime: time })
    }
  }

  // Build timed lines -- endTime is derived from the next line's startTime
  const lines: TimedLine[] = parsed.map((item, i) => {
    const endTime = i < parsed.length - 1
      ? parsed[i + 1]!.startTime
      : item.startTime + 4

    const words = item.text.split(/\s+/).map((word, wIdx, arr) => {
      const wordDuration = (endTime - item.startTime) / arr.length
      return {
        word,
        startTime: item.startTime + wIdx * wordDuration,
        endTime: item.startTime + (wIdx + 1) * wordDuration,
      }
    })

    return {
      text: item.text,
      startTime: item.startTime,
      endTime,
      words,
    }
  })

  return { lines }
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Build synced lyrics directly from Whisper word timestamps (no reference
 * lyrics needed). Groups words into lines using timing gaps between words --
 * a gap longer than the threshold starts a new line.
 */
export function transcribeToLyrics(
  whisperWords: WhisperWord[],
  options?: { gapThreshold?: number; maxWordsPerLine?: number },
): SyncedLyrics {
  if (whisperWords.length === 0) return { lines: [] }

  const gapThreshold = options?.gapThreshold ?? 0.7
  const maxWords = options?.maxWordsPerLine ?? 10

  const lines: TimedLine[] = []
  let currentWords: TimedWord[] = []

  function flushLine() {
    if (currentWords.length === 0) return
    lines.push({
      text: currentWords.map(w => w.word).join(' '),
      startTime: currentWords[0]!.startTime,
      endTime: currentWords[currentWords.length - 1]!.endTime,
      words: currentWords,
    })
    currentWords = []
  }

  for (let i = 0; i < whisperWords.length; i++) {
    const w = whisperWords[i]!
    const timedWord: TimedWord = { word: w.word, startTime: w.start, endTime: w.end }

    if (currentWords.length > 0) {
      const prevEnd = currentWords[currentWords.length - 1]!.endTime
      const gap = w.start - prevEnd
      if (gap >= gapThreshold || currentWords.length >= maxWords) {
        flushLine()
      }
    }

    currentWords.push(timedWord)
  }

  flushLine()
  return { lines }
}

/**
 * Align user-provided lyrics against Whisper word timestamps and return
 * a structured `SyncedLyrics` object ready for storage.
 */
export function alignLyrics(
  plainLyrics: string,
  whisperWords: WhisperWord[],
): SyncedLyrics {
  const rawLines = plainLyrics.split(/\r?\n/)

  const allLyricWords: { word: string; lineIdx: number }[] = []
  rawLines.forEach((line, lineIdx) => {
    const words = line.split(/\s+/).filter(Boolean)
    words.forEach(word => allLyricWords.push({ word, lineIdx }))
  })

  const justWords = allLyricWords.map(w => w.word)
  const aligned = alignWords(justWords, whisperWords)
  const interpolated = interpolateGaps(aligned)

  const lineMap = new Map<number, { text: string; words: TimedWord[] }>()
  interpolated.forEach((tw, i) => {
    const lineIdx = allLyricWords[i]!.lineIdx
    if (!lineMap.has(lineIdx)) {
      lineMap.set(lineIdx, { text: rawLines[lineIdx]!.trim(), words: [] })
    }
    lineMap.get(lineIdx)!.words.push(tw)
  })

  const lines: TimedLine[] = []
  for (const [, lineData] of lineMap) {
    if (!lineData.text || lineData.words.length === 0) continue
    const starts = lineData.words.map(w => w.startTime).filter(t => t >= 0)
    const ends = lineData.words.map(w => w.endTime).filter(t => t >= 0)
    lines.push({
      text: lineData.text,
      startTime: starts.length > 0 ? Math.min(...starts) : 0,
      endTime: ends.length > 0 ? Math.max(...ends) : 0,
      words: lineData.words,
    })
  }

  return { lines }
}
