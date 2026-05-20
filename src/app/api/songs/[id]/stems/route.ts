/**
 * Song Stems Download API
 *
 * Calls Mureka stem separation, downloads the ZIP to S3,
 * and returns the CDN download URL.
 *
 * POST /api/songs/[id]/stems
 * Body: { track_id: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mureka } from '@/lib/mureka/client'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

export const maxDuration = 120
export const dynamic = 'force-dynamic'

const CDN_URL = 'https://media.vibrationfit.com'
const BUCKET = 'vibration-fit-client-storage'

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: songId } = await params
    const { track_id } = await request.json()

    if (!track_id) {
      return NextResponse.json({ error: 'track_id is required' }, { status: 400 })
    }

    const { data: track, error: fetchError } = await supabase
      .from('song_tracks')
      .select('id, version, metadata, stems_url, s3_key')
      .eq('id', track_id)
      .eq('song_id', songId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 })
    }

    if (track.stems_url) {
      return NextResponse.json({ stems_url: track.stems_url })
    }

    const originalMp3Url = (track.metadata as Record<string, string>)?.mureka_mp3_url
    if (!originalMp3Url) {
      return NextResponse.json({
        error: 'No original Mureka URL available for stem separation',
      }, { status: 400 })
    }

    console.log(`[SongStems] Requesting stems for track ${track_id}, URL: ${originalMp3Url.slice(0, 80)}...`)

    const stemResult = await mureka.generateStems({ url: originalMp3Url })

    console.log(`[SongStems] Mureka returned ZIP URL, downloading to S3...`)

    const zipResponse = await fetch(stemResult.zip_url)
    if (!zipResponse.ok) {
      throw new Error(`Failed to download stems ZIP: ${zipResponse.status}`)
    }
    const zipBuffer = Buffer.from(await zipResponse.arrayBuffer())

    const s3Key = `user-uploads/${user.id}/songs/${songId}/stems-${track.version}.zip`
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
      Body: zipBuffer,
      ContentType: 'application/zip',
    }))

    const stemsUrl = `${CDN_URL}/${s3Key}`

    await supabase
      .from('song_tracks')
      .update({
        stems_url: stemsUrl,
        stems_s3_key: s3Key,
      })
      .eq('id', track_id)
      .eq('user_id', user.id)

    console.log(`[SongStems] Done. Stems saved: ${s3Key} (${(zipBuffer.length / 1024 / 1024).toFixed(1)}MB)`)

    return NextResponse.json({ stems_url: stemsUrl })
  } catch (err) {
    console.error('[SongStems] Error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Failed to generate stems',
    }, { status: 500 })
  }
}
