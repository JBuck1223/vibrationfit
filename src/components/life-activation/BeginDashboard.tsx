'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Card } from '@/lib/design-system/components'
import { CommitVisionDialog } from '@/components/life-vision/CommitVisionDialog'
import { JourneyDashboard, type DashboardStep } from '@/components/life-activation/JourneyDashboard'
import { useLifeActivation } from '@/hooks/useLifeActivation'
import { LIFE_ACTIVATION_COPY } from '@/lib/life-activation/copy'
import {
  firstIncompleteOnboarding,
  ONBOARDING_PHASES,
  ONBOARDING_STEPS,
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

  const currentId = progress ? firstIncompleteOnboarding(progress.onboarding) : 'welcome'
  const kitReady = Boolean(progress?.onboarding.vision && progress?.active_vision_id)

  const steps: DashboardStep[] = ONBOARDING_STEPS.map((step) => ({
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
  }))

  const nextStep = steps.find((s) => s.id === currentId) || null
  const doneCount = steps.filter((s) => s.completed).length
  const progressPct = Math.round((doneCount / steps.length) * 100)

  const handleSkipKit = async () => {
    await completeOnboardingStep('kit')
    setKitOpen(false)
  }

  const handleContinue = async (step: DashboardStep) => {
    if (isUpdating) return

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
        title={LIFE_ACTIVATION_COPY.welcome.eyebrow}
        phases={ONBOARDING_PHASES}
        steps={steps}
        nextStep={nextStep}
        progressCopy={LIFE_ACTIVATION_COPY.dashboard.onboardingLine(progressPct)}
        loading={isLoading}
        continueDisabled={isUpdating}
        onContinue={handleContinue}
        extra={
          currentId === 'kit' && kitReady ? (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-white">{LIFE_ACTIVATION_COPY.kit.title}</h2>
              <p className="mt-2 text-sm text-neutral-300">{LIFE_ACTIVATION_COPY.kit.body}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="primary" onClick={() => setKitOpen(true)}>
                  {LIFE_ACTIVATION_COPY.kit.cta}
                </Button>
                <Button variant="ghost" onClick={handleSkipKit} disabled={isUpdating}>
                  {LIFE_ACTIVATION_COPY.kit.skip}
                </Button>
              </div>
            </Card>
          ) : null
        }
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
