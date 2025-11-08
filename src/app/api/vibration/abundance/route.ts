import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createVibrationalEventFromSource } from '@/lib/vibration/service'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { date, valueType, amount, visionCategory, entryCategory, note } = body ?? {}

    if (!date || !valueType || !note) {
      return NextResponse.json({ error: 'Date, type, and note are required.' }, { status: 400 })
    }

    if (!['money', 'value'].includes(valueType)) {
      return NextResponse.json({ error: 'Type must be "money" or "value".' }, { status: 400 })
    }

    if (
      valueType === 'money' &&
      (typeof amount !== 'number' || Number.isNaN(amount))
    ) {
      return NextResponse.json({ error: 'Money entries require a valid amount.' }, { status: 400 })
    }

    const { data: abundanceEvent, error: insertError } = await supabase
      .from('abundance_events')
      .insert({
        user_id: user.id,
        date,
        value_type: valueType,
        amount: amount ?? null,
        vision_category: visionCategory ?? null,
        entry_category: entryCategory ?? null,
        note,
      })
      .select()
      .single()

    if (insertError || !abundanceEvent) {
      return NextResponse.json({ error: insertError?.message || 'Failed to log abundance event.' }, { status: 500 })
    }

    const categoryValue = visionCategory || 'abundance'

    const numericAmount = typeof amount === 'number' && !Number.isNaN(amount) ? amount : null

    await createVibrationalEventFromSource({
      userId: user.id,
      sourceType: 'abundance',
      supabaseClient: supabase,
      payload: {
        amount: numericAmount,
        note,
      },
      overrides: {
        category: categoryValue,
        source_id: abundanceEvent.id,
        raw_text: note,
        emotional_valence: 'above_green_line',
        dominant_emotions: ['appreciation'],
        intensity:
          numericAmount && numericAmount > 0
            ? Math.min(10, Math.max(4, Math.round(numericAmount / 50 + 5)))
            : 7,
        essence_word: 'appreciation',
        is_contrast: false,
        summary_in_their_voice: note.slice(0, 140),
      },
      recomputeSnapshot: true,
    })

    return NextResponse.json({ abundanceEvent })
  } catch (error) {
    console.error('Error logging abundance event:', error)
    return NextResponse.json({ error: 'Failed to log abundance event.' }, { status: 500 })
  }
}

