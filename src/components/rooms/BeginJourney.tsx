'use client'
import { ArrowRight, Check, Lock } from 'lucide-react'
import type { DashboardStep } from '@/components/life-activation/JourneyDashboard'
export function BeginJourney({
  steps,
  nextStep,
  loading,
  error,
  continueDisabled,
  onContinue,
  onSkip,
}: {
  steps: DashboardStep[]
  nextStep: DashboardStep | null
  loading: boolean
  error?: boolean
  continueDisabled: boolean
  onContinue: (step: DashboardStep) => void
  onSkip: (step: DashboardStep) => Promise<void>
}) {
  if (loading)
    return (
      <section className="room-panel room-feature" aria-busy="true">
        Loading your Begin journey…
      </section>
    )
  if (error)
    return (
      <section className="room-panel room-feature" role="alert">
        We couldn’t load your Begin progress. Please refresh to try again.
      </section>
    )
  const done = steps.filter((s) => s.completed).length
  return (
    <section className="room-panel room-begin">
      <div className="room-feature">
        <div className="flex justify-between gap-4">
          <p className="room-eyebrow">BEGIN · YOUR LIFE ACTIVATION</p>
          <span className="text-sm text-white/65">
            {done} of {steps.length}
          </span>
        </div>
        <h2>{nextStep ? nextStep.title : 'Your next chapter starts here.'}</h2>
        <p className="room-subtitle">
          {nextStep
            ? nextStep.description
            : 'Your Begin journey is complete. Make this space your own.'}
        </p>
        {nextStep && (
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <button
              className="room-primary"
              disabled={continueDisabled}
              onClick={() => onContinue(nextStep)}
            >
              {done ? nextStep.actionLabel : 'Let’s begin'}
              <ArrowRight size={18} />
            </button>
            {nextStep.canSkip && (
              <button
                className="room-text-button"
                disabled={continueDisabled}
                onClick={() => void onSkip(nextStep)}
              >
                Skip for now
              </button>
            )}
          </div>
        )}
        <progress
          className="room-progress"
          aria-label="Begin progress"
          value={done}
          max={steps.length}
        />
      </div>
      <details className="room-journey">
        <summary>
          Your Begin journey{' '}
          <span>
            {done}/{steps.length} complete
          </span>
        </summary>
        <ol>
          {steps.map((s) => (
            <li key={s.id}>
              <button
                disabled={s.locked || continueDisabled}
                onClick={() => onContinue(s)}
                aria-label={`${s.title}${s.completed ? ', completed' : s.locked ? ', locked' : ''}`}
              >
                <span
                  className={s.completed ? 'room-step complete' : 'room-step'}
                >
                  {s.completed ? (
                    <Check size={15} />
                  ) : s.locked ? (
                    <Lock size={13} />
                  ) : (
                    s.stepNumber
                  )}
                </span>
                <span>
                  <strong>{s.title}</strong>
                  <small>{s.phase}</small>
                </span>
                {!s.locked && <ArrowRight size={16} />}
              </button>
            </li>
          ))}
        </ol>
      </details>
    </section>
  )
}
