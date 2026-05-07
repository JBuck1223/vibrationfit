/**
 * Core session transcription logic.
 *
 * Uses fal.ai Whisper with speaker diarization + GPT-4o for key point
 * extraction. Designed to be called both from admin endpoints and
 * automated cron jobs.
 */

import { createServiceClient } from '@/lib/supabase/service'
import { fal } from '@fal-ai/client'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface WhisperChunk {
  text: string
  timestamp: [number, number]
  speaker?: string
}

interface WhisperResult {
  text: string
  chunks: WhisperChunk[]
}

export interface TranscriptKeyPoint {
  text: string
  timestamp_seconds: number
}

export interface TranscriptKeyPoints {
  summary: string
  key_points: TranscriptKeyPoint[]
  themes: string[]
}

export interface TranscribeResult {
  success: boolean
  transcript_text?: string
  segments_count?: number
  word_count?: number
  key_points?: TranscriptKeyPoints | null
  error?: string
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * Build a timestamped transcript excerpt for GPT-4o, truncated to a character
 * limit. Each segment is prefixed with [MM:SS] so GPT can reference timestamps.
 */
function buildTimestampedExcerpt(chunks: WhisperChunk[], maxChars: number): string {
  if (!chunks || chunks.length === 0) return ''

  const lines: string[] = []
  let totalChars = 0

  for (const chunk of chunks) {
    const ts = formatTimestamp(chunk.timestamp[0])
    const speaker = chunk.speaker ? `${chunk.speaker}: ` : ''
    const line = `[${ts}] ${speaker}${chunk.text.trim()}`

    if (totalChars + line.length > maxChars) break
    lines.push(line)
    totalChars += line.length + 1
  }

  return lines.join('\n')
}

function buildFormattedTranscript(chunks: WhisperChunk[]): string {
  if (!chunks || chunks.length === 0) return ''

  const lines: string[] = []
  let currentSpeaker: string | null = null

  for (const chunk of chunks) {
    const speaker = chunk.speaker || 'Unknown'
    const ts = formatTimestamp(chunk.timestamp[0])

    if (speaker !== currentSpeaker) {
      currentSpeaker = speaker
      lines.push(`\n[${ts}] ${speaker}:`)
    }

    lines.push(chunk.text.trim())
  }

  return lines.join('\n').trim()
}

/**
 * Check whether existing key points need to be regenerated.
 * Returns true for old formats (no timestamps) or missing version marker.
 */
export function keyPointsNeedRegeneration(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return true
  const data = raw as Record<string, unknown>
  if (!Array.isArray(data.key_points) || data.key_points.length === 0) return true
  // Old format: key_points is string[] instead of object[]
  if (typeof data.key_points[0] === 'string') return true
  // Old format: objects but missing timestamp_seconds
  const first = data.key_points[0] as Record<string, unknown>
  if (!('timestamp_seconds' in first)) return true
  // Regenerate if generated before current prompt version
  const version = typeof data._version === 'number' ? data._version : 0
  if (version < 7) return true
  return false
}

/**
 * Re-generate just the key points for a session that already has a transcript.
 * Uses existing transcript_segments (Whisper chunks) to build timestamped input
 * for GPT-4o. Much faster than full re-transcription since it skips Whisper.
 */
export async function regenerateKeyPoints(sessionId: string): Promise<TranscribeResult> {
  const supabase = createServiceClient()

  const { data: session, error: fetchError } = await supabase
    .from('video_sessions')
    .select('id, title, transcript_text, transcript_segments, session_type')
    .eq('id', sessionId)
    .single()

  if (fetchError || !session) {
    return { success: false, error: 'Session not found' }
  }

  if (!session.transcript_text) {
    return { success: false, error: 'No transcript available' }
  }

  const chunks = (session.transcript_segments || []) as WhisperChunk[]

  const sessionLabel = session.session_type === 'alignment_gym'
    ? 'Alignment Gym'
    : session.title

  // Use timestamped chunks if available, otherwise fall back to plain text
  const inputText = chunks.length > 0
    ? buildTimestampedExcerpt(chunks, 12000)
    : session.transcript_text.substring(0, 12000)

  let keyPoints: TranscriptKeyPoints | null = null

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: `You're writing a quick recap for a VibrationFit "${sessionLabel}" session replay.

Return JSON matching this shape. You MUST include between 5 and 10 key_points — never fewer than 5:
{
  "summary": "<2-3 short sentences — just say what we talked about, plainly>",
  "key_points": [
    { "text": "<moment 1>", "timestamp_seconds": 60 },
    { "text": "<moment 2>", "timestamp_seconds": 180 },
    { "text": "<moment 3>", "timestamp_seconds": 300 },
    { "text": "<moment 4>", "timestamp_seconds": 480 },
    { "text": "<moment 5>", "timestamp_seconds": 600 },
    { "text": "<moment 6>", "timestamp_seconds": 900 },
    { "text": "<moment 7>", "timestamp_seconds": 1200 }
  ],
  "themes": ["theme1", "theme2", "theme3"]
}

Voice:
- Be direct and specific. Just say what happened — no hype, no flowery language.
- DON'T use words like "celebrated", "embraced", "the beauty of", "the power of", "the magic of", "lively", "heartfelt". Just be normal.
- Write like a chill person summarizing a call for someone who missed it. Casual but not sloppy.
- Use "we" — it's a group session.

Rules:
- ONLY include points about the core teaching, lesson, or main topic of the session. These are guided personal growth sessions with a specific theme — focus on that.
- IGNORE casual chit-chat, small talk, off-topic conversations between members (stocks, sports, weekend plans, etc.) — that's just people connecting, not the session content.
- No points about the mood, vibe, energy, or social dynamics of the group.
- NEVER mention technical difficulties, audio/video issues, or connection problems.
- Skip generic openers — start with the first real teaching moment.
- You MUST return at least 5 key_points, ideally 7-10. Spread them across the session's actual teaching content.
- Keep each key point to one short sentence.
- Timestamps are in seconds, referencing the [MM:SS] markers in the transcript. If no timestamps are visible, estimate based on position (assume ~150 words/min).
- Themes: 3-5 short labels about the session's core topic only.`,
        },
        {
          role: 'user',
          content: `Session: ${session.title}\n\nTranscript:\n${inputText}`,
        },
      ],
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content
    if (raw) {
      keyPoints = JSON.parse(raw)
    }
  } catch (err) {
    console.error('[regenerate-key-points] GPT-4o failed:', err)
    return { success: false, error: `Key points extraction failed: ${err instanceof Error ? err.message : String(err)}` }
  }

  if (!keyPoints) {
    return { success: false, error: 'GPT-4o returned no key points' }
  }

  const { error: updateError } = await supabase
    .from('video_sessions')
    .update({ transcript_key_points: { ...keyPoints, _version: 7 } })
    .eq('id', sessionId)

  if (updateError) {
    console.error('[regenerate-key-points] DB update failed:', updateError)
    return { success: false, error: 'Key points generated but database save failed', key_points: keyPoints }
  }

  console.log(`[regenerate-key-points] Complete for session ${sessionId}`)

  return {
    success: true,
    key_points: keyPoints,
  }
}

/**
 * Transcribe a session recording and save results to the database.
 *
 * Skips sessions that already have a transcript or lack a recording URL.
 * Safe to call multiple times — idempotent by design.
 *
 * Pass `force: true` to re-transcribe even if a transcript already exists.
 */
export async function transcribeSession(
  sessionId: string,
  opts?: { force?: boolean }
): Promise<TranscribeResult> {
  const supabase = createServiceClient()

  const { data: session, error: fetchError } = await supabase
    .from('video_sessions')
    .select('id, title, recording_url, transcript_text, session_type')
    .eq('id', sessionId)
    .single()

  if (fetchError || !session) {
    return { success: false, error: 'Session not found' }
  }

  if (!session.recording_url) {
    return { success: false, error: 'No recording URL available' }
  }

  if (session.transcript_text && !opts?.force) {
    return { success: true, transcript_text: session.transcript_text }
  }

  // Step 1: Transcribe with fal.ai Whisper + diarization
  console.log(`[transcribe-session] Starting fal.ai Whisper for session ${sessionId}`)

  fal.config({ credentials: process.env.FAL_KEY })

  let whisperResult: WhisperResult
  try {
    const result = await fal.subscribe('fal-ai/whisper', {
      input: {
        audio_url: session.recording_url,
        task: 'transcribe',
        language: 'en',
        diarize: true,
        chunk_level: 'segment',
        batch_size: 64,
      },
    })
    whisperResult = result.data as unknown as WhisperResult
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[transcribe-session] fal.ai Whisper failed:', msg)
    return { success: false, error: `Transcription failed: ${msg}` }
  }

  if (!whisperResult.text) {
    return { success: false, error: 'Whisper returned empty transcript' }
  }

  const formattedTranscript = buildFormattedTranscript(whisperResult.chunks)
  const plainText = formattedTranscript || whisperResult.text

  console.log(`[transcribe-session] Whisper complete: ${whisperResult.text.split(' ').length} words, ${whisperResult.chunks?.length || 0} segments`)

  // Step 2: Extract key points with timestamps via GPT-4o
  let keyPoints: TranscriptKeyPoints | null = null

  try {
    const sessionLabel = session.session_type === 'alignment_gym'
      ? 'Alignment Gym'
      : session.title

    // Build a timestamped transcript excerpt for GPT so it can reference times
    const timestampedExcerpt = buildTimestampedExcerpt(whisperResult.chunks, 12000)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: `You're writing a quick recap for a VibrationFit "${sessionLabel}" session replay.

Return JSON matching this shape. You MUST include between 5 and 10 key_points — never fewer than 5:
{
  "summary": "<2-3 short sentences — just say what we talked about, plainly>",
  "key_points": [
    { "text": "<moment 1>", "timestamp_seconds": 60 },
    { "text": "<moment 2>", "timestamp_seconds": 180 },
    { "text": "<moment 3>", "timestamp_seconds": 300 },
    { "text": "<moment 4>", "timestamp_seconds": 480 },
    { "text": "<moment 5>", "timestamp_seconds": 600 },
    { "text": "<moment 6>", "timestamp_seconds": 900 },
    { "text": "<moment 7>", "timestamp_seconds": 1200 }
  ],
  "themes": ["theme1", "theme2", "theme3"]
}

Voice:
- Be direct and specific. Just say what happened — no hype, no flowery language.
- DON'T use words like "celebrated", "embraced", "the beauty of", "the power of", "the magic of", "lively", "heartfelt". Just be normal.
- Write like a chill person summarizing a call for someone who missed it. Casual but not sloppy.
- Use "we" — it's a group session.

Rules:
- ONLY include points about the core teaching, lesson, or main topic of the session. These are guided personal growth sessions with a specific theme — focus on that.
- IGNORE casual chit-chat, small talk, off-topic conversations between members (stocks, sports, weekend plans, etc.) — that's just people connecting, not the session content.
- No points about the mood, vibe, energy, or social dynamics of the group.
- NEVER mention technical difficulties, audio/video issues, or connection problems.
- Skip generic openers — start with the first real teaching moment.
- You MUST return at least 5 key_points, ideally 7-10. Spread them across the session's actual teaching content.
- Keep each key point to one short sentence.
- Timestamps are in seconds, referencing the [MM:SS] markers in the transcript.
- Themes: 3-5 short labels about the session's core topic only.`,
        },
        {
          role: 'user',
          content: `Session: ${session.title}\n\nTranscript:\n${timestampedExcerpt}`,
        },
      ],
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content
    if (raw) {
      keyPoints = JSON.parse(raw)
    }
  } catch (err) {
    console.error('[transcribe-session] GPT-4o key points extraction failed:', err)
  }

  // Step 3: Save to database
  const { error: updateError } = await supabase
    .from('video_sessions')
    .update({
      transcript_text: plainText,
      transcript_segments: whisperResult.chunks || [],
      transcript_key_points: keyPoints ? { ...keyPoints, _version: 7 } : null,
      transcribed_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  if (updateError) {
    console.error('[transcribe-session] DB update failed:', updateError)
    return {
      success: false,
      error: 'Transcription succeeded but database save failed',
      transcript_text: plainText,
      key_points: keyPoints,
    }
  }

  console.log(`[transcribe-session] Complete for session ${sessionId}`)

  return {
    success: true,
    transcript_text: plainText,
    segments_count: whisperResult.chunks?.length || 0,
    word_count: whisperResult.text.split(' ').length,
    key_points: keyPoints,
  }
}
