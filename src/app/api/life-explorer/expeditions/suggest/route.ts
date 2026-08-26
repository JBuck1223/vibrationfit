import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveStudent } from '@/lib/life-explorer/context'
import { parseJsonObject, vivaComplete } from '@/lib/life-explorer/viva-complete'
import { profileSummaryForPrompt } from '@/lib/life-explorer/life-profile'
import { computeYearMap, untouchedIdeas } from '@/lib/life-explorer/year-map'
import {
  EXPEDITION_SUGGEST_SYSTEM_PROMPT,
  buildExpeditionSuggestPrompt,
} from '@/lib/viva/prompts/life-explorer-compose'
import type { WorldCluster } from '@/lib/life-explorer/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export interface ExpeditionSuggestionCard {
  kind: 'comfort' | 'stretch' | 'unknown'
  title: string
  hook: string
  why_this_matters: string
  cluster: WorldCluster
}

// POST /api/life-explorer/expeditions/suggest — the rule of three:
// one comfort, one stretch, one required unknown. The child chooses.
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const student = await getActiveStudent(supabase, body.student_id)
  if (!student) return NextResponse.json({ error: 'No active student' }, { status: 400 })

  const yearStart = new Date()
  yearStart.setMonth(yearStart.getMonth() - 10)

  const [profileRes, wondersRes, mapRes, expeditionsRes, lessonsRes, evidenceRes, logsRes] =
    await Promise.all([
      supabase.from('le_student_profiles').select('*').eq('student_id', student.id).maybeSingle(),
      supabase
        .from('le_wonder_items')
        .select('statement')
        .eq('kind', 'wonder')
        .neq('status', 'answered')
        .order('interest_level', { ascending: false })
        .limit(8),
      supabase
        .from('le_world_map_items')
        .select('cluster, name, status')
        .eq('student_id', student.id),
      supabase
        .from('le_expeditions')
        .select('title')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('le_lessons')
        .select('payload, created_at, status')
        .eq('student_id', student.id)
        .gte('created_at', yearStart.toISOString()),
      supabase
        .from('le_learning_evidence')
        .select('academic_tags, created_at')
        .eq('student_id', student.id)
        .gte('created_at', yearStart.toISOString()),
      supabase
        .from('le_activity_logs')
        .select('subjects, entry_date')
        .eq('student_id', student.id)
        .gte('entry_date', yearStart.toISOString().slice(0, 10)),
    ])

  const yearMap = computeYearMap({
    lessons: lessonsRes.data || [],
    evidence: evidenceRes.data || [],
    activityLogs: logsRes.data || [],
  })

  const { text } = await vivaComplete({
    supabase,
    userId: user.id,
    system: EXPEDITION_SUGGEST_SYSTEM_PROMPT,
    user: buildExpeditionSuggestPrompt({
      studentName: student.name,
      gradeLevel: student.grade_level,
      lifeIChoose: student.life_i_choose || null,
      profileSummary: profileSummaryForPrompt(profileRes.data),
      interests: student.interests || [],
      openWonders: (wondersRes.data || []).map((w) => w.statement),
      mapTastes: mapRes.data || [],
      untouchedBigIdeas: untouchedIdeas(yearMap).map((i) => ({
        prompt: i.kid_prompt,
        hint: i.weave_hint,
      })),
      recentExpeditions: (expeditionsRes.data || []).map((e) => e.title),
    }),
    actionType: 'life_explorer_compose',
    maxTokens: 1500,
    temperature: 0.8,
    metadata: { kind: 'expedition_suggest', student_id: student.id },
  })

  const parsed = parseJsonObject<{ cards: ExpeditionSuggestionCard[] }>(text)
  const cards = (parsed.cards || []).slice(0, 3)
  if (cards.length !== 3) {
    return NextResponse.json({ error: 'VIVA could not offer three worlds — try again' }, { status: 502 })
  }

  return NextResponse.json({ cards })
}
