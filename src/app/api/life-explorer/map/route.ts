import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeCoverage, stateProfile } from '@/lib/life-explorer/state-standards'
import { buildLedgerWeather } from '@/lib/life-explorer/ledger'
import { WORLD_CLUSTERS } from '@/lib/life-explorer/world-map'
import { computeYearMap } from '@/lib/life-explorer/year-map'
import {
  MATH_LADDER,
  READING_LADDER,
  WRITING_LADDER,
  currentLadderPosition,
} from '@/lib/life-explorer/ladders'
import { weeklyLifeLearningFocus } from '@/lib/life-explorer/life-learning'
import { schoolQuarter } from '@/lib/life-explorer/sight-words'
import type { LeSkillProgress, LeYearArc, LifeCategoryKey } from '@/lib/life-explorer/types'

export const dynamic = 'force-dynamic'

const LIFE_CATEGORIES: Array<{ key: LifeCategoryKey; label: string; theme: string }> = [
  { key: 'fun', label: 'Fun', theme: 'Things I Love to Do' },
  { key: 'health', label: 'Health', theme: 'My Amazing Body' },
  { key: 'travel', label: 'Travel', theme: 'Places Near & Far' },
  { key: 'love', label: 'Love', theme: 'People I Love' },
  { key: 'family', label: 'Family', theme: 'My Family Story' },
  { key: 'social', label: 'Social', theme: 'My Friends & Community' },
  { key: 'home', label: 'Home', theme: 'Where I Live' },
  { key: 'work', label: 'Work', theme: 'What I Create' },
  { key: 'money', label: 'Money', theme: 'Counting & Sharing' },
  { key: 'stuff', label: 'Stuff', theme: 'Things I Use & Make' },
  { key: 'giving', label: 'Giving', theme: 'How I Help' },
  { key: 'spirituality', label: 'Spirituality', theme: 'My Quiet Inside' },
]

// GET /api/life-explorer/map?student_id=…
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let studentId = request.nextUrl.searchParams.get('student_id')
  if (!studentId) {
    const { data: student } = await supabase
      .from('le_students')
      .select('id')
      .eq('active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    studentId = student?.id || null
  }
  if (!studentId) {
    return NextResponse.json({ student: null, categories: [], coverage: [], suggestions: [] })
  }

  const { data: student } = await supabase
    .from('le_students')
    .select('*')
    .eq('id', studentId)
    .single()

  // Whole school year of inputs: coverage applies its own 30-day window,
  // while the Year Map keeps a Big Idea met once it is genuinely met.
  const since = new Date(Date.now() - 300 * 86_400_000).toISOString()

  const [expeditions, lessons, recentLessons, evidence, logs, wonders, mapItems, yearArc] =
    await Promise.all([
    supabase
      .from('le_expeditions')
      .select('id, life_category, title, status, start_date')
      .eq('student_id', studentId)
      .order('start_date', { ascending: true }),
    supabase
      .from('le_lessons')
      .select('id, expedition_id, status')
      .eq('student_id', studentId),
    supabase
      .from('le_lessons')
      .select('payload, created_at, status')
      .eq('student_id', studentId)
      .gte('created_at', since),
    supabase
      .from('le_learning_evidence')
      .select('academic_tags, created_at')
      .eq('student_id', studentId)
      .gte('created_at', since),
    supabase
      .from('le_activity_logs')
      .select('subjects, entry_date')
      .eq('student_id', studentId)
      .gte('entry_date', since.slice(0, 10)),
    supabase
      .from('le_wonder_items')
      .select('statement, kind, status, interest_level, expedition_id')
      .eq('kind', 'wonder')
      .neq('status', 'answered')
      .order('interest_level', { ascending: false })
      .limit(10),
    supabase
      .from('le_world_map_items')
      .select('*')
      .eq('student_id', studentId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('le_year_arcs')
      .select('*')
      .eq('student_id', studentId)
      .eq('status', 'active')
      .maybeSingle(),
  ])

  const lessonsByExpedition = new Map<string, { total: number; completed: number }>()
  for (const l of lessons.data || []) {
    const entry = lessonsByExpedition.get(l.expedition_id) || { total: 0, completed: 0 }
    entry.total += 1
    if (l.status === 'completed') entry.completed += 1
    lessonsByExpedition.set(l.expedition_id, entry)
  }

  const categories = LIFE_CATEGORIES.map((cat) => {
    const catExpeditions = (expeditions.data || [])
      .filter((e) => e.life_category === cat.key)
      .map((e) => ({
        ...e,
        lessons_total: lessonsByExpedition.get(e.id)?.total || 0,
        lessons_completed: lessonsByExpedition.get(e.id)?.completed || 0,
      }))
    return {
      ...cat,
      expeditions: catExpeditions,
      has_active: catExpeditions.some((e) => e.status === 'active'),
      has_completed: catExpeditions.some((e) => e.status === 'completed'),
    }
  })

  const coverage = computeCoverage({
    lessons: (recentLessons.data || []) as never,
    evidence: (evidence.data || []) as never,
    activityLogs: (logs.data || []) as never,
  })

  const yearMap = computeYearMap({
    lessons: (recentLessons.data || []) as never,
    evidence: (evidence.data || []) as never,
    activityLogs: (logs.data || []) as never,
  })

  const { data: skills } = await supabase
    .from('le_skill_progress')
    .select('*')
    .eq('student_id', studentId)

  const ledger = buildLedgerWeather({
    stateCode: student?.state_code,
    gradeLevel: student?.grade_level,
    yearArc: (yearArc.data as LeYearArc | null) || null,
    skills: (skills || []) as LeSkillProgress[],
    coverage,
  })

  const unvisited = (mapItems.data || []).filter((i) => i.status === 'unvisited')
  const suggestions = [
    ...(wonders.data || []).slice(0, 3).map((w) => ({
      kind: 'wonder' as const,
      label: `Open Wonder: "${w.statement}" — a whole expedition could grow from this`,
    })),
    ...unvisited.slice(0, 3).map((i) => ({
      kind: 'world' as const,
      label: `[${i.cluster}] ${i.name} is still waiting on the World Map`,
    })),
  ]

  const world_map = WORLD_CLUSTERS.map((cluster) => ({
    ...cluster,
    items: (mapItems.data || []).filter((i) => i.cluster === cluster.key),
  }))

  // On-track sentence — assembled here so every surface says the same thing.
  const skillRows = (skills || []) as LeSkillProgress[]
  const readingRung = currentLadderPosition(READING_LADDER, skillRows, student?.grade_level)
  const mathRung = currentLadderPosition(MATH_LADDER, skillRows, student?.grade_level)
  const writingRung = currentLadderPosition(WRITING_LADDER, skillRows, student?.grade_level)
  const llFocus = weeklyLifeLearningFocus(skillRows)
  const compassStories = skillRows.filter(
    (s) => s.subject === 'life_learning' && s.skill.startsWith('compass-') && s.status === 'secure'
  ).length
  const greenCount = coverage.filter((c) => c.level === 'green').length
  const yearMapGreen = yearMap.filter((s) => s.level !== 'untouched').length
  const on_track = [
    greenCount === coverage.length
      ? 'Subjects are green.'
      : `${greenCount} of ${coverage.length} subjects are green this month.`,
    `Reading is on ${readingRung.current_rung.label.toLowerCase()}.`,
    `Math is on ${mathRung.current_rung.label.toLowerCase()}.`,
    `Writing is on ${writingRung.current_rung.label.toLowerCase()}.`,
    `Sight words: quarter ${schoolQuarter()} rotating.`,
    `This week's Life Learning focus: ${llFocus.resource.name}.`,
    `Big Ideas met: ${yearMapGreen} of ${yearMap.length}.`,
    `Compass: ${compassStories} of 12 slices have a story.`,
  ].join(' ')

  return NextResponse.json({
    student,
    state_profile: stateProfile(student?.state_code),
    world_map,
    year_map: yearMap,
    on_track,
    year_arc: yearArc.data || null,
    ledger,
    expeditions: expeditions.data || [],
    categories,
    coverage,
    suggestions,
  })
}
