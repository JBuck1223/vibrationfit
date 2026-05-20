#!/usr/bin/env node

/**
 * Batch-generate synced_lyrics for all music_catalog tracks that have
 * plain_lyrics but no synced_lyrics yet.
 *
 * Usage:
 *   node scripts/music/sync-all-lyrics.mjs
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY
 * in .env.local (loaded via dotenv).
 */

import dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../../.env.local') })
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { execFileSync } from 'child_process'
import { writeFileSync, readFileSync, unlinkSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomUUID } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const WHISPER_MAX_BYTES = 25 * 1024 * 1024

function normalize(text) {
  return text.toLowerCase().replace(/['']/g, "'").replace(/[""]/g, '"').replace(/[^\w\s']/g, '').trim()
}

function levenshtein(a, b) {
  const m = a.length, n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  return dp[m][n]
}

function alignWords(lyricWords, whisperWords) {
  const result = []
  let wIdx = 0
  const WINDOW = 25
  for (const rawWord of lyricWords) {
    const nLyric = normalize(rawWord)
    if (!nLyric) continue
    let bestIdx = -1, bestDist = Infinity
    const end = Math.min(wIdx + WINDOW, whisperWords.length)
    for (let j = wIdx; j < end; j++) {
      const d = levenshtein(nLyric, normalize(whisperWords[j].word))
      if (d < bestDist) { bestDist = d; bestIdx = j }
      if (d === 0) break
    }
    const maxDist = Math.max(2, Math.floor(nLyric.length * 0.4))
    if (bestIdx >= 0 && bestDist <= maxDist) {
      result.push({ word: rawWord, startTime: whisperWords[bestIdx].start, endTime: whisperWords[bestIdx].end })
      wIdx = bestIdx + 1
    } else {
      result.push({ word: rawWord, startTime: -1, endTime: -1 })
    }
  }
  return result
}

function interpolateGaps(words) {
  const result = words.map(w => ({ ...w }))
  let i = 0
  while (i < result.length) {
    if (result[i].startTime >= 0) { i++; continue }
    const gapStart = i
    while (i < result.length && result[i].startTime < 0) i++
    const gapEnd = i
    const prevTime = gapStart > 0 ? result[gapStart - 1].endTime : 0
    const nextTime = gapEnd < result.length ? result[gapEnd].startTime : prevTime + (gapEnd - gapStart) * 0.4
    const count = gapEnd - gapStart
    const step = (nextTime - prevTime) / (count + 1)
    for (let g = 0; g < count; g++) {
      result[gapStart + g].startTime = prevTime + step * (g + 1)
      result[gapStart + g].endTime = prevTime + step * (g + 2)
    }
  }
  return result
}

function alignLyrics(plainLyrics, whisperWords) {
  const rawLines = plainLyrics.split(/\r?\n/)
  const allLyricWords = []
  rawLines.forEach((line, lineIdx) => {
    line.split(/\s+/).filter(Boolean).forEach(word => allLyricWords.push({ word, lineIdx }))
  })
  const aligned = alignWords(allLyricWords.map(w => w.word), whisperWords)
  const interpolated = interpolateGaps(aligned)
  const lineMap = new Map()
  interpolated.forEach((tw, i) => {
    const lineIdx = allLyricWords[i].lineIdx
    if (!lineMap.has(lineIdx)) lineMap.set(lineIdx, { text: rawLines[lineIdx].trim(), words: [] })
    lineMap.get(lineIdx).words.push(tw)
  })
  const lines = []
  for (const [, ld] of lineMap) {
    if (!ld.text || ld.words.length === 0) continue
    const starts = ld.words.map(w => w.startTime).filter(t => t >= 0)
    const ends = ld.words.map(w => w.endTime).filter(t => t >= 0)
    lines.push({
      text: ld.text,
      startTime: starts.length > 0 ? Math.min(...starts) : 0,
      endTime: ends.length > 0 ? Math.max(...ends) : 0,
      words: ld.words,
    })
  }
  return { lines }
}

function transcribeToLyrics(whisperWords) {
  if (whisperWords.length === 0) return { lines: [] }
  const lines = []
  let currentWords = []
  function flush() {
    if (currentWords.length === 0) return
    lines.push({
      text: currentWords.map(w => w.word).join(' '),
      startTime: currentWords[0].startTime,
      endTime: currentWords[currentWords.length - 1].endTime,
      words: currentWords,
    })
    currentWords = []
  }
  for (const w of whisperWords) {
    const tw = { word: w.word, startTime: w.start, endTime: w.end }
    if (currentWords.length > 0) {
      const gap = w.start - currentWords[currentWords.length - 1].endTime
      if (gap >= 0.7 || currentWords.length >= 10) flush()
    }
    currentWords.push(tw)
  }
  flush()
  return { lines }
}

function compressAudio(inputBuffer, ext) {
  const id = randomUUID()
  const inputPath = join(tmpdir(), `lyrics-in-${id}.${ext}`)
  const outputPath = join(tmpdir(), `lyrics-out-${id}.mp3`)
  writeFileSync(inputPath, inputBuffer)
  try {
    execFileSync('ffmpeg', ['-i', inputPath, '-ac', '1', '-ar', '44100', '-b:a', '192k', '-y', outputPath], { stdio: 'pipe' })
    const output = readFileSync(outputPath)
    try { unlinkSync(inputPath) } catch {}
    try { unlinkSync(outputPath) } catch {}
    return output
  } catch (err) {
    try { unlinkSync(inputPath) } catch {}
    try { unlinkSync(outputPath) } catch {}
    throw new Error(`ffmpeg failed: ${err.message}`)
  }
}

async function processTrack(track) {
  console.log(`\n  Downloading audio for "${track.title}"...`)
  const resp = await fetch(track.preview_url)
  if (!resp.ok) throw new Error(`Download failed: ${resp.status}`)

  let audioBuffer = Buffer.from(await resp.arrayBuffer())
  const ct = resp.headers.get('content-type') || 'audio/mpeg'
  const ext = ct.includes('mp4') ? 'mp4' : ct.includes('wav') ? 'wav' : 'mp3'

  if (audioBuffer.byteLength > WHISPER_MAX_BYTES) {
    console.log(`  Compressing (${(audioBuffer.byteLength / 1024 / 1024).toFixed(1)}MB > 25MB)...`)
    audioBuffer = compressAudio(audioBuffer, ext)
    console.log(`  Compressed to ${(audioBuffer.byteLength / 1024 / 1024).toFixed(1)}MB`)
  }

  const audioFile = new File([audioBuffer], 'track.mp3', { type: 'audio/mpeg' })

  console.log(`  Transcribing with Whisper (${(audioBuffer.byteLength / 1024 / 1024).toFixed(1)}MB)...`)
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    language: 'en',
    response_format: 'verbose_json',
    timestamp_granularities: ['word'],
  })

  const whisperWords = (transcription.words || []).map(w => ({ word: w.word, start: w.start, end: w.end }))

  let syncedLyrics
  if (track.plain_lyrics?.trim()) {
    console.log(`  Aligning ${whisperWords.length} Whisper words against plain lyrics...`)
    syncedLyrics = alignLyrics(track.plain_lyrics.trim(), whisperWords)
  } else {
    console.log(`  Auto-grouping ${whisperWords.length} Whisper words into lines...`)
    syncedLyrics = transcribeToLyrics(whisperWords)
  }

  const { error } = await supabase
    .from('music_catalog')
    .update({ synced_lyrics: syncedLyrics, updated_at: new Date().toISOString() })
    .eq('id', track.id)

  if (error) throw new Error(`DB update failed: ${error.message}`)

  console.log(`  Saved ${syncedLyrics.lines.length} synced lines`)
}

async function main() {
  console.log('Fetching tracks that need synced lyrics...')

  const { data: tracks, error } = await supabase
    .from('music_catalog')
    .select('id, title, preview_url, plain_lyrics, synced_lyrics')
    .not('preview_url', 'is', null)
    .is('synced_lyrics', null)
    .order('sort_order', { ascending: true })

  if (error) { console.error('Query error:', error.message); process.exit(1) }

  console.log(`Found ${tracks.length} tracks to process.\n`)

  let success = 0, failed = 0
  for (let i = 0; i < tracks.length; i++) {
    const t = tracks[i]
    console.log(`[${i + 1}/${tracks.length}] ${t.title}`)
    try {
      await processTrack(t)
      success++
    } catch (err) {
      console.error(`  FAILED: ${err.message}`)
      failed++
    }
  }

  console.log(`\nDone! ${success} succeeded, ${failed} failed out of ${tracks.length} tracks.`)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
