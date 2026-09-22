'use client'

import type { ReactNode } from 'react'
import { ArrowRight, Check, ChevronRight, Lock } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  Container,
  PageHero,
  ProgressBar,
  Spinner,
  Stack,
} from '@/lib/design-system/components'
import { LIFE_ACTIVATION_COPY } from '@/lib/life-activation/copy'
import { cn } from '@/lib/utils'

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
  locked?: boolean
}

function StepStatus({
  completed,
  current,
  locked,
}: {
  completed: boolean
  current: boolean
  locked?: boolean
}) {
  if (completed) {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-500 text-black">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    )
  }

  if (current) {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-primary-500 bg-primary-500/15">
        <span className="h-2 w-2 rounded-full bg-primary-500" />
      </span>
    )
  }

  if (locked) {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[#333] bg-[#1A1A1A] text-neutral-500">
        <Lock className="h-3 w-3" />
      </span>
    )
  }

  return <span className="h-6 w-6 shrink-0 rounded-full border-2 border-[#333]" />
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
  onSkip,
}: {
  title: ReactNode
  phases: readonly string[]
  steps: DashboardStep[]
  nextStep: DashboardStep | null
  progressCopy: string
  loading?: boolean
  extra?: ReactNode
  footer?: ReactNode
  continueDisabled?: boolean
  onContinue: (step: DashboardStep) => void
  onSkip?: (step: DashboardStep) => void
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

  return (
    <Container size="xl">
      <div className="mx-auto w-full max-w-2xl">
        <Stack gap="lg">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <PageHero title={title} subtitle={progressCopy} />
              <span className="shrink-0 pt-1 text-sm tabular-nums text-neutral-500">
                {LIFE_ACTIVATION_COPY.dashboard.stepsCount(doneCount, steps.length)}
              </span>
            </div>
            <ProgressBar value={progress} variant="primary" size="sm" />
          </div>

          {extra}

          {nextStep && (
            <Card className="border-primary-500/25 bg-[#141414] p-5 md:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-primary-500">
                {LIFE_ACTIVATION_COPY.dashboard.nextStep}
              </p>
              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                    <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md border border-primary-500 px-1 font-mono text-[11px] font-semibold text-primary-300">
                      {nextStep.stepNumber}
                    </span>
                    {nextStep.title}
                  </h2>
                  <p className="mt-1 pl-8 text-sm leading-relaxed text-neutral-400">
                    {nextStep.description}
                  </p>
                </div>
                <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
                  <Button
                    variant="primary"
                    onClick={() => onContinue(nextStep)}
                    disabled={continueDisabled}
                    className="w-full justify-center sm:w-auto"
                  >
                    {nextStep.actionLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  {nextStep.canSkip && onSkip ? (
                    <Button
                      variant="ghost"
                      onClick={() => onSkip(nextStep)}
                      disabled={continueDisabled}
                      className="w-full justify-center sm:w-auto"
                    >
                      {LIFE_ACTIVATION_COPY.dashboard.skip}
                    </Button>
                  ) : null}
                </div>
              </div>
            </Card>
          )}

          <div>
            <div className="mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                {LIFE_ACTIVATION_COPY.dashboard.pathHeading}
              </p>
              {steps.some((s) => s.locked) ? (
                <p className="mt-1 text-xs text-neutral-500">
                  {LIFE_ACTIVATION_COPY.dashboard.pathNote}
                </p>
              ) : null}
            </div>
            <div className="overflow-hidden rounded-2xl border-2 border-[#333] bg-[#141414]">
              {phases.map((phase, phaseIndex) => {
                const phaseSteps = steps.filter((s) => s.phase === phase)
                if (!phaseSteps.length) return null

                return (
                  <div
                    key={phase}
                    className={phaseIndex > 0 ? 'border-t border-[#222]' : undefined}
                  >
                    <div className="bg-[#1F1F1F] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                      {phase}
                    </div>
                    {phaseSteps.map((step, index) => {
                      const isCurrent = nextStep?.id === step.id
                      const isLocked = Boolean(step.locked)
                      const busy = Boolean(continueDisabled && isCurrent && !step.completed)
                      const inactive = isLocked || busy

                      return (
                        <div
                          key={step.id}
                          role={isLocked ? undefined : 'button'}
                          tabIndex={inactive ? -1 : 0}
                          aria-disabled={isLocked || undefined}
                          onClick={() => {
                            if (inactive) return
                            onContinue(step)
                          }}
                          onKeyDown={(e) => {
                            if (isLocked) return
                            if (e.key !== 'Enter' && e.key !== ' ') return
                            e.preventDefault()
                            if (busy) return
                            onContinue(step)
                          }}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3.5 transition-colors',
                            index > 0 && 'border-t border-white/10',
                            isLocked && 'opacity-50',
                            inactive ? 'cursor-default' : 'cursor-pointer',
                            isCurrent && 'bg-primary-500/5',
                            !isCurrent && !inactive && 'hover:bg-white/[0.03]',
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={cn(
                                  'flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md border px-1 font-mono text-[11px] font-semibold',
                                  step.completed
                                    ? 'border-primary-500/40 text-primary-400'
                                    : isLocked
                                      ? 'border-white/10 text-neutral-600'
                                      : isCurrent
                                        ? 'border-primary-500 text-primary-300'
                                        : 'border-white/15 text-neutral-300',
                                )}
                              >
                                {step.stepNumber}
                              </span>
                              <p
                                className={cn(
                                  'text-sm font-medium',
                                  step.completed || isLocked ? 'text-neutral-400' : 'text-white',
                                )}
                              >
                                {step.title}
                              </p>
                              {step.canSkip && !step.completed && !isLocked ? (
                                <Badge variant="neutral" className="text-[10px]">
                                  Optional
                                </Badge>
                              ) : null}
                            </div>
                            <p className="mt-0.5 pl-8 text-xs leading-relaxed text-neutral-500">
                              {step.description}
                            </p>
                          </div>
                          <StepStatus
                            completed={step.completed}
                            current={isCurrent}
                            locked={isLocked}
                          />
                          {isLocked ? (
                            <span className="flex shrink-0 items-center gap-1 text-xs text-neutral-500">
                              <Lock className="h-3.5 w-3.5" />
                              {LIFE_ACTIVATION_COPY.dashboard.locked}
                            </span>
                          ) : step.completed ? (
                            <span className="inline-flex h-7 shrink-0 items-center rounded-full border border-[#333] bg-[#1A1A1A] px-2.5 text-[11px] font-medium text-neutral-300">
                              {LIFE_ACTIVATION_COPY.dashboard.view}
                            </span>
                          ) : isCurrent ? (
                            <span className="shrink-0 text-xs font-medium text-primary-500">
                              {LIFE_ACTIVATION_COPY.dashboard.now}
                            </span>
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0 text-neutral-600" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>

          {footer}
        </Stack>
      </div>
    </Container>
  )
}
