'use client'

import type { ReactNode } from 'react'
import { ArrowRight, CheckCircle, Eye } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  Container,
  ProgressBar,
  Spinner,
  Stack,
} from '@/lib/design-system/components'
import { LIFE_ACTIVATION_COPY } from '@/lib/life-activation/copy'

export type DashboardStep = {
  id: string
  stepNumber: number
  title: string
  description: string
  phase: string
  completed: boolean
  completedAt: string | null
  href: string
  viewHref: string
  actionLabel: string
  canSkip?: boolean
}

function formatCompletedAt(value: string) {
  const utc = value.endsWith('Z') || value.includes('+') ? value : `${value}Z`
  return new Date(utc).toLocaleString(undefined, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function JourneyDashboard({
  title,
  phases,
  steps,
  nextStep,
  progressCopy,
  loading,
  extra,
  footer,
  continueDisabled,
  onContinue,
}: {
  title: string
  phases: readonly string[]
  steps: DashboardStep[]
  nextStep: DashboardStep | null
  progressCopy: string
  loading?: boolean
  extra?: ReactNode
  footer?: ReactNode
  continueDisabled?: boolean
  onContinue: (step: DashboardStep) => void
}) {
  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  const doneCount = steps.filter((s) => s.completed).length
  const progress = steps.length ? Math.round((doneCount / steps.length) * 100) : 0
  const currentPhase = nextStep?.phase || 'Completed'
  const currentStepNumber = nextStep?.stepNumber || steps.length

  return (
    <Container size="xl">
      <Stack gap="lg">
        <div className="flex justify-center">
          <Badge variant="premium" className="text-xs md:text-sm">
            {LIFE_ACTIVATION_COPY.dashboard.currentPhase(
              currentPhase,
              currentStepNumber,
              steps.length,
            )}
          </Badge>
        </div>

        <p className="text-center text-sm text-neutral-400">{progressCopy}</p>

        <Card
          variant="elevated"
          className="border-primary-500/30 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 p-4 md:p-6 lg:p-8"
        >
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="mb-2 text-base font-semibold md:text-lg">{title}</h3>
              <p className="text-sm text-neutral-400 md:text-base">
                {nextStep
                  ? nextStep.description
                  : LIFE_ACTIVATION_COPY.complete.body}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="mb-2 text-xs text-neutral-400 md:text-sm">
                {LIFE_ACTIVATION_COPY.dashboard.overall}
              </p>
              <p className="text-3xl font-bold text-secondary-500 md:text-4xl">{progress}%</p>
              <p className="mt-2 text-xs text-neutral-400 md:text-sm">
                {LIFE_ACTIVATION_COPY.dashboard.stepsCount(doneCount, steps.length)}
              </p>
            </div>
          </div>
          <div className="mt-6">
            <ProgressBar value={progress} variant="primary" className="h-3" />
          </div>
        </Card>

        {extra}

        {nextStep && (
          <Card
            variant="elevated"
            role="button"
            tabIndex={0}
            onClick={() => !continueDisabled && onContinue(nextStep)}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !continueDisabled) {
                e.preventDefault()
                onContinue(nextStep)
              }
            }}
            className="!overflow-hidden cursor-pointer border-accent-500/30 !p-0"
          >
            <div className="flex">
              <div className="flex w-14 flex-shrink-0 items-center justify-center bg-accent-500 md:w-16">
                <span className="text-lg font-bold text-black md:text-xl">
                  {nextStep.stepNumber}
                </span>
              </div>
              <div className="relative flex-1 bg-gradient-to-br from-accent-500/5 to-purple-500/5 p-4 md:p-5">
                <div className="absolute right-3 top-3 md:hidden">
                  <Badge variant="premium">{LIFE_ACTIVATION_COPY.dashboard.nextStep}</Badge>
                </div>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between md:gap-4">
                  <div className="min-w-0 flex-1 pr-24 md:pr-0">
                    <div className="md:flex md:items-center md:gap-2">
                      <h3 className="text-base font-semibold md:text-lg">{nextStep.title}</h3>
                      <span className="hidden md:block">
                        <Badge variant="premium">{LIFE_ACTIVATION_COPY.dashboard.nextStep}</Badge>
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-neutral-400 md:text-sm">
                      {nextStep.description}
                    </p>
                  </div>
                  <div className="mt-3 md:mt-0 md:hidden">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onContinue(nextStep)}
                      disabled={continueDisabled}
                      className="w-full justify-center"
                    >
                      {nextStep.actionLabel}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  <div className="hidden flex-shrink-0 md:block">
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={continueDisabled}
                      onClick={() => onContinue(nextStep)}
                    >
                      {nextStep.actionLabel}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-8">
          {phases.map((phase) => {
            const phaseSteps = steps.filter((s) => s.phase === phase)
            if (!phaseSteps.length) return null
            const phaseCompleted = phaseSteps.filter((s) => s.completed).length
            const phaseProgress = Math.round((phaseCompleted / phaseSteps.length) * 100)

            return (
              <div key={phase}>
                <div className="mb-4 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                  <h2 className="text-xl font-bold md:text-2xl">{phase}</h2>
                  <Badge variant={phaseProgress === 100 ? 'success' : 'info'}>
                    {phaseCompleted}/{phaseSteps.length} Complete
                  </Badge>
                </div>
                <div className="grid gap-4">
                  {phaseSteps.map((step) => {
                    const isCurrent = nextStep?.id === step.id
                    return (
                      <Card
                        key={step.id}
                        variant={step.completed ? 'default' : 'outlined'}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          if (continueDisabled && isCurrent && !step.completed) return
                          onContinue(step)
                        }}
                        onKeyDown={(e) => {
                          if (e.key !== 'Enter' && e.key !== ' ') return
                          e.preventDefault()
                          if (continueDisabled && isCurrent && !step.completed) return
                          onContinue(step)
                        }}
                        className={`!overflow-hidden cursor-pointer !p-0 transition-all duration-300 hover:-translate-y-1 ${
                          step.completed ? 'border-primary-500/50' : ''
                        } ${isCurrent ? 'border-accent-500/30' : ''}`}
                      >
                        <div className="flex">
                          <div
                            className={`flex w-14 flex-shrink-0 items-center justify-center md:w-16 ${
                              step.completed ? 'bg-primary-500' : 'bg-accent-500'
                            }`}
                          >
                            <span className="text-lg font-bold text-black md:text-xl">
                              {step.stepNumber}
                            </span>
                          </div>
                          <div
                            className={`relative flex-1 p-4 md:flex md:items-center md:p-5 ${
                              step.completed ? 'bg-primary-500/5' : ''
                            } ${
                              isCurrent
                                ? 'bg-gradient-to-br from-accent-500/5 to-purple-500/5'
                                : ''
                            }`}
                          >
                            <div className="absolute right-3 top-3 flex items-center gap-2 md:hidden">
                              {step.completed && (
                                <CheckCircle className="h-5 w-5 flex-shrink-0 text-primary-500" />
                              )}
                            </div>
                            <div className="flex flex-1 flex-col md:flex-row md:items-center md:justify-between md:gap-4">
                              <div className="min-w-0 flex-1">
                                <div className="pr-20 md:pr-0">
                                  <div className="md:flex md:items-center md:gap-2">
                                    <h3 className="text-base font-semibold md:text-lg">
                                      {step.title}
                                    </h3>
                                    {step.canSkip && !step.completed && (
                                      <span className="hidden md:block">
                                        <Badge variant="neutral" className="text-xs">
                                          Optional
                                        </Badge>
                                      </span>
                                    )}
                                  </div>
                                  {step.canSkip && !step.completed && (
                                    <div className="mt-1 block md:hidden">
                                      <Badge variant="neutral" className="text-xs">
                                        Optional
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                                <p className="mt-1 text-xs text-neutral-400 md:text-sm">
                                  {step.description}
                                </p>
                                {step.completedAt && (
                                  <p className="mt-1 text-xs text-primary-500">
                                    Completed {formatCompletedAt(step.completedAt)}
                                  </p>
                                )}
                              </div>
                              <div className="mt-3 md:hidden">
                                {!step.completed && (
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    disabled={continueDisabled && isCurrent}
                                    onClick={() => onContinue(step)}
                                    className="w-full justify-center"
                                  >
                                    {isCurrent ? step.actionLabel : 'Start'}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                  </Button>
                                )}
                                {step.completed && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onContinue(step)}
                                    className="w-full justify-center"
                                  >
                                    <Eye className="mr-1 h-4 w-4" />
                                    {LIFE_ACTIVATION_COPY.dashboard.view}
                                  </Button>
                                )}
                              </div>
                              <div className="hidden flex-shrink-0 items-center gap-2 md:flex">
                                {!step.completed && (
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    disabled={continueDisabled && isCurrent}
                                    onClick={() => onContinue(step)}
                                  >
                                    {isCurrent ? step.actionLabel : 'Start'}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                  </Button>
                                )}
                                {step.completed && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onContinue(step)}
                                  >
                                    <Eye className="mr-1 h-4 w-4" />
                                    {LIFE_ACTIVATION_COPY.dashboard.view}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {footer}
      </Stack>
    </Container>
  )
}
