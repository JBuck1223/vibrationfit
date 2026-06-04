/**
 * YouTube Audio Extraction API
 *
 * Downloads audio from a YouTube URL using yt-dlp,
 * returns a temporary audio URL the client can load
 * into a waveform scrubber.
 *
 * POST /api/songs/extract-youtube
 * Body: { url: string }
 * Returns: { audio_url: string, duration: number }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { readFile, unlink, mkdtemp } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

export const maxDuration = 120
export const dynamic = 'force-dynamic'

const execFileAsync = promisify(execFile)

const CDN_URL = 'https://media.vibrationfit.com'
const BUCKET = 'vibration-fit-client-storage'

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

function isValidYoutubeUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return (
      u.hostname === 'www.youtube.com' ||
      u.hostname === 'youtube.com' ||
      u.hostname === 'youtu.be' ||
      u.hostname === 'm.youtube.com' ||
      u.hostname === 'music.youtube.com'
    )
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { url } = await request.json()

    if (!url || !isValidYoutubeUrl(url)) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    }

    const tempDir = await mkdtemp(join(tmpdir(), 'yt-audio-'))
    const outputPath = join(tempDir, 'audio.mp3')

    try {
      const execEnv = { ...process.env, PATH: `${process.env.PATH}:/opt/homebrew/bin:/usr/local/bin` }

      // Download audio-only via yt-dlp, convert to mp3
      await execFileAsync('yt-dlp', [
        '--no-playlist',
        '-x',
        '--audio-format', 'mp3',
        '--audio-quality', '128K',
        '--max-filesize', '50m',
        '-o', outputPath,
        url,
      ], { timeout: 90_000, env: execEnv })

      const audioBuffer = await readFile(outputPath)

      // Get duration via ffprobe
      let duration = 180
      try {
        const { stdout } = await execFileAsync('ffprobe', [
          '-v', 'quiet',
          '-show_entries', 'format=duration',
          '-of', 'csv=p=0',
          outputPath,
        ], { env: execEnv })
        const parsed = parseFloat(stdout.trim())
        if (!isNaN(parsed)) duration = parsed
      } catch {}

      // Upload full audio to S3 as temporary reference source
      const key = `${user.id}/songs/references/${Date.now()}-ref.mp3`
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: audioBuffer,
        ContentType: 'audio/mpeg',
      }))

      const audioUrl = `${CDN_URL}/${key}`

      return NextResponse.json({ audio_url: audioUrl, duration })
    } finally {
      // Clean up temp files
      try { await unlink(outputPath) } catch {}
      try { await unlink(tempDir) } catch {}
    }
  } catch (err) {
    console.error('[ExtractYouTube] Error:', err)
    const message = err instanceof Error ? err.message : 'Extraction failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
