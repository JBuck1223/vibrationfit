import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mureka } from '@/lib/mureka/client'
import { BPM_OPTIONS, DEFAULT_BPM } from '@/lib/meditations/constants'
import { buildInstrumentalPrompt } from '@/lib/meditations/prompt'

export const maxDuration = 30
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const title = String(body.title || '').trim().slice(0, 80)
    const mood = String(body.mood || '').trim().slice(0, 200)
    const requestedBpm = Number(body.bpm)
    const bpm = (BPM_OPTIONS as readonly number[]).includes(requestedBpm) ? requestedBpm : DEFAULT_BPM

    if (!title) {
      return NextResponse.json({ error: 'Name the track before generating it' }, { status: 400 })
    }

    const prompt = buildInstrumentalPrompt(mood, bpm)

    const { data: song, error: songError } = await supabase
      .from('songs')
      .insert({
        user_id: user.id,
        entity_type: 'meditation',
        entity_id: crypto.randomUUID(),
        title,
        lyrics: '',
        style_prompt: prompt,
        source: 'ai_generated',
        status: 'generating_music',
        generation_count: 1,
        metadata: { kind: 'meditation_instrumental', bpm, mood },
      })
      .select('id')
      .single()

    if (songError || !song) {
      return NextResponse.json({ error: songError?.message || 'Failed to start' }, { status: 500 })
    }

    let murekaResponse
    try {
      murekaResponse = await mureka.generateInstrumental({ prompt, model: 'auto' })
    } catch (murekaError) {
      await supabase
        .from('songs')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', song.id)
        .eq('user_id', user.id)
      throw murekaError
    }

    await supabase
      .from('songs')
      .update({
        metadata: {
          kind: 'meditation_instrumental',
          bpm,
          mood,
          mureka_task_id: murekaResponse.id,
          mureka_model: murekaResponse.model,
          mureka_trace_id: murekaResponse.trace_id,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', song.id)
      .eq('user_id', user.id)

    return NextResponse.json({
      task_id: murekaResponse.id,
      song_id: song.id,
      status: murekaResponse.status,
    })
  } catch (err) {
    console.error('[Meditations] Generate error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Failed to generate instrumental',
    }, { status: 500 })
  }
}
