import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createAdminClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

const STEP_DEFINITIONS = [
  { step: 0, name: 'Start Intensive', checklistField: 'started_at' },
  { step: 1, name: 'Account Settings', checklistField: null },
  { step: 2, name: 'Baseline Intake', checklistField: 'intake_completed' },
  { step: 3, name: 'Profile', checklistField: 'profile_completed' },
  { step: 4, name: 'Build Vision', checklistField: 'vision_built' },
  { step: 5, name: 'Generate Audio', checklistField: 'audio_generated' },
  { step: 6, name: 'Record Voice', checklistField: 'voice_recording_completed' },
  { step: 7, name: 'Audio Mix', checklistField: 'audios_generated' },
  { step: 8, name: 'Vision Board', checklistField: 'vision_board_completed' },
  { step: 9, name: 'Journal', checklistField: 'first_journal_entry' },
  { step: 10, name: 'First Vibe Tribe Post', checklistField: 'first_vibe_post' },
  { step: 11, name: 'Engage in Vibe Tribe', checklistField: 'vibe_engagement' },
  { step: 12, name: 'Alignment Gym Tour', checklistField: 'alignment_gym_toured' },
  { step: 13, name: 'My Activation Plan', checklistField: 'activation_protocol_completed' },
  { step: 14, name: 'Unlock Platform', checklistField: 'unlock_completed' },
]

/** Checklist fields cleared when undoing from step N through 14 */
const CHECKLIST_CLEAR_FIELDS: Record<number, Record<string, null | false | string>> = {
  0: { started_at: null, status: 'pending' },
  2: { intake_completed: false, intake_completed_at: null },
  3: { profile_completed: false, profile_completed_at: null },
  4: { vision_built: false, vision_built_at: null },
  5: { audio_generated: false, audio_generated_at: null },
  6: {
    voice_recording_completed: false,
    voice_recording_completed_at: null,
    voice_recording_skipped: false,
    voice_recording_skipped_at: null,
  },
  7: { audios_generated: false, audios_generated_at: null },
  8: { vision_board_completed: false, vision_board_completed_at: null },
  9: { first_journal_entry: false, first_journal_entry_at: null },
  10: { first_vibe_post: false, first_vibe_post_at: null },
  11: { vibe_engagement: false, vibe_engagement_at: null },
  12: { alignment_gym_toured: false, alignment_gym_toured_at: null },
  13: { activation_protocol_completed: false, activation_protocol_completed_at: null },
  14: {
    unlock_completed: false,
    unlock_completed_at: null,
    status: 'in_progress',
    completed_at: null,
  },
}

function buildChecklistUndoUpdate(fromStep: number): Record<string, unknown> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (fromStep <= 0 && CHECKLIST_CLEAR_FIELDS[0]) {
    Object.assign(update, CHECKLIST_CLEAR_FIELDS[0])
  }

  // Step 1 uses user_accounts; checklist fields start at step 2
  const checklistFrom = fromStep <= 1 ? 2 : fromStep
  for (let step = checklistFrom; step <= 14; step++) {
    const fields = CHECKLIST_CLEAR_FIELDS[step]
    if (fields) {
      Object.assign(update, fields)
    }
  }

  if (fromStep > 0) {
    update.status = 'in_progress'
    update.completed_at = null
  }

  return update
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: adminAccount } = await supabase
      .from('user_accounts')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminAccount?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 })
    }

    const { userId, stepNumber } = await request.json()

    if (!userId || stepNumber === undefined) {
      return NextResponse.json({ error: 'userId and stepNumber are required' }, { status: 400 })
    }

    if (stepNumber < 0 || stepNumber > 14) {
      return NextResponse.json({ error: 'stepNumber must be between 0 and 14' }, { status: 400 })
    }

    const adminClient = getAdminClient()
    const now = new Date().toISOString()

    const { data: checklist, error: checklistError } = await adminClient
      .from('intensive_checklist')
      .select('id, status')
      .eq('user_id', userId)
      .in('status', ['pending', 'in_progress', 'completed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (checklistError || !checklist) {
      return NextResponse.json({ error: 'No intensive found for this user' }, { status: 404 })
    }

    const updateData = buildChecklistUndoUpdate(stepNumber)

    const { error: updateError } = await adminClient
      .from('intensive_checklist')
      .update(updateData)
      .eq('id', checklist.id)

    if (updateError) {
      throw new Error(updateError.message)
    }

    // Step 1: settings tracked on user_accounts, not checklist
    if (stepNumber <= 1) {
      await adminClient
        .from('user_accounts')
        .update({
          first_name: null,
          last_name: null,
          phone: null,
          updated_at: now,
        })
        .eq('id', userId)
    }

    const stepDef = STEP_DEFINITIONS[stepNumber]
    const cascadeNote =
      stepNumber < 14 ? ` and steps ${stepNumber + 1}–14` : ''

    return NextResponse.json({
      success: true,
      message: `Reset step ${stepNumber} (${stepDef.name})${cascadeNote}`,
      stepNumber,
      stepName: stepDef.name,
    })
  } catch (error) {
    console.error('Error undoing step:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
