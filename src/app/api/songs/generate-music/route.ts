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
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: GenerateMusicBody = await request.json()
    const { song_id, style_prompt: overrideStyle, reference_id } = body

    if (!song_id) {
      return NextResponse.json({ error: 'song_id is required' }, { status: 400 })
    }

    const { data: song, error: songError } = await supabase
      .from('songs')
      .select('id, lyrics, style_prompt, status')
      .eq('id', song_id)
      .eq('user_id', user.id)
      .single()

    if (songError || !song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 })
    }

    if (!song.lyrics) {
      return NextResponse.json({ error: 'Song has no lyrics. Generate lyrics first.' }, { status: 400 })
    }

    const stylePrompt = overrideStyle || song.style_prompt || 'uplifting, emotional, modern'

    console.log(`[SongMusic] Submitting to Mureka: song=${song_id}, style="${stylePrompt.slice(0, 60)}"${reference_id ? `, ref=${reference_id}` : ''}`)

    const murekaResponse = await mureka.generateSong({
      lyrics: song.lyrics,
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
        metadata: {
          mureka_task_id: murekaResponse.id,
          mureka_model: murekaResponse.model,
          mureka_trace_id: murekaResponse.trace_id,
          ...(reference_id ? { reference_id } : {}),
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
