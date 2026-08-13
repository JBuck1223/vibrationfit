/**
 * Weekly Materials Forecast — the Sunday 5-minute review.
 *
 * One gather/shopping list for the coming week's likely lessons. Daily
 * lessons may only require pantry-grade items unless the item appeared on
 * a forecast at least 3 days earlier. No 8am ambushes.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { packForExpedition } from './packs/antarctica'
import type { LessonPayload } from './types'

export interface MaterialsForecast {
  expedition_title: string | null
  /** Special items to gather ahead (from pack + upcoming lesson payloads). */
  plan_ahead: string[]
  /** Household staples the week will lean on. */
  pantry: string[]
  /** Anything time-sensitive (e.g. "freeze the iceberg TONIGHT"). */
  tonight: string[]
}

export async function buildMaterialsForecast(
  supabase: SupabaseClient,
  studentId: string
): Promise<MaterialsForecast> {
  const { data: expedition } = await supabase
    .from('le_expeditions')
    .select('id, title')
    .eq('student_id', studentId)
    .eq('status', 'active')
    .maybeSingle()

  if (!expedition) {
    return { expedition_title: null, plan_ahead: [], pantry: [], tonight: [] }
  }

  const pack = packForExpedition(expedition.title)

  const { data: lessons } = await supabase
    .from('le_lessons')
    .select('status, payload, lesson_number')
    .eq('expedition_id', expedition.id)
    .order('lesson_number', { ascending: true })

  const completedCount = (lessons || []).filter((l) => l.status === 'completed').length

  const planAhead = new Set<string>()
  const tonight = new Set<string>()

  // Upcoming pack lessons (the next ~5 the family is likely to hit).
  if (pack) {
    for (const item of pack.materials.plan_ahead) planAhead.add(item)
    const upcoming = pack.fallback_lessons.slice(completedCount, completedCount + 5)
    for (const lesson of upcoming) {
      for (const step of lesson.parent_prep?.beforehand || []) {
        if (/night before|overnight|tonight/i.test(step)) tonight.add(step)
      }
    }
  }

  // Any already-generated ready lessons add their materials too.
  for (const l of lessons || []) {
    if (l.status !== 'ready' && l.status !== 'in_progress') continue
    const p = l.payload as LessonPayload
    for (const m of p?.parent_prep?.materials || []) planAhead.add(m)
    for (const step of p?.parent_prep?.beforehand || []) {
      if (/night before|overnight|tonight/i.test(step)) tonight.add(step)
    }
  }

  return {
    expedition_title: expedition.title,
    plan_ahead: [...planAhead],
    pantry: pack?.materials.pantry || [],
    tonight: [...tonight],
  }
}
