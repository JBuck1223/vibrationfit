import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { createClient } from '@/lib/supabase/server'

const BUCKET_NAME = 'vibration-fit-client-storage'

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9\s\-_.]/g, '').trim().replace(/\s+/g, '-') || 'track'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const trackId = searchParams.get('trackId')

    if (!trackId) {
      return NextResponse.json({ error: 'Missing trackId parameter' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: track, error } = await supabase
      .from('audio_tracks')
      .select('id, s3_key, mixed_s3_key, mix_status, section_key, text_content')
      .eq('id', trackId)
      .single()

    if (error || !track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 })
    }

    const s3Key = (track.mix_status === 'completed' && track.mixed_s3_key)
      ? track.mixed_s3_key
      : track.s3_key

    if (!s3Key) {
      return NextResponse.json({ error: 'Track has no audio file' }, { status: 404 })
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    })

    const s3Response = await s3.send(command)

    if (!s3Response.Body) {
      return NextResponse.json({ error: 'No audio data returned from storage' }, { status: 500 })
    }

    const filename = sanitizeFilename(track.section_key || 'audio-track') + '.mp3'
    const contentLength = s3Response.ContentLength

    const headers: Record<string, string> = {
      'Content-Type': s3Response.ContentType || 'audio/mpeg',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, max-age=3600',
    }

    if (contentLength) {
      headers['Content-Length'] = String(contentLength)
    }

    const webStream = s3Response.Body.transformToWebStream()

    return new Response(webStream, { status: 200, headers })
  } catch (error) {
    console.error('Audio download error:', error)
    return NextResponse.json({ error: 'Failed to download audio' }, { status: 500 })
  }
}
