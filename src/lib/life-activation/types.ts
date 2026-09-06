import type { OnboardingStepId, TrainingStepId } from './steps'

export interface LifeActivationSeed {
  activationId: string | null
  category: string | null
  categoryLabel: string | null
  visionStatement: string | null
  essence: string | null
  firstName: string | null
  needsFirstName: boolean
}

export interface LifeActivationProgress {
  id: string
  user_id: string
  source_activation_id: string | null
  draft_vision_id: string | null
  active_vision_id: string | null
  kit_run_id: string | null
  onboarding_step: OnboardingStepId
  onboarding: Record<string, string>
  onboarding_started_at: string | null
  onboarding_completed_at: string | null
  training_step: TrainingStepId | null
  training: Record<string, string>
  training_started_at: string | null
  training_completed_at: string | null
  training_dismissed_at: string | null
  intensive_checklist_id: string | null
  created_at: string
  updated_at: string
}

export interface LifeActivationPayload {
  progress: LifeActivationProgress | null
  seed: LifeActivationSeed
}

export type LifeActivationEventType =
  | 'life_activation_started'
  | 'life_vision_committed'
  | 'life_activation_started_community'
  | 'life_activation_completed'
  | 'platform_training_started'
  | 'platform_training_completed'
