import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { createClient } from '@/lib/supabase/server'
import type { ActivationRow } from '@/lib/activation/orchestrator'
import { buildActivationPack, type PackAssets, type PackSongTrack } from '@/lib/activation/pack'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

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
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { data: activation, error } = await supabase
      .from('activations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error || !activation) {
      return NextResponse.json({ error: 'Activation not found' }, { status: 404 })
    }

    const row = activation as ActivationRow & {
      created_at?: string
      inspired_next_step?: string | null
    }

    const storyIds = [row.story_id, row.incantation_id, row.spark_query_id].filter(
      (value): value is string => !!value,
    )
    const [storiesRes, songRes, trackRes, boardRes] = await Promise.all([
      storyIds.length
        ? supabase.from('stories').select('id, title, content, metadata').in('id', storyIds)
        : Promise.resolve({ data: [] as Array<{ id: string; title: string; content: string; metadata: unknown }> }),
      row.song_id
        ? supabase.from('songs').select('id, title, lyrics, status').eq('id', row.song_id).maybeSingle()
        : Promise.resolve({ data: null }),
      row.audio_set_id
        ? supabase
            .from('audio_tracks')
            .select('id, audio_url, duration_seconds, section_key')
            .eq('audio_set_id', row.audio_set_id)
            .eq('status', 'completed')
            .order('created_at', { ascending: true })
        : Promise.resolve({ data: [] as Array<{ audio_url: string; section_key: string }> }),
      (row.manifestation_ids || []).length
        ? supabase
            .from('manifestations')
            .select('id, name, description, image_url')
            .in('id', row.manifestation_ids)
        : Promise.resolve({ data: [] as PackAssets['manifestations'] }),
    ])

    const stories = storiesRes.data || []
    const song = songRes.data as { id: string; title: string; lyrics: string | null; status: string } | null
    let songTracks: PackSongTrack[] = []

    if (song && (song.status === 'completed' || song.status === 'generating_music')) {
      const { data } = await supabase
        .from('song_tracks')
        .select('id, mp3_url, cover_url, title')
        .eq('song_id', song.id)
        .not('mp3_url', 'is', null)
        .order('created_at', { ascending: true })
      songTracks = (data || [])
        .filter((track): track is typeof track & { mp3_url: string } => !!track.mp3_url)
        .map((track) => ({
          audio_url: track.mp3_url,
          cover_url: track.cover_url,
          title: track.title,
        }))
    }

    const assets: PackAssets = {
      story: stories.find((story) => story.id === row.story_id) || null,
      incantation: stories.find((story) => story.id === row.incantation_id) || null,
      sparkQuery: (() => {
        const spark = stories.find((story) => story.id === row.spark_query_id)
        if (!spark) return null
        const metadata = (spark.metadata as { questions?: string[] } | null) || null
        return { content: spark.content, metadata }
      })(),
      song: song ? { title: song.title, lyrics: song.lyrics, tracks: songTracks } : null,
      audioTracks: (trackRes.data || []) as PackAssets['audioTracks'],
      manifestations: (boardRes.data || []) as PackAssets['manifestations'],
    }

    const firstName =
      (user.user_metadata?.first_name as string | undefined) ||
      (user.user_metadata?.full_name as string | undefined)?.split(' ')[0] ||
      null

    const { zip, filename } = await buildActivationPack({
      activation: row,
      assets,
      firstName,
    })

    const s3Key = `user-uploads/${user.id}/activation-packs/${row.id}/${Date.now()}-${filename}`
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
        Body: zip,
        ContentType: 'application/zip',
        ContentDisposition: `attachment; filename="${filename}"`,
        CacheControl: 'private, no-cache, no-store',
      }),
    )

    console.log(`[activation download] ${row.id} ${filename} ${(zip.length / 1024 / 1024).toFixed(1)}MB`)

    return NextResponse.json({
      url: `${CDN_URL}/${s3Key}`,
      filename,
    })
  } catch (error) {
    console.error('[activation download] error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to prepare Activation pack' },
      { status: 500 },
    )
  }
}
