/**
 * Upload Reference Track to Mureka
 *
 * Accepts an S3 audio URL + start/end timestamps, clips the audio to
 * ~30 seconds via ffmpeg, uploads the clip to S3, then registers it
 * with Mureka as a reference track. Returns the reference_id.
 *
 * POST /api/songs/upload-reference
 * Body: { url: string, start?: number, end?: number }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mureka } from '@/lib/mureka/client'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { readFile, unlink, mkdtemp } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

export const maxDuration = 60
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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { url, start = 0, end = 30 } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'url is required' }, { status: 400 })
    }

    const duration = Math.min(end - start, 30)

    console.log(`[SongReference] Clipping ${url.slice(0, 80)}... from ${start}s to ${end}s (${duration}s)`)

    const tempDir = await mkdtemp(join(tmpdir(), 'ref-clip-'))
    const inputPath = join(tempDir, 'input.mp3')
    const outputPath = join(tempDir, 'clip.mp3')

    try {
      // Download the source audio
      const audioResponse = await fetch(url)
      if (!audioResponse.ok) throw new Error('Failed to download source audio')
      const audioBuffer = Buffer.from(await audioResponse.arrayBuffer())
      const { writeFile } = await import('fs/promises')
      await writeFile(inputPath, audioBuffer)

      // Clip to the selected segment
      await execFileAsync('ffmpeg', [
        '-y',
        '-ss', String(start),
        '-t', String(duration),
        '-i', inputPath,
        '-acodec', 'libmp3lame',
        '-ab', '128k',
        '-ar', '44100',
        outputPath,
      ], { timeout: 30_000 })

      const clipBuffer = await readFile(outputPath)

      // Upload clip to S3
      const clipKey = `${user.id}/songs/references/${Date.now()}-clip.mp3`
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: clipKey,
        Body: clipBuffer,
        ContentType: 'audio/mpeg',
      }))

      const clipUrl = `${CDN_URL}/${clipKey}`

      // Register with Mureka
      const result = await mureka.uploadFile({
        url: clipUrl,
        purpose: 'reference',
      })

      console.log(`[SongReference] Upload complete, reference_id: ${result.id}`)

      return NextResponse.json({
        reference_id: result.id,
        clip_url: clipUrl,
        purpose: result.purpose,
      })
    } finally {
      try { await unlink(inputPath) } catch {}
      try { await unlink(outputPath) } catch {}
      try { await unlink(tempDir) } catch {}
    }
  } catch (err) {
    console.error('[SongReference] Error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Failed to upload reference track',
    }, { status: 500 })
  }
}
