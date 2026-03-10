import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, isUserAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const STEP_CHECKLIST_KEYS = [
  { step: 1, name: 'Account Settings', key: null },
  { step: 2, name: 'Baseline Intake', key: 'intake_completed' },
  { step: 3, name: 'Create Profile', key: 'profile_completed' },
  { step: 4, name: 'Vibration Assessment', key: 'assessment_completed' },
  { step: 5, name: 'Build Vision', key: 'vision_built' },
  { step: 6, name: 'Refine Vision', key: 'vision_refined' },
  { step: 7, name: 'Generate Audio', key: 'audio_generated' },
  { step: 8, name: 'Record Voice', key: 'voice_recording_completed' },
  { step: 9, name: 'Audio Mix', key: 'audios_generated' },
  { step: 10, name: 'Vision Board', key: 'vision_board_completed' },
  { step: 11, name: 'First Journal', key: 'first_journal_entry' },
  { step: 12, name: 'Book Call', key: 'call_scheduled' },
  { step: 13, name: 'Activation Plan', key: 'activation_protocol_completed' },
  { step: 14, name: 'Full Unlock', key: 'unlock_completed' },
]

function getCurrentStep(checklist: Record<string, unknown>): { stepNumber: number; stepName: string } {
  if (checklist.status === 'completed') {
    return { stepNumber: 15, stepName: 'Completed' }
  }
  if (!checklist.started_at) {
    return { stepNumber: 0, stepName: 'Not Started' }
  }

  for (const step of STEP_CHECKLIST_KEYS) {
    if (!step.key) continue
    if (!checklist[step.key]) {
      return { stepNumber: step.step, stepName: step.name }
    }
  }

  return { stepNumber: 15, stepName: 'Completed' }
}

function getCompletedStepCount(checklist: Record<string, unknown>): number {
  let count = 0
  if (checklist.started_at) count++
  for (const step of STEP_CHECKLIST_KEYS) {
    if (!step.key) continue
    if (checklist[step.key]) count++
  }
  return count
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!isUserAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')
    const stepFilter = searchParams.get('step')

    const adminClient = createAdminClient()

    let query = adminClient
      .from('intensive_checklist')
      .select('*')
      .order('created_at', { ascending: false })

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data: checklists, error: checklistsError } = await query

    if (checklistsError) {
      console.error('Error fetching checklists:', checklistsError)
      return NextResponse.json({ error: 'Failed to fetch intensive data' }, { status: 500 })
    }

    if (!checklists || checklists.length === 0) {
      return NextResponse.json({
        enrollments: [],
        stepBreakdown: [],
        totals: { enrolled: 0, pending: 0, in_progress: 0, completed: 0 },
        steps: STEP_CHECKLIST_KEYS,
      })
    }

    const userIds = [...new Set(checklists.map(c => c.user_id))]
    const { data: accounts } = await adminClient
      .from('user_accounts')
      .select('id, email, full_name, first_name, last_name')
      .in('id', userIds)

    const accountMap = Object.fromEntries(
      (accounts || []).map(a => [a.id, a])
    )

    let enrollments = checklists.map(checklist => {
      const account = accountMap[checklist.user_id]
      const { stepNumber, stepName } = getCurrentStep(checklist)
      const completedSteps = getCompletedStepCount(checklist)

      return {
        id: checklist.id,
        user_id: checklist.user_id,
        intensive_id: checklist.intensive_id,
        email: account?.email || null,
        full_name: account?.full_name || account?.first_name || null,
        status: checklist.status,
        current_step_number: stepNumber,
        current_step_name: stepName,
        completed_steps: completedSteps,
        total_steps: 14,
        progress_pct: Math.round((completedSteps / 14) * 100),
        started_at: checklist.started_at,
        completed_at: checklist.completed_at,
        created_at: checklist.created_at,
        updated_at: checklist.updated_at,
      }
    })

    if (stepFilter && stepFilter !== 'all') {
      const stepNum = parseInt(stepFilter)
      enrollments = enrollments.filter(e => e.current_step_number === stepNum)
    }

    // Step breakdown for the chart
    const stepCounts: Record<number, number> = {}
    for (const e of checklists.map(c => getCurrentStep(c))) {
      stepCounts[e.stepNumber] = (stepCounts[e.stepNumber] || 0) + 1
    }

    const stepBreakdown = [
      { step: 0, name: 'Not Started', count: stepCounts[0] || 0 },
      ...STEP_CHECKLIST_KEYS.map(s => ({
        step: s.step,
        name: s.name,
        count: stepCounts[s.step] || 0,
      })),
      { step: 15, name: 'Completed', count: stepCounts[15] || 0 },
    ]

    const totals = {
      enrolled: checklists.length,
      pending: checklists.filter(c => c.status === 'pending').length,
      in_progress: checklists.filter(c => c.status === 'in_progress').length,
      completed: checklists.filter(c => c.status === 'completed').length,
    }

    return NextResponse.json({
      enrollments,
      stepBreakdown,
      totals,
      steps: STEP_CHECKLIST_KEYS,
    })
  } catch (error: unknown) {
    console.error('Error in intensive dashboard API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
