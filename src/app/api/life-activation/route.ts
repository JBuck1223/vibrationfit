import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  ensureProgress,
  loadSeed,
  markOnboardingStep,
  markTrainingStep,
  normalizeProgress,
} from '@/lib/life-activation/progress'
import { recordLifeActivationEvent } from '@/lib/life-activation/events'
import type { OnboardingStepId } from '@/lib/life-activation/steps'
import { firstIncompleteTraining, ONBOARDING_STEP_IDS } from '@/lib/life-activation/steps'
import { isTrainingCompletionId } from '@/lib/life-activation/walkthroughs'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const seed = await loadSeed(supabase, user.id)
    const { data: existing } = await supabase
      .from('life_activation_progress')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    return NextResponse.json({
      progress: existing ? normalizeProgress(existing) : null,
      seed,
    })
  } catch (error) {
    console.error('[life-activation GET]', error)
    return NextResponse.json({ error: 'Failed to load Life Activation' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const action = typeof body.action === 'string' ? body.action : ''

    if (action === 'start') {
      await ensureProgress(supabase, user.id)
      const progress = await markOnboardingStep(supabase, user.id, 'welcome')
      const seed = await loadSeed(supabase, user.id)
      return NextResponse.json({ progress, seed })
    }

    if (action === 'complete_onboarding_step') {
      const step = body.step as OnboardingStepId
      if (!ONBOARDING_STEP_IDS.includes(step)) {
        return NextResponse.json({ error: 'Invalid step' }, { status: 400 })
      }
      const progress = await markOnboardingStep(supabase, user.id, step, {
        draft_vision_id: body.draft_vision_id ?? undefined,
        active_vision_id: body.active_vision_id ?? undefined,
        kit_run_id: body.kit_run_id ?? undefined,
      })
      const seed = await loadSeed(supabase, user.id)
      return NextResponse.json({ progress, seed })
    }

    if (action === 'complete_training_step') {
      const step = typeof body.step === 'string' ? body.step : ''
      if (!isTrainingCompletionId(step)) {
        return NextResponse.json({ error: 'Invalid step' }, { status: 400 })
      }
      const progress = await markTrainingStep(supabase, user.id, step)
      const seed = await loadSeed(supabase, user.id)
      return NextResponse.json({ progress, seed })
    }

    if (action === 'start_training') {
      const progress = await ensureProgress(supabase, user.id)
      const now = new Date().toISOString()
      const startedNow = !progress.training_started_at
      const { data, error } = await supabase
        .from('life_activation_progress')
        .update({
          training_step: firstIncompleteTraining(progress.training),
          training_started_at: progress.training_started_at || now,
          training_dismissed_at: null,
          updated_at: now,
        })
        .eq('id', progress.id)
        .select('*')
        .single()
      if (error || !data) {
        return NextResponse.json({ error: 'Failed to start training' }, { status: 500 })
      }
      if (startedNow) {
        await recordLifeActivationEvent(supabase, {
          eventType: 'platform_training_started',
          userId: user.id,
        })
      }
      const seed = await loadSeed(supabase, user.id)
      return NextResponse.json({ progress: normalizeProgress(data), seed })
    }

    if (action === 'dismiss_training') {
      const progress = await ensureProgress(supabase, user.id)
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from('life_activation_progress')
        .update({ training_dismissed_at: now, updated_at: now })
        .eq('id', progress.id)
        .select('*')
        .single()
      if (error || !data) {
        return NextResponse.json({ error: 'Failed to dismiss training' }, { status: 500 })
      }
      const seed = await loadSeed(supabase, user.id)
      return NextResponse.json({ progress: { ...progress, training_dismissed_at: now }, seed })
    }

    if (action === 'save_name') {
      const firstName = typeof body.first_name === 'string' ? body.first_name.trim() : ''
      if (!firstName) {
        return NextResponse.json({ error: 'First name required' }, { status: 400 })
      }
      await supabase.from('user_accounts').update({ first_name: firstName }).eq('id', user.id)
      const seed = await loadSeed(supabase, user.id)
      const progress = await ensureProgress(supabase, user.id)
      return NextResponse.json({ progress, seed })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('[life-activation PATCH]', error)
    return NextResponse.json({ error: 'Failed to update Life Activation' }, { status: 500 })
  }
}
