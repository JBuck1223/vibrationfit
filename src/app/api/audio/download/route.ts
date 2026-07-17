import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET_NAME = 'vibration-fit-client-storage'
const CDN_PREFIX = 'https://media.vibrationfit.com/'

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

/** Extract the S3 key from a CDN or direct S3 URL pointing at our bucket. */
function s3KeyFromUrl(url: string): string | null {
  let rest: string | null = null
  if (url.startsWith(CDN_PREFIX)) {
    rest = url.slice(CDN_PREFIX.length)
  } else {
    const s3Match = url.match(/^https:\/\/vibration-fit-client-storage\.s3[^/]*\.amazonaws\.com\//)
    if (s3Match) rest = url.slice(s3Match[0].length)
  }
  if (!rest) return null
  const path = rest.split('?')[0]
  try {
    return path.split('/').map(decodeURIComponent).join('/')
  } catch {
    return path
  }
}

function extensionFromKey(key: string): string {
  const match = key.match(/\.([a-zA-Z0-9]+)$/)
  return match ? match[1].toLowerCase() : 'mp3'
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

    let s3Key: string | null = null
    let baseName: string | null = null

    // 1. Generated audio tracks (life vision / story audio)
    const { data: track } = await supabase
      .from('audio_tracks')
      .select('id, s3_key, mixed_s3_key, mix_status, section_key')
      .eq('id', trackId)
      .maybeSingle()

    if (track) {
      s3Key = (track.mix_status === 'completed' && track.mixed_s3_key)
        ? track.mixed_s3_key
        : track.s3_key
      baseName = track.section_key || 'audio-track'
    }

    // 2. Music catalog (official + member library songs on /audio/music)
    if (!s3Key) {
      const { data: music } = await supabase
        .from('music_catalog')
        .select('id, title, preview_url')
        .eq('id', trackId)
        .maybeSingle()

      if (music?.preview_url) {
        s3Key = s3KeyFromUrl(music.preview_url)
        baseName = music.title || 'track'
      }
    }

    // 3. Member song tracks (artist pages). Cross-member reads need the admin
    // client (song_tracks RLS is owner-only); only expose library-shared tracks.
    if (!s3Key) {
      const adminDb = createAdminClient()
      const { data: song } = await adminDb
        .from('song_tracks')
        .select('id, user_id, title, mp3_url, in_member_library')
        .eq('id', trackId)
        .maybeSingle()

      if (song?.mp3_url && (song.user_id === user.id || song.in_member_library)) {
        s3Key = s3KeyFromUrl(song.mp3_url)
        baseName = song.title || 'track'
      }
    }

    if (!s3Key) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 })
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    })

    const s3Response = await s3.send(command)

    if (!s3Response.Body) {
      return NextResponse.json({ error: 'No audio data returned from storage' }, { status: 500 })
    }

    const filename = `${sanitizeFilename(baseName || 'audio-track')}.${extensionFromKey(s3Key)}`
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
