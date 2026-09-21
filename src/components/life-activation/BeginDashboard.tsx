'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CommitVisionDialog } from '@/components/life-vision/CommitVisionDialog'
import { JourneyDashboard, type DashboardStep } from '@/components/life-activation/JourneyDashboard'
import { RosterConfirmCard } from '@/components/roster/RosterConfirmCard'
import { useLifeActivation } from '@/hooks/useLifeActivation'
import { LIFE_ACTIVATION_COPY } from '@/lib/life-activation/copy'
import {
  ONBOARDING_PHASES,
  ONBOARDING_STEPS,
  withSequentialLocks,
  type OnboardingStepId,
} from '@/lib/life-activation/steps'

export function BeginDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    progress,
    isLoading,
    isUpdating,
    completeOnboardingStep,
  } = useLifeActivation()
  const [kitOpen, setKitOpen] = useState(searchParams.get('step') === 'kit')

  const kitReady = Boolean(progress?.onboarding.vision && progress?.active_vision_id)

  const steps: DashboardStep[] = withSequentialLocks(
    ONBOARDING_STEPS.map((step) => ({
      id: step.id,
      stepNumber: step.number,
      title: step.title,
      description: step.description,
      phase: step.phase,
      completed: Boolean(progress?.onboarding[step.id]),
      completedAt: progress?.onboarding[step.id] || null,
      href: step.href,
      viewHref: step.viewHref,
      actionLabel: step.actionLabel,
      canSkip: step.canSkip,
    })),
  )

  const nextStep = steps.find((s) => !s.completed && !s.locked) || null

  const handleSkipKit = async () => {
    await completeOnboardingStep('kit')
    setKitOpen(false)
  }

  const handleContinue = async (step: DashboardStep) => {
    if (isUpdating || step.locked) return

    try {
      if (step.id === 'kit') {
        if (kitReady || progress?.active_vision_id) {
          setKitOpen(true)
          return
        }
        router.push('/life-vision/begin')
        return
      }

      router.push(step.completed ? step.viewHref : step.href)
    } catch (error) {
      console.error('[begin] continue failed', error)
    }
  }

  return (
    <>
      <JourneyDashboard
        title={LIFE_ACTIVATION_COPY.sidebar.onboardingTitle}
        phases={ONBOARDING_PHASES}
        steps={steps}
        nextStep={nextStep}
        progressCopy={LIFE_ACTIVATION_COPY.dashboard.onboardingLead(nextStep?.id ?? null)}
        loading={isLoading}
        continueDisabled={isUpdating}
        onContinue={handleContinue}
        onSkip={nextStep?.id === 'kit' ? () => handleSkipKit() : undefined}
        extra={progress?.onboarding.vision ? <RosterConfirmCard /> : null}
      />

      {progress?.active_vision_id && (
        <CommitVisionDialog
          isOpen={kitOpen}
          onClose={() => setKitOpen(false)}
          kitOnlyVisionId={progress.active_vision_id}
          onCommitted={async () => {
            await completeOnboardingStep('kit')
            setKitOpen(false)
            router.push('/vibe-tribe')
          }}
        />
      )}
    </>
  )
}

export function isOnboardingStep(id: string): id is OnboardingStepId {
  return ONBOARDING_STEPS.some((s) => s.id === id)
}
