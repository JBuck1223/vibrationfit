/**
 * Session Transcription API
 *
 * POST /api/admin/recordings/transcribe
 *
 * Transcribes a session recording using fal.ai Whisper with speaker
 * diarization, then extracts key points/summary via GPT-4.
 *
 * Stores results in video_sessions transcript columns.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { createServiceClient } from '@/lib/supabase/service'
import { fal } from '@fal-ai/client'
import OpenAI from 'openai'

export const runtime = 'nodejs'
export const maxDuration = 300

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

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
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

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { session_id } = await request.json()

    if (!session_id) {
      return NextResponse.json({ error: 'session_id is required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: session, error: fetchError } = await supabase
      .from('video_sessions')
      .select('id, title, recording_url, transcript_text, session_type')
      .eq('id', session_id)
      .single()

    if (fetchError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (!session.recording_url) {
      return NextResponse.json(
        { error: 'No recording URL — import or sync the recording first' },
        { status: 422 }
      )
    }

    if (session.transcript_text) {
      return NextResponse.json(
        { error: 'Session already has a transcript. Delete it first to re-transcribe.' },
        { status: 409 }
      )
    }

    // Step 1: Transcribe with fal.ai Whisper + diarization
    console.log(`[transcribe] Starting fal.ai Whisper for session ${session_id}`)

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
      console.error('[transcribe] fal.ai Whisper failed:', err)
      return NextResponse.json(
        { error: `Transcription failed: ${err instanceof Error ? err.message : String(err)}` },
        { status: 500 }
      )
    }

    if (!whisperResult.text) {
      return NextResponse.json(
        { error: 'Whisper returned empty transcript' },
        { status: 500 }
      )
    }

    const formattedTranscript = buildFormattedTranscript(whisperResult.chunks)
    const plainText = formattedTranscript || whisperResult.text

    console.log(`[transcribe] Whisper complete: ${whisperResult.text.split(' ').length} words, ${whisperResult.chunks?.length || 0} segments`)

    // Step 2: Extract key points with GPT-4
    let keyPoints: { summary: string; key_points: string[]; themes: string[] } | null = null

    try {
      const sessionLabel = session.session_type === 'alignment_gym'
        ? 'Alignment Gym'
        : session.title

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content: `You extract key points from a VibrationFit "${sessionLabel}" session transcript. VibrationFit is a personal growth platform. Return JSON with: { "summary": "2-3 sentence overview", "key_points": ["point 1", "point 2", ...], "themes": ["theme1", "theme2", ...] }. Keep key_points to 5-10 bullet points. Themes should be 3-5 short labels. Be concise and actionable.`,
          },
          {
            role: 'user',
            content: `Session: ${session.title}\n\nTranscript:\n${whisperResult.text.substring(0, 12000)}`,
          },
        ],
        response_format: { type: 'json_object' },
      })

      const raw = completion.choices[0]?.message?.content
      if (raw) {
        keyPoints = JSON.parse(raw)
      }
    } catch (err) {
      console.error('[transcribe] GPT-4 key points extraction failed:', err)
      // Non-fatal — we still have the transcript
    }

    // Step 3: Save to database
    const { error: updateError } = await supabase
      .from('video_sessions')
      .update({
        transcript_text: plainText,
        transcript_segments: whisperResult.chunks || [],
        transcript_key_points: keyPoints,
        transcribed_at: new Date().toISOString(),
      })
      .eq('id', session_id)

    if (updateError) {
      console.error('[transcribe] DB update failed:', updateError)
      return NextResponse.json(
        {
          error: 'Transcription succeeded but database save failed',
          transcript_text: plainText,
          key_points: keyPoints,
        },
        { status: 500 }
      )
    }

    console.log(`[transcribe] Complete for session ${session_id}`)

    return NextResponse.json({
      success: true,
      transcript_text: plainText,
      segments_count: whisperResult.chunks?.length || 0,
      word_count: whisperResult.text.split(' ').length,
      key_points: keyPoints,
    })
  } catch (error) {
    console.error('[transcribe] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Transcription failed unexpectedly' },
      { status: 500 }
    )
  }
}
