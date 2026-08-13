import type { SupabaseClient } from '@supabase/supabase-js'
import type { LeLesson, LeLessonItem, LessonItemKind, LessonPayload } from './types'

interface DerivedItem {
  title: string
  detail: string | null
  kind: LessonItemKind
  sort_order: number
}

/**
 * Turn a generated lesson payload into the concrete checklist the parent
 * works through: everything the lesson prescribes (print this, gather that,
 * do the experiment, update the Wonder Wall) becomes a checkable action item
 * that lives inside the lesson bucket.
 */
export function deriveLessonItems(payload: LessonPayload): DerivedItem[] {
  const items: DerivedItem[] = []
  let order = 0
  const push = (title: string, kind: LessonItemKind, detail: string | null = null) => {
    const trimmed = title?.trim()
    if (!trimmed) return
    items.push({ title: trimmed, detail, kind, sort_order: order++ })
  }

  // --- Prep: before the lesson starts ---
  const materials = payload.parent_prep?.materials || []
  if (materials.length > 0) {
    push('Gather materials', 'prep', materials.join(', '))
  }
  for (const step of payload.parent_prep?.beforehand || []) {
    push(step, 'prep')
  }
  if (payload.printable?.title) {
    push(`Print today's sheet: ${payload.printable.title}`, 'prep')
  }

  // --- During the lesson ---
  if (payload.flashback?.items?.length) {
    push('Expedition Flashback (2 min)', 'activity', payload.flashback.game)
  }
  for (const activity of payload.core_activities || []) {
    push(activity, 'activity')
  }
  if (payload.foundational_skills?.activity) {
    const subject = payload.foundational_skills.subject
    push(
      subject ? `${cap(subject)}: ${payload.foundational_skills.activity}` : payload.foundational_skills.activity,
      'activity'
    )
  }
  if (payload.child_output?.description) {
    push(
      `Create the ${payload.child_output.type || 'artifact'}`,
      'activity',
      payload.child_output.description
    )
  }

  // --- Wrap-up: close the loop and capture the record ---
  push(
    'Update the Wonder Wall',
    'wrap_up',
    payload.wonder_wall?.learned_guidance || 'Move answered wonders to Learned; add new wonders.'
  )
  if (payload.fun_contract?.artifact) {
    push('Photograph the artifact for the lesson record', 'wrap_up', payload.fun_contract.artifact)
  }
  if (payload.reflection?.length) {
    push('Talk through the reflection questions', 'wrap_up', payload.reflection.join(' • '))
  }

  return items
}

/**
 * Insert the derived checklist for a lesson if it does not have one yet.
 * Idempotent: does nothing when items already exist. Returns current items.
 */
export async function seedLessonItems(
  supabase: SupabaseClient,
  lesson: LeLesson,
  userId: string
): Promise<LeLessonItem[]> {
  const { data: existing } = await supabase
    .from('le_lesson_items')
    .select('*')
    .eq('lesson_id', lesson.id)
    .order('sort_order', { ascending: true })

  if (existing && existing.length > 0) return existing as LeLessonItem[]

  const derived = deriveLessonItems(lesson.payload || ({} as LessonPayload))
  if (derived.length === 0) return []

  const { data, error } = await supabase
    .from('le_lesson_items')
    .insert(
      derived.map((d) => ({
        lesson_id: lesson.id,
        student_id: lesson.student_id,
        created_by: userId,
        household_id: lesson.household_id,
        title: d.title,
        detail: d.detail,
        kind: d.kind,
        source: 'generated',
        sort_order: d.sort_order,
      }))
    )
    .select('*')

  if (error) {
    console.error('le seed lesson items', error)
    return []
  }
  return (data || []) as LeLessonItem[]
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
