'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/lib/design-system/components'
import { JourneyDashboard, type DashboardStep } from '@/components/life-activation/JourneyDashboard'
import { useLifeActivation } from '@/hooks/useLifeActivation'
import { LIFE_ACTIVATION_COPY } from '@/lib/life-activation/copy'
import {
  firstIncompleteTraining,
  TRAINING_PHASES,
  TRAINING_STEPS,
} from '@/lib/life-activation/steps'

export default function BeginTrainingPage() {
  const router = useRouter()
  const { progress, isLoading, startTraining, dismissTraining, isUpdating } = useLifeActivation()

  const started = Boolean(progress?.training_started_at)
  const currentId = progress ? firstIncompleteTraining(progress.training) : 'profile'

  const steps: DashboardStep[] = TRAINING_STEPS.map((step) => ({
    id: step.id,
    stepNumber: step.number,
    title: step.title,
    description: step.description,
    phase: step.phase,
    completed: Boolean(progress?.training[step.id]),
    completedAt: progress?.training[step.id] || null,
    href: step.href,
    viewHref: step.viewHref,
    actionLabel: step.actionLabel,
    canSkip: step.canSkip,
  }))

  const nextStep = steps.find((s) => s.id === currentId) || null
  const doneCount = steps.filter((s) => s.completed).length
  const progressPct = Math.round((doneCount / steps.length) * 100)

  const handleContinue = async (step: DashboardStep) => {
    if (isUpdating) return
    if (!started) {
      await startTraining()
    }
    router.push(step.completed ? step.viewHref : step.href)
  }

  return (
    <JourneyDashboard
      title={LIFE_ACTIVATION_COPY.training.eyebrow}
      phases={TRAINING_PHASES}
      steps={steps}
      nextStep={nextStep}
      progressCopy={LIFE_ACTIVATION_COPY.dashboard.trainingLine(progressPct)}
      loading={isLoading}
      continueDisabled={isUpdating}
      onContinue={handleContinue}
      footer={
        started && !progress?.training_completed_at ? (
          <div className="flex justify-center">
            <Button variant="ghost" size="sm" onClick={() => dismissTraining()} disabled={isUpdating}>
              {LIFE_ACTIVATION_COPY.training.dismiss}
            </Button>
          </div>
        ) : null
      }
    />
  )
}
