import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createVibrationalEventFromSource } from '@/lib/vibration/service'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: events, error: fetchError } = await supabase
      .from('abundance_events')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const allEvents = events || []

    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const weekStr = startOfWeek.toISOString().split('T')[0]
    const monthStr = startOfMonth.toISOString().split('T')[0]

    let totalAmount = 0
    let moneyCount = 0
    let valueCount = 0
    let weekAmount = 0
    let weekCount = 0
    let monthAmount = 0
    let monthCount = 0

    const entryBreakdown: Record<string, { count: number; amount: number }> = {}
    const visionBreakdown: Record<string, { count: number; amount: number }> = {}

    for (const ev of allEvents) {
      const amt = Number(ev.amount) || 0
      totalAmount += amt

      if (ev.value_type === 'money') moneyCount++
      else valueCount++

      if (ev.date >= weekStr) {
        weekAmount += amt
        weekCount++
      }
      if (ev.date >= monthStr) {
        monthAmount += amt
        monthCount++
      }

      const eCat = ev.entry_category || 'uncategorized'
      if (!entryBreakdown[eCat]) entryBreakdown[eCat] = { count: 0, amount: 0 }
      entryBreakdown[eCat].count++
      entryBreakdown[eCat].amount += amt

      const vCats = ev.vision_category
        ? ev.vision_category.split(',').map((s: string) => s.trim()).filter(Boolean)
        : ['uncategorized']
      for (const vCat of vCats) {
        const key = vCat || 'uncategorized'
        if (!visionBreakdown[key]) visionBreakdown[key] = { count: 0, amount: 0 }
        visionBreakdown[key].count++
        visionBreakdown[key].amount += amt
      }
    }

    return NextResponse.json({
      summary: {
        totalAmount,
        totalCount: allEvents.length,
        moneyCount,
        valueCount,
      },
      timePeriods: {
        week: { amount: weekAmount, count: weekCount },
        month: { amount: monthAmount, count: monthCount },
        allTime: { amount: totalAmount, count: allEvents.length },
      },
      entryBreakdown,
      visionBreakdown,
      recentEvents: allEvents.slice(0, 10),
    })
  } catch (error) {
    console.error('Error fetching abundance data:', error)
    return NextResponse.json({ error: 'Failed to fetch abundance data.' }, { status: 500 })
  }
}

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
    const { date, valueType, amount, visionCategory, visionCategories, entryCategory, note, imageUrl } = body ?? {}
    const visionCategoryValue =
      Array.isArray(visionCategories) && visionCategories.length > 0
        ? visionCategories.join(',')
        : visionCategory ?? null

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

    // Insert without image_url so the request succeeds even if the column doesn't exist yet (migration not run).
    const insertPayload = {
      user_id: user.id,
      date,
      value_type: valueType,
      amount: amount ?? null,
      vision_category: visionCategoryValue,
      entry_category: entryCategory ?? null,
      note,
    }

    const { data: abundanceEvent, error: insertError } = await supabase
      .from('abundance_events')
      .insert(insertPayload)
      .select()
      .single()

    if (insertError || !abundanceEvent) {
      return NextResponse.json({ error: insertError?.message || 'Failed to log abundance event.' }, { status: 500 })
    }

    // If an image URL was provided, try to update the row (fails silently if image_url column doesn't exist).
    if (imageUrl != null && imageUrl !== '') {
      const { error: updateError } = await supabase
        .from('abundance_events')
        .update({ image_url: imageUrl })
        .eq('id', abundanceEvent.id)
      if (updateError) {
        console.warn('abundance_events.image_url update skipped (column may not exist):', updateError.message)
      } else {
        ;(abundanceEvent as Record<string, unknown>).image_url = imageUrl
      }
    }

    const categoryValue = visionCategoryValue || 'abundance'

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

