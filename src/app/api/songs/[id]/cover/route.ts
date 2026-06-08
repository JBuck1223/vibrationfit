/**
 * Song Cover Art API
 *
 * POST /api/songs/[id]/cover
 * - JSON body: { cover_url: string } (VIVA-generated or external URL)
 * - multipart/form-data: file field (user upload, auto-resized to 3000x3000 square)
 * - JSON body cover_url is fetched, resized to 3000x3000, and stored on S3
 * - Vibration Fit waveform logo is composited bottom-right (matches Canva catalog art)
 *
 * Saves cover URL to songs.metadata.custom_cover_url and bulk-updates song_tracks.cover_url.
 */

import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import { createClient } from '@/lib/supabase/server'
import { applyAlbumArtWatermark } from '@/lib/audio/apply-album-art-branding'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const BUCKET = 'vibration-fit-client-storage'
const CDN_URL = 'https://media.vibrationfit.com'
const ALBUM_ART_SIZE = 3000

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

async function processAlbumArtImage(inputBuffer: Buffer): Promise<{ buffer: Buffer; contentType: string }> {
  const resized = await sharp(inputBuffer)
    .rotate()
    .resize(ALBUM_ART_SIZE, ALBUM_ART_SIZE, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer()

  const watermarked = await applyAlbumArtWatermark(resized, ALBUM_ART_SIZE)

  const buffer = await sharp(watermarked)
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer()

  return { buffer, contentType: 'image/jpeg' }
}

async function uploadCoverToS3(userId: string, songId: string, buffer: Buffer, contentType: string): Promise<string> {
  const key = `user-uploads/${userId}/songs/covers/${songId}-${Date.now()}.jpg`
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }))
  return `${CDN_URL}/${key}`
}

async function saveCoverUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  songId: string,
  userId: string,
  coverUrl: string,
) {
  const { data: song, error: songError } = await supabase
    .from('songs')
    .select('id, metadata')
    .eq('id', songId)
    .eq('user_id', userId)
    .single()

  if (songError || !song) {
    return { error: 'Song not found', status: 404 as const }
  }

  const existingMetadata = typeof song.metadata === 'object' && song.metadata ? song.metadata : {}

  const { error: updateError } = await supabase
    .from('songs')
    .update({
      metadata: { ...existingMetadata, custom_cover_url: coverUrl },
      updated_at: new Date().toISOString(),
    })
    .eq('id', songId)
    .eq('user_id', userId)

  if (updateError) {
    return { error: 'Failed to update song metadata', status: 500 as const }
  }

  const { error: tracksError } = await supabase
    .from('song_tracks')
    .update({ cover_url: coverUrl })
    .eq('song_id', songId)
    .eq('user_id', userId)

  if (tracksError) {
    console.error('[SongCover] Failed to update tracks:', tracksError)
  }

  return { coverUrl }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json({ error: 'Storage not configured' }, { status: 500 })
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: songId } = await params
    const contentType = request.headers.get('content-type') || ''

    let coverUrl: string

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file')

      if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: 'file is required' }, { status: 400 })
      }

      if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(jpe?g|png|webp|heic|heif)$/i)) {
        return NextResponse.json({ error: 'Invalid file type. Use JPG, PNG, or WebP.' }, { status: 400 })
      }

      const maxSize = 20 * 1024 * 1024
      if (file.size > maxSize) {
        return NextResponse.json({ error: 'File too large. Maximum size is 20MB.' }, { status: 400 })
      }

      const inputBuffer = Buffer.from(await file.arrayBuffer())
      const processed = await processAlbumArtImage(inputBuffer)
      coverUrl = await uploadCoverToS3(user.id, songId, processed.buffer, processed.contentType)
    } else {
      const body = await request.json()
      const { cover_url } = body

      if (!cover_url || typeof cover_url !== 'string') {
        return NextResponse.json({ error: 'cover_url is required' }, { status: 400 })
      }

      const imageResponse = await fetch(cover_url)
      if (!imageResponse.ok) {
        return NextResponse.json({ error: 'Failed to fetch cover image' }, { status: 400 })
      }

      const inputBuffer = Buffer.from(await imageResponse.arrayBuffer())
      const processed = await processAlbumArtImage(inputBuffer)
      coverUrl = await uploadCoverToS3(user.id, songId, processed.buffer, processed.contentType)
    }

    const result = await saveCoverUrl(supabase, songId, user.id, coverUrl)

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json({ success: true, cover_url: result.coverUrl })
  } catch (err) {
    console.error('[SongCover] Error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Failed to save cover art',
    }, { status: 500 })
  }
}
