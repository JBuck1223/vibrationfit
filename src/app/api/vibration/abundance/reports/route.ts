import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PeriodType } from '@/lib/abundance/period-utils'
import { getPeriodStartEnd } from '@/lib/abundance/period-utils'

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

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') as PeriodType | null
    const key = searchParams.get('key')
    const startParam = searchParams.get('start')
    const endParam = searchParams.get('end')

    let start: string
    let end: string
    let periodLabel: string

    if (period === 'custom' && startParam && endParam) {
      start = startParam
      end = endParam
      periodLabel = `${start} to ${end}`
    } else if (period && key && ['month', 'quarter', 'year'].includes(period)) {
      const range = getPeriodStartEnd(period as PeriodType, key)
      if (!range) {
        return NextResponse.json({ error: 'Invalid period or key.' }, { status: 400 })
      }
      start = range.start
      end = range.end
      const months: Record<string, string> = {
        '01': 'January', '02': 'February', '03': 'March', '04': 'April',
        '05': 'May', '06': 'June', '07': 'July', '08': 'August',
        '09': 'September', '10': 'October', '11': 'November', '12': 'December',
      }
      if (period === 'month') {
        const [y, m] = key.split('-')
        periodLabel = `${months[m] || m} ${y}`
      } else if (period === 'quarter') {
        const [y, qPart] = key.split('-')
        const q = qPart?.replace('Q', '') || ''
        periodLabel = q ? `Q${q} ${y}` : key
      } else {
        periodLabel = key
      }
    } else {
      return NextResponse.json(
        { error: 'Missing or invalid query: period+key, or period=custom with start&end.' },
        { status: 400 }
      )
    }

    const { data: events, error: fetchError } = await supabase
      .from('abundance_events')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false })

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const list = events || []
    let moneyTotal = 0
    let valueTotal = 0
    const entryBreakdown: Record<string, { count: number; amount: number }> = {}
    const visionBreakdown: Record<string, { count: number; amount: number }> = {}

    for (const ev of list) {
      const amt = Number(ev.amount) || 0
      if (ev.value_type === 'money') moneyTotal += amt
      else valueTotal += amt

      const eCat = ev.entry_category || 'others'
      if (!entryBreakdown[eCat]) entryBreakdown[eCat] = { count: 0, amount: 0 }
      entryBreakdown[eCat].count++
      entryBreakdown[eCat].amount += amt

      const vCats = ev.vision_category
        ? ev.vision_category.split(',').map((s: string) => s.trim()).filter(Boolean)
        : ['uncategorized']
      for (const vCat of vCats) {
        const k = vCat || 'uncategorized'
        if (!visionBreakdown[k]) visionBreakdown[k] = { count: 0, amount: 0 }
        visionBreakdown[k].count++
        visionBreakdown[k].amount += amt
      }
    }

    return NextResponse.json({
      period: periodLabel,
      start,
      end,
      moneyTotal,
      valueTotal,
      totalAmount: moneyTotal + valueTotal,
      entryBreakdown,
      visionBreakdown,
      events: list,
    })
  } catch (error) {
    console.error('Error fetching abundance report:', error)
    return NextResponse.json({ error: 'Failed to fetch report.' }, { status: 500 })
  }
}
