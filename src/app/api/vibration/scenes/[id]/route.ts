import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeVibration } from '@/lib/vibration/service'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sceneId = params.id
    const body = await request.json()
    const { title, text, essence_word: essenceWord } = body ?? {}

    if (!text || !title) {
      return NextResponse.json({ error: 'Title and text are required.' }, { status: 400 })
    }

    const { data: existingScene, error: fetchError } = await supabase
      .from('scenes')
      .select('*')
      .eq('id', sceneId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!existingScene) {
      return NextResponse.json({ error: 'Scene not found.' }, { status: 404 })
    }

    const createdFrom =
      existingScene.created_from === 'ai_suggested' ? 'hybrid' : existingScene.created_from ?? 'user_written'

    const { data: updatedSceneBase, error: updateError } = await supabase
      .from('scenes')
      .update({
        title,
        text,
        essence_word: essenceWord ?? existingScene.essence_word,
        created_from: createdFrom,
      })
      .eq('id', sceneId)
      .select()
      .single()

    if (updateError || !updatedSceneBase) {
      return NextResponse.json({ error: updateError?.message || 'Failed to update scene.' }, { status: 500 })
    }

    const vibrationalEvent = await analyzeVibration({
      userId: user.id,
      category: updatedSceneBase.category,
      sourceType: 'scene',
      sourceId: sceneId,
      text,
      rawText: text,
      recomputeSnapshot: true,
    })

    const { data: finalScene, error: finalUpdateError } = await supabase
      .from('scenes')
      .update({
        essence_word: vibrationalEvent.essence_word ?? updatedSceneBase.essence_word,
        emotional_valence: vibrationalEvent.emotional_valence,
      })
      .eq('id', sceneId)
      .select()
      .single()

    if (finalUpdateError || !finalScene) {
      return NextResponse.json({ error: finalUpdateError?.message || 'Failed to finalize scene.' }, { status: 500 })
    }

    return NextResponse.json({ scene: finalScene, vibrationalEvent })
  } catch (error) {
    console.error('Error updating scene:', error)
    return NextResponse.json({ error: 'Failed to update scene.' }, { status: 500 })
  }
}

