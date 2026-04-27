import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'
import OpenAI from 'openai'
import { spawn } from 'child_process'
import { tmpdir } from 'os'
import { join } from 'path'
import { writeFile, readFile, unlink } from 'fs/promises'
import { randomUUID } from 'crypto'
import {
  alignLyrics,
  transcribeToLyrics,
  parseTimestampedLyrics,
  type WhisperWord,
} from '@/lib/utils/lyrics-alignment'

export const maxDuration = 300

const WHISPER_MAX_BYTES = 25 * 1024 * 1024

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Compress audio to a low-bitrate mono MP3 using ffmpeg.
 * Whisper only needs speech intelligibility, not music fidelity.
 */
async function compressAudio(inputBuffer: Buffer, inputExt: string): Promise<Buffer> {
  const id = randomUUID()
  const inputPath = join(tmpdir(), `lyrics-in-${id}.${inputExt}`)
  const outputPath = join(tmpdir(), `lyrics-out-${id}.mp3`)

  await writeFile(inputPath, inputBuffer)

  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', [
      '-i', inputPath,
      '-ac', '1',
      '-ar', '16000',
      '-b:a', '64k',
      '-y',
      outputPath,
    ])

    let stderr = ''
    proc.stderr.on('data', (chunk) => { stderr += chunk.toString() })

    proc.on('close', async (code) => {
      try {
        await unlink(inputPath).catch(() => {})
        if (code !== 0) {
          await unlink(outputPath).catch(() => {})
          reject(new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-500)}`))
          return
        }
        const output = await readFile(outputPath)
        await unlink(outputPath).catch(() => {})
        resolve(output)
      } catch (e) {
        reject(e)
      }
    })

    proc.on('error', async (err) => {
      await unlink(inputPath).catch(() => {})
      reject(new Error(`ffmpeg not found. Install ffmpeg to handle large audio files. (${err.message})`))
    })
  })
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { catalogId, lyrics, mode } = await request.json()

    if (!catalogId || typeof catalogId !== 'string') {
      return NextResponse.json({ error: 'catalogId is required' }, { status: 400 })
    }

    const hasLyrics = typeof lyrics === 'string' && lyrics.trim().length > 0
    const admin = createAdminClient()

    // ── Mode: "timestamped" — lyrics already have timestamps (e.g. from Mureka) ──
    if (mode === 'timestamped' && hasLyrics) {
      const syncedLyrics = parseTimestampedLyrics(lyrics.trim())
      if (syncedLyrics.lines.length === 0) {
        return NextResponse.json(
          { error: 'Could not parse any timestamped lines. Make sure each line has a timestamp (e.g. "lyrics text  0:03").' },
          { status: 400 },
        )
      }

      const plainLyricsToStore = syncedLyrics.lines.map(l => l.text).join('\n')
      const { error: updateError } = await admin
        .from('music_catalog')
        .update({
          synced_lyrics: syncedLyrics,
          plain_lyrics: plainLyricsToStore,
          updated_at: new Date().toISOString(),
        })
        .eq('id', catalogId)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      console.log(`[sync-lyrics] Parsed ${syncedLyrics.lines.length} timestamped lines for catalogId=${catalogId}`)
      return NextResponse.json({
        success: true,
        lineCount: syncedLyrics.lines.length,
        wordCount: syncedLyrics.lines.reduce((sum, l) => sum + l.words.length, 0),
        plainLyrics: plainLyricsToStore,
        syncedLyrics,
      })
    }

    // ── Modes that require audio: "auto" or "align" ──
    const { data: track, error: fetchError } = await admin
      .from('music_catalog')
      .select('id, title, preview_url')
      .eq('id', catalogId)
      .single()

    if (fetchError || !track) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 },
      )
    }

    if (!track.preview_url) {
      return NextResponse.json(
        { error: 'Track has no preview audio URL. Upload audio first.' },
        { status: 400 },
      )
    }

    console.log(`[sync-lyrics] Downloading audio for "${track.title}"...`)
    const audioResponse = await fetch(track.preview_url)
    if (!audioResponse.ok) {
      return NextResponse.json(
        { error: `Failed to download audio: ${audioResponse.status}` },
        { status: 502 },
      )
    }

    let audioBuffer = Buffer.from(await audioResponse.arrayBuffer())
    const contentType = audioResponse.headers.get('content-type') || 'audio/mpeg'
    const extension = contentType.includes('mp4') ? 'mp4' : contentType.includes('wav') ? 'wav' : 'mp3'

    if (audioBuffer.byteLength > WHISPER_MAX_BYTES) {
      console.log(
        `[sync-lyrics] Audio is ${(audioBuffer.byteLength / 1024 / 1024).toFixed(1)}MB (over 25MB limit). Compressing...`,
      )
      audioBuffer = await compressAudio(audioBuffer, extension)
      console.log(`[sync-lyrics] Compressed to ${(audioBuffer.byteLength / 1024 / 1024).toFixed(1)}MB`)
    }

    const audioFile = new File([audioBuffer], `track.mp3`, { type: 'audio/mpeg' })

    console.log(`[sync-lyrics] Transcribing with Whisper (${(audioBuffer.byteLength / 1024 / 1024).toFixed(1)}MB)...`)
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
      response_format: 'verbose_json',
      timestamp_granularities: ['word'],
    })

    const whisperWords: WhisperWord[] = (
      (transcription as any).words || []
    ).map((w: any) => ({
      word: w.word,
      start: w.start,
      end: w.end,
    }))

    let syncedLyrics
    let plainLyricsToStore: string

    if (hasLyrics) {
      console.log(
        `[sync-lyrics] Whisper returned ${whisperWords.length} words. Aligning against ${lyrics.split(/\s+/).length} lyric words...`,
      )
      syncedLyrics = alignLyrics(lyrics.trim(), whisperWords)
      plainLyricsToStore = lyrics.trim()
    } else {
      console.log(
        `[sync-lyrics] Auto-transcribe mode: grouping ${whisperWords.length} Whisper words into lines...`,
      )
      syncedLyrics = transcribeToLyrics(whisperWords)
      plainLyricsToStore = syncedLyrics.lines.map(l => l.text).join('\n')
    }

    const { error: updateError } = await admin
      .from('music_catalog')
      .update({
        synced_lyrics: syncedLyrics,
        plain_lyrics: plainLyricsToStore,
        updated_at: new Date().toISOString(),
      })
      .eq('id', catalogId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    console.log(
      `[sync-lyrics] Saved ${syncedLyrics.lines.length} synced lines for "${track.title}"`,
    )

    return NextResponse.json({
      success: true,
      trackTitle: track.title,
      lineCount: syncedLyrics.lines.length,
      wordCount: whisperWords.length,
      plainLyrics: plainLyricsToStore,
      syncedLyrics,
    })
  } catch (error: any) {
    console.error('[sync-lyrics] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to sync lyrics' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { searchParams } = new URL(request.url)
  const catalogId = searchParams.get('catalogId')

  if (!catalogId) {
    return NextResponse.json({ error: 'catalogId is required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('music_catalog')
    .update({
      synced_lyrics: null,
      plain_lyrics: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', catalogId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
