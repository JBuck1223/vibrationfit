'use client'

import { useRouter } from 'next/navigation'
import { ArrowRight, Check, GraduationCap } from 'lucide-react'
import { Button, ProgressBar } from '@/lib/design-system/components'
import { useLifeActivation } from '@/hooks/useLifeActivation'
import { TRAINING_STEPS, firstIncompleteTraining } from '@/lib/life-activation/steps'
import { cn } from '@/lib/utils'
import { WidgetFrame, type WidgetChromeProps } from '../WidgetFrame'
import { isWideWidget } from '@/lib/dashboard/widgets/registry'

export function ToolsTrainingWidget(chrome: WidgetChromeProps) {
  const router = useRouter()
  const { progress, isLoading, isUpdating, startTraining, dismissTraining } = useLifeActivation()

  const completions = progress?.training ?? {}
  const steps = TRAINING_STEPS.filter((s) => s.id !== 'complete')
  const doneCount = steps.filter((s) => Boolean(completions[s.id])).length
  const nextId = firstIncompleteTraining(completions)
  const next = TRAINING_STEPS.find((s) => s.id === nextId) ?? null
  const started = Boolean(progress?.training_started_at)
  const percent = steps.length ? Math.round((doneCount / steps.length) * 100) : 0

  const handleContinue = async () => {
    if (!started) {
      await startTraining()
    }
    router.push(next?.href ?? '/begin/training')
  }

  return (
    <WidgetFrame
      {...chrome}
      title="Tools Training"
      icon={GraduationCap}
      accent="#00FFFF"
      href="/begin/training"
      hrefLabel="All rooms"
      loading={isLoading}
    >
      <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">
            {started ? 'Next room' : 'Learn the rooms'}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">
            {next && next.id !== 'complete' ? next.title : 'Finish training'}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-neutral-400">
            {next && next.id !== 'complete'
              ? next.description
              : 'You know every room. Close the trainer whenever you are ready.'}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1">
              <ProgressBar value={percent} variant="secondary" size="sm" />
            </div>
            <span className="text-xs tabular-nums text-neutral-500">
              {doneCount}/{steps.length}
            </span>
          </div>
        </div>

        <div className={cn('flex shrink-0 flex-col gap-2', isWideWidget(chrome.size) ? 'lg:w-48' : 'w-full')}>
          <Button
            variant="primary"
            size="sm"
            className="w-full justify-center"
            disabled={isUpdating}
            onClick={handleContinue}
          >
            {started ? 'Continue' : 'Start training'}
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-neutral-400"
            disabled={isUpdating}
            onClick={() => dismissTraining()}
          >
            <Check className="mr-1.5 h-4 w-4" />
            Dismiss for now
          </Button>
        </div>
      </div>

      {isWideWidget(chrome.size) ? (
        <ul className="mt-4 hidden flex-wrap gap-1.5 md:flex">
          {steps.map((step) => {
            const done = Boolean(completions[step.id])
            return (
              <li
                key={step.id}
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-[11px]',
                  done
                    ? 'border-secondary-500/40 bg-secondary-500/10 text-secondary-500'
                    : 'border-white/10 text-neutral-500',
                )}
              >
                {step.title}
              </li>
            )
          })}
        </ul>
      ) : null}
    </WidgetFrame>
  )
}
