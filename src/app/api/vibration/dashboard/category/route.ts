import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateNorthStarReflection } from '@/lib/vibration/service'
import type { EmotionalSnapshotRecord, VibrationalEventRecord, SceneRecord } from '@/lib/types/vibration'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const category = url.searchParams.get('category')

    if (!category) {
      return NextResponse.json({ error: 'Category is required.' }, { status: 400 })
    }

    const { data: snapshot, error: snapshotError } = await supabase
      .from('emotional_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .eq('category', category)
      .maybeSingle()

    if (snapshotError) {
      return NextResponse.json({ error: snapshotError.message }, { status: 500 })
    }

    const { data: events, error: eventsError } = await supabase
      .from('vibrational_events')
      .select('id, created_at, emotional_valence, essence_word, intensity, summary_in_their_voice, dominant_emotions')
      .eq('user_id', user.id)
      .eq('category', category)
      .order('created_at', { ascending: true })
      .limit(60)

    if (eventsError) {
      return NextResponse.json({ error: eventsError.message }, { status: 500 })
    }

    const { data: scenes, error: scenesError } = await supabase
      .from('scenes')
      .select('*')
      .eq('user_id', user.id)
      .eq('category', category)
      .order('updated_at', { ascending: false })
      .limit(5)

    if (scenesError) {
      return NextResponse.json({ error: scenesError.message }, { status: 500 })
    }

    let reflection: string | null = null
    if (snapshot) {
      try {
        reflection = await generateNorthStarReflection({
          category,
          snapshot: snapshot as EmotionalSnapshotRecord,
          recentEvents: (events ?? [])
            .slice(-5)
            .map((event) => ({
              created_at: event.created_at,
              emotional_valence: event.emotional_valence as VibrationalEventRecord['emotional_valence'],
              essence_word: event.essence_word,
              summary_in_their_voice: event.summary_in_their_voice,
            })),
          supportingScenes: (scenes ?? [])
            .slice(0, 2)
            .map((scene) => ({ title: scene.title, essence_word: scene.essence_word })) as Array<
            Pick<SceneRecord, 'title' | 'essence_word'>
          >,
        })
      } catch (error) {
        console.error('Failed to generate North Star reflection:', error)
        reflection = null
      }
    }

    return NextResponse.json({
      snapshot,
      events: events ?? [],
      scenes: scenes ?? [],
      reflection,
    })
  } catch (error) {
    console.error('Error fetching category detail:', error)
    return NextResponse.json({ error: 'Failed to fetch category detail.' }, { status: 500 })
  }
}

