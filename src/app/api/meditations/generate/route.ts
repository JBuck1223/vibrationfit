import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mureka } from '@/lib/mureka/client'
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
    const referenceId = body.reference_id ? String(body.reference_id) : null

    if (!title) {
      return NextResponse.json({ error: 'Name the track before generating it' }, { status: 400 })
    }

    let reference: { id: string; title: string; mureka_file_id: string } | null = null
    if (referenceId) {
      const { data } = await supabase
        .from('meditation_references')
        .select('id, title, mureka_file_id')
        .eq('id', referenceId)
        .eq('user_id', user.id)
        .maybeSingle()
      if (!data) return NextResponse.json({ error: 'Reference not found' }, { status: 404 })
      reference = data
    }

    const prompt = reference ? null : buildInstrumentalPrompt(mood)
    const baseMeta = reference
      ? { kind: 'meditation_instrumental', reference_id: reference.id, reference_title: reference.title }
      : { kind: 'meditation_instrumental', mood }

    const { data: song, error: songError } = await supabase
      .from('songs')
      .insert({
        user_id: user.id,
        entity_type: 'meditation',
        entity_id: crypto.randomUUID(),
        title,
        lyrics: '',
        style_prompt: prompt || `Reference: ${reference!.title}`,
        source: 'ai_generated',
        status: 'generating_music',
        generation_count: 1,
        metadata: baseMeta,
      })
      .select('id')
      .single()

    if (songError || !song) {
      return NextResponse.json({ error: songError?.message || 'Failed to start' }, { status: 500 })
    }

    let murekaResponse
    try {
      murekaResponse = await mureka.generateInstrumental(
        reference ? { instrumental_id: reference.mureka_file_id, model: 'auto' } : { prompt: prompt!, model: 'auto' },
      )
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
          ...baseMeta,
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
