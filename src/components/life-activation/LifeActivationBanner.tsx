'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/lib/design-system/components'
import { useLifeActivation } from '@/hooks/useLifeActivation'
import { LIFE_ACTIVATION_COPY } from '@/lib/life-activation/copy'
import {
  firstIncompleteOnboarding,
  firstIncompleteTraining,
  getOnboardingStep,
  getTrainingStep,
  nextOnboardingStep,
  nextTrainingStep,
  type OnboardingStepId,
  type TrainingStepId,
} from '@/lib/life-activation/steps'

export function LifeActivationBanner({
  onboardingStep,
  trainingStep,
  title,
  body,
  doneLabel,
}: {
  onboardingStep?: OnboardingStepId
  trainingStep?: TrainingStepId
  title: string
  body: string
  doneLabel?: string
}) {
  const router = useRouter()
  const { progress, completeOnboardingStep, completeTrainingStep, isUpdating } = useLifeActivation()

  if (!progress) return null

  if (onboardingStep) {
    if (progress.onboarding_completed_at) return null
    if (progress.onboarding[onboardingStep]) return null
    const current = firstIncompleteOnboarding(progress.onboarding)
    if (current !== onboardingStep && current !== 'welcome') {
      // Still show if they wandered to this step early
    }
  }

  if (trainingStep) {
    if (!progress.training_started_at || progress.training_completed_at) return null
    if (progress.training[trainingStep]) return null
  }

  const handleDone = async () => {
    if (onboardingStep) {
      await completeOnboardingStep(onboardingStep)
      const next = nextOnboardingStep(onboardingStep)
      if (next) router.push(getOnboardingStep(next).href)
      return
    }
    if (trainingStep) {
      await completeTrainingStep(trainingStep)
      const next = nextTrainingStep(trainingStep)
      if (next) router.push(getTrainingStep(next).href)
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-accent-500/30 bg-accent-500/10 p-4 md:p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-accent-300">
        {onboardingStep ? 'Life Activation' : 'Platform Training'}
      </p>
      <h2 className="mt-1 text-lg font-semibold text-white">{title}</h2>
      <p className="mt-1 text-sm text-neutral-300">{body}</p>
      <div className="mt-4">
        <Button size="sm" variant="primary" onClick={handleDone} disabled={isUpdating}>
          {doneLabel || LIFE_ACTIVATION_COPY.banner.markDone}
        </Button>
      </div>
    </div>
  )
}
