import type { SupabaseClient } from '@supabase/supabase-js'
import {
  firstIncompleteOnboarding,
  firstIncompleteTraining,
  ONBOARDING_STEP_IDS,
  TRAINING_STEP_IDS,
  type OnboardingStepId,
  type TrainingStepId,
} from './steps'
import { recordLifeActivationEvent } from './events'
import type { LifeActivationProgress, LifeActivationSeed } from './types'
import { getVisionCategoryLabel, type VisionCategoryKey } from '@/lib/design-system/vision-categories'

type JsonMap = Record<string, string>

function asMap(value: unknown): JsonMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const out: JsonMap = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === 'string' && v) out[k] = v
  }
  return out
}

export function normalizeProgress(row: Record<string, unknown>): LifeActivationProgress {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    source_activation_id: (row.source_activation_id as string) || null,
    draft_vision_id: (row.draft_vision_id as string) || null,
    active_vision_id: (row.active_vision_id as string) || null,
    kit_run_id: (row.kit_run_id as string) || null,
    onboarding_step: (row.onboarding_step as OnboardingStepId) || 'welcome',
    onboarding: asMap(row.onboarding),
    onboarding_started_at: (row.onboarding_started_at as string) || null,
    onboarding_completed_at: (row.onboarding_completed_at as string) || null,
    training_step: (row.training_step as TrainingStepId) || null,
    training: asMap(row.training),
    training_started_at: (row.training_started_at as string) || null,
    training_completed_at: (row.training_completed_at as string) || null,
    training_dismissed_at: (row.training_dismissed_at as string) || null,
    intensive_checklist_id: (row.intensive_checklist_id as string) || null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }
}

export async function loadSeed(
  supabase: SupabaseClient,
  userId: string,
): Promise<LifeActivationSeed> {
  const [{ data: account }, { data: activation }] = await Promise.all([
    supabase
      .from('user_accounts')
      .select('first_name')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('activations')
      .select('id, category, vision_statement, essence, entered_at, ready_at, created_at')
      .eq('user_id', userId)
      .order('entered_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const firstName = account?.first_name?.trim() || null
  const category = activation?.category || null

  return {
    activationId: activation?.id || null,
    category,
    categoryLabel: category
      ? getVisionCategoryLabel(category as VisionCategoryKey)
      : null,
    visionStatement: activation?.vision_statement || null,
    essence: activation?.essence || null,
    firstName,
    needsFirstName: !firstName,
  }
}

interface IntensiveRow {
  id: string
  started_at: string | null
  intake_completed?: boolean
  profile_completed?: boolean
  vision_built?: boolean
  audio_generated?: boolean
  audios_generated?: boolean
  vision_board_completed?: boolean
  first_journal_entry?: boolean
  first_vibe_post?: boolean
  vibe_engagement?: boolean
  alignment_gym_toured?: boolean
  activation_protocol_completed?: boolean
  unlock_completed?: boolean
}

export function mapIntensiveToOnboarding(intensive: IntensiveRow): JsonMap {
  const now = new Date().toISOString()
  const onboarding: JsonMap = {}
  if (intensive.started_at) onboarding.welcome = intensive.started_at
  if (intensive.vision_built) onboarding.vision = now
  if (intensive.audio_generated || intensive.audios_generated) onboarding.kit = now
  if (intensive.first_vibe_post) onboarding.tribe = now
  if (intensive.alignment_gym_toured) onboarding.gym = now
  if (intensive.unlock_completed) {
    onboarding.welcome = onboarding.welcome || now
    onboarding.vision = onboarding.vision || now
    onboarding.kit = onboarding.kit || now
    onboarding.tribe = onboarding.tribe || now
    onboarding.gym = onboarding.gym || now
    onboarding.complete = now
  }
  return onboarding
}

export function mapIntensiveToTraining(intensive: IntensiveRow): JsonMap {
  const now = new Date().toISOString()
  const training: JsonMap = {}
  if (intensive.profile_completed) training.profile = now
  if (intensive.intake_completed) training.intake = now
  if (intensive.first_journal_entry) training.journal = now
  if (intensive.vision_board_completed) training.manifestations = now
  if (intensive.activation_protocol_completed) training.map = now
  return training
}

export async function ensureProgress(
  supabase: SupabaseClient,
  userId: string,
): Promise<LifeActivationProgress> {
  const { data: existing } = await supabase
    .from('life_activation_progress')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) return normalizeProgress(existing)

  const seed = await loadSeed(supabase, userId)

  const { data: intensive } = await supabase
    .from('intensive_checklist')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: activeVision } = await supabase
    .from('vision_versions')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .eq('is_draft', false)
    .is('household_id', null)
    .maybeSingle()

  const { data: draftVision } = await supabase
    .from('vision_versions')
    .select('id')
    .eq('user_id', userId)
    .eq('is_draft', true)
    .eq('is_active', false)
    .is('household_id', null)
    .maybeSingle()

  const onboarding = intensive ? mapIntensiveToOnboarding(intensive as IntensiveRow) : {}
  const training = intensive ? mapIntensiveToTraining(intensive as IntensiveRow) : {}

  if (activeVision?.id && !onboarding.vision) {
    onboarding.vision = new Date().toISOString()
  }

  const onboardingStep = firstIncompleteOnboarding(onboarding)
  const trainingStarted = Object.keys(training).length > 0
  const trainingStep = trainingStarted ? firstIncompleteTraining(training) : null
  const now = new Date().toISOString()

  const insert = {
    user_id: userId,
    source_activation_id: seed.activationId,
    draft_vision_id: draftVision?.id || null,
    active_vision_id: activeVision?.id || null,
    onboarding_step: onboardingStep,
    onboarding,
    onboarding_started_at: onboarding.welcome ? (intensive?.started_at as string | null) || now : null,
    onboarding_completed_at: onboarding.complete || null,
    training_step: trainingStep,
    training,
    training_started_at: trainingStarted ? now : null,
    intensive_checklist_id: intensive?.id || null,
  }

  const { data: created, error } = await supabase
    .from('life_activation_progress')
    .insert(insert)
    .select('*')
    .single()

  if (error || !created) {
    const { data: raced } = await supabase
      .from('life_activation_progress')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (raced) return normalizeProgress(raced)
    throw new Error(error?.message || 'Failed to start Life Activation')
  }

  return normalizeProgress(created)
}

export async function markOnboardingStep(
  supabase: SupabaseClient,
  userId: string,
  step: OnboardingStepId,
  extra?: Partial<{
    draft_vision_id: string | null
    active_vision_id: string | null
    kit_run_id: string | null
    source_activation_id: string | null
  }>,
): Promise<LifeActivationProgress> {
  const progress = await ensureProgress(supabase, userId)
  const now = new Date().toISOString()
  const onboarding = { ...progress.onboarding, [step]: progress.onboarding[step] || now }
  const onboarding_step = firstIncompleteOnboarding(onboarding)
  const completed = Boolean(onboarding.complete) || ONBOARDING_STEP_IDS.every((id) => onboarding[id] || id === 'complete')
  if (completed && !onboarding.complete) onboarding.complete = now

  const { data, error } = await supabase
    .from('life_activation_progress')
    .update({
      onboarding,
      onboarding_step: completed ? 'complete' : onboarding_step,
      onboarding_started_at: progress.onboarding_started_at || now,
      onboarding_completed_at: completed ? progress.onboarding_completed_at || now : null,
      updated_at: now,
      ...extra,
    })
    .eq('id', progress.id)
    .select('*')
    .single()

  if (error || !data) throw new Error(error?.message || 'Failed to update onboarding')

  if (step === 'welcome' && !progress.onboarding.welcome) {
    await recordLifeActivationEvent(supabase, {
      eventType: 'life_activation_started',
      userId,
      eventData: { source_activation_id: progress.source_activation_id },
    })
  }
  if (step === 'vision') {
    await recordLifeActivationEvent(supabase, {
      eventType: 'life_vision_committed',
      userId,
      eventData: { vision_id: extra?.active_vision_id || progress.active_vision_id },
    })
  }
  if (step === 'tribe' && !progress.onboarding.tribe) {
    await recordLifeActivationEvent(supabase, {
      eventType: 'life_activation_started_community',
      userId,
    })
  }
  if ((step === 'complete' || completed) && !progress.onboarding_completed_at) {
    await recordLifeActivationEvent(supabase, {
      eventType: 'life_activation_completed',
      userId,
    })
  }

  return normalizeProgress(data)
}

export async function markTrainingStep(
  supabase: SupabaseClient,
  userId: string,
  step: TrainingStepId,
): Promise<LifeActivationProgress> {
  const progress = await ensureProgress(supabase, userId)
  const now = new Date().toISOString()
  const training = { ...progress.training, [step]: progress.training[step] || now }
  const training_step = firstIncompleteTraining(training)
  const completed = Boolean(training.complete) || TRAINING_STEP_IDS.every((id) => training[id] || id === 'complete')
  if (completed && !training.complete) training.complete = now
  const startedNow = !progress.training_started_at

  const { data, error } = await supabase
    .from('life_activation_progress')
    .update({
      training,
      training_step: completed ? 'complete' : training_step,
      training_started_at: progress.training_started_at || now,
      training_completed_at: completed ? progress.training_completed_at || now : null,
      updated_at: now,
    })
    .eq('id', progress.id)
    .select('*')
    .single()

  if (error || !data) throw new Error(error?.message || 'Failed to update training')

  if (startedNow) {
    await recordLifeActivationEvent(supabase, {
      eventType: 'platform_training_started',
      userId,
      eventData: { step },
    })
  }
  if ((step === 'complete' || completed) && !progress.training_completed_at) {
    await recordLifeActivationEvent(supabase, {
      eventType: 'platform_training_completed',
      userId,
    })
  }

  return normalizeProgress(data)
}
