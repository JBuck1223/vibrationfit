/**
 * Song Music Generation API
 *
 * Takes a song_id, reads lyrics + style_prompt from the DB,
 * and submits to Mureka for music generation.
 * Returns the task_id for client-side polling.
 *
 * POST /api/songs/generate-music
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mureka } from '@/lib/mureka/client'

export const maxDuration = 30
export const dynamic = 'force-dynamic'

interface GenerateMusicBody {
  song_id: string
  style_prompt?: string
  reference_id?: string
  lyrics?: string
  reference_meta?: {
    youtube_url?: string
    title?: string
    clip_url?: string
    start?: number
    end?: number
    mureka_file_id?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: GenerateMusicBody = await request.json()
    const { song_id, style_prompt: overrideStyle, reference_id, lyrics: overrideLyrics, reference_meta } = body

    if (!song_id) {
      return NextResponse.json({ error: 'song_id is required' }, { status: 400 })
    }

    const { data: song, error: songError } = await supabase
      .from('songs')
      .select('id, lyrics, style_prompt, status, generation_count, metadata')
      .eq('id', song_id)
      .eq('user_id', user.id)
      .single()

    if (songError || !song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 })
    }

    if (song.status === 'generating_music') {
      return NextResponse.json({ error: 'Music generation already in progress' }, { status: 409 })
    }

    const lyrics = (overrideLyrics?.trim() || song.lyrics)?.trim()
    if (!lyrics) {
      return NextResponse.json({ error: 'Song has no lyrics. Generate lyrics first.' }, { status: 400 })
    }

    const stylePrompt = overrideStyle?.trim() || song.style_prompt || 'uplifting, emotional, modern'
    const nextGenerationCount = (song.generation_count || 0) + 1

    if (overrideLyrics?.trim() && overrideLyrics.trim() !== song.lyrics) {
      await supabase
        .from('songs')
        .update({
          lyrics: overrideLyrics.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', song_id)
        .eq('user_id', user.id)
    }

    console.log(`[SongMusic] Submitting to Mureka: song=${song_id}, gen=${nextGenerationCount}, style="${stylePrompt.slice(0, 60)}"${reference_id ? `, ref=${reference_id}` : ''}`)

    const murekaResponse = await mureka.generateSong({
      lyrics,
      prompt: reference_id ? undefined : stylePrompt,
      model: 'auto',
      reference_id: reference_id || undefined,
    })

    console.log(`[SongMusic] Mureka task created: ${murekaResponse.id}`)

    await supabase
      .from('songs')
      .update({
        status: 'generating_music',
        style_prompt: stylePrompt,
        generation_count: nextGenerationCount,
        metadata: {
          ...(typeof song.metadata === 'object' && song.metadata ? song.metadata : {}),
          mureka_task_id: murekaResponse.id,
          mureka_model: murekaResponse.model,
          mureka_trace_id: murekaResponse.trace_id,
          ...(reference_id ? { reference_id } : {}),
          ...(reference_meta ? { reference_track: reference_meta } : {}),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', song_id)
      .eq('user_id', user.id)

    return NextResponse.json({
      task_id: murekaResponse.id,
      song_id,
      status: murekaResponse.status,
    })
  } catch (err) {
    console.error('[SongMusic] Error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Failed to submit music generation',
    }, { status: 500 })
  }
}
