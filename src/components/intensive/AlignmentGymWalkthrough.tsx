'use client'

import { ChevronLeft, ChevronRight, CheckCircle, X } from 'lucide-react'
import { Button, Spinner } from '@/lib/design-system/components'

export const ALIGNMENT_GYM_TOUR_STEPS = [
  {
    id: 'hero',
    title: 'The Alignment Gym hub',
    body: 'This is your home for weekly live group coaching.',
  },
  {
    id: 'stats',
    title: 'Your stats',
    body: 'Streak and weekly reps show how consistently you are showing up. Attending live or opening a replay counts.',
  },
  {
    id: 'about',
    title: 'What happens in session',
    body: 'Expand this section anytime for a quick reminder of what the live room is for — coaching, questions, and community.',
  },
  {
    id: 'upcoming',
    title: 'Next live session',
    body: 'The next session appears here — click the button when it\u2019s time to join live. Be sure to add this to your calendar.',
  },
  {
    id: 'replays',
    title: 'Session replays',
    body: 'Miss a week? Watch a past session here. Watching a replay also counts as showing up.',
  },
] as const

export type AlignmentGymTourStepId = (typeof ALIGNMENT_GYM_TOUR_STEPS)[number]['id']

interface AlignmentGymWalkthroughProps {
  stepIndex: number
  onStepChange: (index: number) => void
  onComplete: () => void
  onExit: () => void
  completing: boolean
}

export function AlignmentGymWalkthrough({
  stepIndex,
  onStepChange,
  onComplete,
  onExit,
  completing,
}: AlignmentGymWalkthroughProps) {
  const step = ALIGNMENT_GYM_TOUR_STEPS[stepIndex]
  const isLast = stepIndex === ALIGNMENT_GYM_TOUR_STEPS.length - 1

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-[#00FFFF]/30 bg-[#0A0A0A]/95 backdrop-blur-md"
      role="region"
      aria-label="Alignment Gym walkthrough"
    >
      <div className="max-w-3xl mx-auto px-4 py-4 md:py-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#00FFFF] mb-1">
              Intensive walkthrough · Step {stepIndex + 1} of {ALIGNMENT_GYM_TOUR_STEPS.length}
            </p>
            <h3 className="text-base font-bold text-white">{step.title}</h3>
            <p className="text-sm text-neutral-400 mt-1 leading-relaxed">{step.body}</p>
          </div>
          <button
            type="button"
            onClick={onExit}
            className="p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors flex-shrink-0"
            aria-label="Exit walkthrough"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStepChange(Math.max(0, stepIndex - 1))}
            disabled={stepIndex === 0}
            className="text-neutral-400"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          <div className="flex items-center gap-1.5">
            {ALIGNMENT_GYM_TOUR_STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onStepChange(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === stepIndex ? 'w-5 bg-[#00FFFF]' : 'w-1.5 bg-neutral-700 hover:bg-neutral-600'
                }`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          {isLast ? (
            <Button variant="primary" size="sm" onClick={onComplete} disabled={completing}>
              {completing ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Finishing...
                </>
              ) : (
                <>
                  Finish tour
                  <CheckCircle className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={() => onStepChange(stepIndex + 1)}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export function alignmentGymTourHighlight(active: boolean): string {
  return active
    ? 'ring-2 ring-[#00FFFF]/60 ring-offset-2 ring-offset-[#0A0A0A] rounded-2xl transition-shadow duration-300'
    : 'transition-shadow duration-300'
}
