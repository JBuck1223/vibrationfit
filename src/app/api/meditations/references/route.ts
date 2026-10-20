import { NextRequest, NextResponse } from 'next/server'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import ffmpegStatic from 'ffmpeg-static'
import { createClient } from '@/lib/supabase/server'
import { mureka } from '@/lib/mureka/client'
import { trackTokenUsage } from '@/lib/tokens/tracking'
import { REFERENCE_CLIP_SECONDS } from '@/lib/meditations/constants'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const execFileAsync = promisify(execFile)
const FFMPEG_BIN = ffmpegStatic || 'ffmpeg'
const CDN_URL = 'https://media.vibrationfit.com'
const BUCKET = 'vibration-fit-client-storage'

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const COLUMNS = 'id, title, source_url, youtube_url, clip_url, clip_start, created_at'

function isOwnMediaUrl(url: string) {
  return url.startsWith(`${CDN_URL}/`)
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('meditation_references')
      .select(COLUMNS)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ references: data || [] })
  } catch (err) {
    console.error('[MeditationReference] List error:', err)
    return NextResponse.json({ error: 'Failed to load references' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const url = String(body.url || '')
    const start = Math.max(0, Number(body.start) || 0)
    const title = String(body.title || '').trim().slice(0, 120) || 'Reference'
    const youtubeUrl = body.youtube_url ? String(body.youtube_url) : null

    // Only clip audio we already host (uploads and YouTube extractions land on our CDN).
    if (!url || !isOwnMediaUrl(url)) {
      return NextResponse.json({ error: 'Load or upload audio first' }, { status: 400 })
    }

    const tempDir = await mkdtemp(join(tmpdir(), 'meditation-ref-'))
    try {
      const inputPath = join(tempDir, 'input')
      const outputPath = join(tempDir, 'clip.mp3')

      const source = await fetch(url)
      if (!source.ok) throw new Error('Could not read that audio')
      await writeFile(inputPath, Buffer.from(await source.arrayBuffer()))

      await execFileAsync(FFMPEG_BIN, [
        '-y',
        '-ss', String(start),
        '-t', String(REFERENCE_CLIP_SECONDS),
        '-i', inputPath,
        '-vn',
        '-acodec', 'libmp3lame',
        '-ab', '192k',
        '-ar', '44100',
        outputPath,
      ], { timeout: 30_000 })

      const clipKey = `user-uploads/${user.id}/meditations/references/${Date.now()}-clip.mp3`
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: clipKey,
        Body: await readFile(outputPath),
        ContentType: 'audio/mpeg',
      }))
      const clipUrl = `${CDN_URL}/${clipKey}`

      const uploaded = await mureka.uploadFile({ url: clipUrl, purpose: 'instrumental' })

      await trackTokenUsage({
        user_id: user.id,
        action_type: 'song_music_generation',
        model_used: 'mureka-upload',
        tokens_used: 0,
        unit_count: 1,
        provider: 'mureka',
        provider_request_id: uploaded.id,
        billable: false,
        success: true,
        metadata: { purpose: 'instrumental', kind: 'meditation_reference', clip_url: clipUrl },
      })

      const { data, error } = await supabase
        .from('meditation_references')
        .insert({
          user_id: user.id,
          title,
          source_url: url,
          youtube_url: youtubeUrl,
          clip_url: clipUrl,
          clip_start: start,
          mureka_file_id: uploaded.id,
        })
        .select(COLUMNS)
        .single()

      if (error || !data) {
        return NextResponse.json({ error: error?.message || 'Failed to save reference' }, { status: 500 })
      }
      return NextResponse.json({ reference: data })
    } finally {
      await rm(tempDir, { recursive: true, force: true }).catch(() => {})
    }
  } catch (err) {
    console.error('[MeditationReference] Create error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Failed to save reference',
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = request.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const { error } = await supabase
      .from('meditation_references')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ id })
  } catch (err) {
    console.error('[MeditationReference] Delete error:', err)
    return NextResponse.json({ error: 'Failed to delete reference' }, { status: 500 })
  }
}
