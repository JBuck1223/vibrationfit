/**
 * Step Mapping Utility for the 12-Step Intensive Journey
 * 
 * Maps step IDs to display names, hrefs, and navigation info
 * for consistent messaging across all intensive step pages.
 */

import { IntensiveStepType } from './checklist'

export interface IntensiveStepInfo {
  id: string
  stepNumber: number
  title: string                      // Display name for the step
  checklistKey: IntensiveStepType | null  // Key in intensive_checklist table (null for settings)
  completedAtKey: string | null      // Key for completion timestamp (null for settings)
  href: string                       // URL to start/do the step
  viewHref: string                   // URL to view completed step
  nextStepId: string | null          // ID of the next step (null for final step)
  phase: string                      // Phase grouping
}

/**
 * All 12 steps of the Activation Intensive, in order
 */
export const INTENSIVE_STEPS: Record<string, IntensiveStepInfo> = {
  // Phase 1: Setup (Steps 1-2)
  settings: {
    id: 'settings',
    stepNumber: 1,
    title: 'Account Settings',
    checklistKey: null,
    completedAtKey: null,
    href: '/intensive/account/settings',
    viewHref: '/intensive/account/settings',
    nextStepId: 'intake',
    phase: 'Setup'
  },
  intake: {
    id: 'intake',
    stepNumber: 2,
    title: 'Baseline Intake',
    checklistKey: 'intake_completed',
    completedAtKey: 'intake_completed_at',
    href: '/intensive/intake',
    viewHref: '/intensive/intake',
    nextStepId: 'profile',
    phase: 'Setup'
  },

  // Phase 2: Foundation (Steps 3-4)
  profile: {
    id: 'profile',
    stepNumber: 3,
    title: 'Create Your Profile',
    checklistKey: 'profile_completed',
    completedAtKey: 'profile_completed_at',
    href: '/intensive/profile/new',
    viewHref: '/intensive/profile/new',
    nextStepId: 'assessment',
    phase: 'Foundation'
  },
  assessment: {
    id: 'assessment',
    stepNumber: 4,
    title: 'Vibration Assessment',
    checklistKey: 'assessment_completed',
    completedAtKey: 'assessment_completed_at',
    href: '/intensive/assessment/new',
    viewHref: '/intensive/assessment/new',
    nextStepId: 'build_vision',
    phase: 'Foundation'
  },

  // Phase 3: Vision Creation (Step 5)
  build_vision: {
    id: 'build_vision',
    stepNumber: 5,
    title: 'Create Your Life Vision',
    checklistKey: 'vision_built',
    completedAtKey: 'vision_built_at',
    href: '/intensive/life-vision/create',
    viewHref: '/intensive/life-vision/create',
    nextStepId: 'generate_audio',
    phase: 'Vision Creation'
  },

  // Phase 4: Audio (Steps 6-8)
  generate_audio: {
    id: 'generate_audio',
    stepNumber: 6,
    title: 'Generate Vision Audio',
    checklistKey: 'audio_generated',
    completedAtKey: 'audio_generated_at',
    href: '/intensive/audio/generate',
    viewHref: '/intensive/audio/generate',
    nextStepId: 'record_audio',
    phase: 'Audio'
  },
  record_audio: {
    id: 'record_audio',
    stepNumber: 7,
    title: 'Record Your Voice',
    checklistKey: 'audio_generated',
    completedAtKey: 'audio_generated_at',
    href: '/intensive/audio/record',
    viewHref: '/intensive/audio/record',
    nextStepId: 'mix_audio',
    phase: 'Audio'
  },
  mix_audio: {
    id: 'mix_audio',
    stepNumber: 8,
    title: 'Create Audio Mix',
    checklistKey: 'audios_generated',
    completedAtKey: 'audios_generated_at',
    href: '/intensive/audio/mix',
    viewHref: '/intensive/audio/mix',
    nextStepId: 'vision_board',
    phase: 'Audio'
  },

  // Phase 5: Activation (Steps 9-10)
  vision_board: {
    id: 'vision_board',
    stepNumber: 9,
    title: 'Create Vision Board',
    checklistKey: 'vision_board_completed',
    completedAtKey: 'vision_board_completed_at',
    href: '/intensive/vision-board/about',
    viewHref: '/intensive/vision-board/about',
    nextStepId: 'journal',
    phase: 'Activation'
  },
  journal: {
    id: 'journal',
    stepNumber: 10,
    title: 'First Journal Entry',
    checklistKey: 'first_journal_entry',
    completedAtKey: 'first_journal_entry_at',
    href: '/intensive/journal/about',
    viewHref: '/intensive/journal/about',
    nextStepId: 'activation_protocol',
    phase: 'Activation'
  },

  // Phase 6: Completion (Steps 11-12)
  activation_protocol: {
    id: 'activation_protocol',
    stepNumber: 11,
    title: 'My Activation Plan',
    checklistKey: 'activation_protocol_completed',
    completedAtKey: 'activation_protocol_completed_at',
    href: '/intensive/map',
    viewHref: '/intensive/map',
    nextStepId: 'unlock',
    phase: 'Completion'
  },
  unlock: {
    id: 'unlock',
    stepNumber: 12,
    title: 'Full Platform Unlock',
    checklistKey: 'unlock_completed',
    completedAtKey: 'unlock_completed_at',
    href: '/intensive/unlock',
    viewHref: '/dashboard',
    nextStepId: null,
    phase: 'Completion'
  }
}

/**
 * Get step info by step ID
 */
export function getStepInfo(stepId: string): IntensiveStepInfo | null {
  return INTENSIVE_STEPS[stepId] || null
}

/**
 * Get the next step info after a given step
 */
export function getNextStep(currentStepId: string): IntensiveStepInfo | null {
  const currentStep = INTENSIVE_STEPS[currentStepId]
  if (!currentStep || !currentStep.nextStepId) return null
  return INTENSIVE_STEPS[currentStep.nextStepId] || null
}

/**
 * Get step info by checklist key
 */
export function getStepByChecklistKey(key: IntensiveStepType): IntensiveStepInfo | null {
  return Object.values(INTENSIVE_STEPS).find(step => step.checklistKey === key) || null
}

/**
 * Get ordered array of all steps
 */
export function getStepsInOrder(): IntensiveStepInfo[] {
  return Object.values(INTENSIVE_STEPS).sort((a, b) => a.stepNumber - b.stepNumber)
}

/**
 * Helper to get the step title and next step info for banner display
 */
export function getStepBannerInfo(currentStepId: string): {
  currentStepName: string
  nextStepName: string | null
  nextStepHref: string | null
} {
  const currentStep = getStepInfo(currentStepId)
  const nextStep = currentStep ? getNextStep(currentStepId) : null

  return {
    currentStepName: currentStep?.title || 'This step',
    nextStepName: nextStep?.title || null,
    nextStepHref: nextStep?.href || null
  }
}
