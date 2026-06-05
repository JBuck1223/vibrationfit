'use client'

import { useState } from 'react'
import { Flame, ChevronLeft, ChevronRight, CheckCircle, HelpCircle } from 'lucide-react'
import { Button, Card, Spinner, IntensiveStepCompleteModal } from '@/lib/design-system/components'
import type { AlignmentGymTourAnchor } from '@/components/alignment-gym/AlignmentGymHub'
import { useIntensiveStepCompleteModal } from '@/lib/intensive/use-step-complete-modal'

type TourPhase = 'intro' | 'walkthrough'

const WALKTHROUGH_STEPS: { id: AlignmentGymTourAnchor; title: string; body: string }[] = [
  {
    id: 'hero',
    title: 'The Alignment Gym hub',
    body: 'This is your home for weekly live group coaching.',
  },
  {
    id: 'stats',
    title: 'Your stats',
    body: 'Streak and weekly reps show how consistently you are showing up. Attending live or watching a replay counts.',
  },
  {
    id: 'what-is',
    title: 'What happens in a session',
    body: 'Expand this section anytime for a quick reminder of group coaching, Q&A, and building your streak.',
  },
  {
    id: 'next-session',
    title: 'Next live session',
    body: 'The next session appears here \u2014 click the button when it\u2019s time to join live. Be sure to add this to your calendar.',
  },
  {
    id: 'coaching-request',
    title: 'Request coaching on a wobble',
    body: 'When you\'re struggling with something, submit a private request here. Your guide may bring it into an upcoming Alignment Gym. You can try it now if you have something on your mind.',
  },
  {
    id: 'replays',
    title: 'Session replays',
    body: 'Miss a week? Watch a past session here. Watching a replay also counts as showing up.',
  },
]

/** Matches GlobalLayout intensive main column (`md:ml-[280px]`) */
const INTENSIVE_MAIN_BOUNDS = 'fixed inset-0 md:left-[280px] md:right-0'

export function AlignmentGymIntensiveTour({
  alreadyCompleted,
  onActiveAnchorChange,
  onRequestCoaching,
}: {
  alreadyCompleted: boolean
  onActiveAnchorChange: (anchor: AlignmentGymTourAnchor | null) => void
  onRequestCoaching?: () => void
}) {
  const { isOpen, stepId, completeAndShowModal, closeModal } = useIntensiveStepCompleteModal()
  const [phase, setPhase] = useState<TourPhase>('intro')
  const [stepIndex, setStepIndex] = useState(0)
  const [completing, setCompleting] = useState(false)
  const [tourDone, setTourDone] = useState(false)

  if (alreadyCompleted) {
    return null
  }

  if (tourDone) {
    return (
      <IntensiveStepCompleteModal
        isOpen={isOpen}
        onClose={closeModal}
        stepId={stepId || 'alignment_gym_tour'}
      />
    )
  }

  const step = WALKTHROUGH_STEPS[stepIndex]
  const isLastWalkthroughStep = stepIndex === WALKTHROUGH_STEPS.length - 1

  const startWalkthrough = () => {
    setPhase('walkthrough')
    onActiveAnchorChange(WALKTHROUGH_STEPS[0].id)
  }

  const goToStep = (index: number) => {
    setStepIndex(index)
    onActiveAnchorChange(WALKTHROUGH_STEPS[index].id)
  }

  const handleFinish = async () => {
    setCompleting(true)
    onActiveAnchorChange(null)
    await completeAndShowModal('alignment_gym_toured')
    setCompleting(false)
    setTourDone(true)
  }

  return (
    <>
      <IntensiveStepCompleteModal
        isOpen={isOpen}
        onClose={closeModal}
        stepId={stepId || 'alignment_gym_tour'}
      />
      {phase === 'intro' && (
        <div className={`${INTENSIVE_MAIN_BOUNDS} z-[100] flex items-center justify-center p-4`}>
          <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px]" aria-hidden />
          <Card variant="elevated" className="relative z-10 w-full max-w-lg p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#00FFFF]/10 flex items-center justify-center flex-shrink-0">
                <Flame className="w-6 h-6 text-[#00FFFF]" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#00FFFF] mb-1">
                  Step 12 · Alignment Gym
                </p>
                <h2 className="text-xl font-bold text-white">Welcome to the Alignment Gym</h2>
              </div>
            </div>
            <p className="text-sm text-neutral-300 leading-relaxed mb-3">
              Your weekly, live group coaching session to stay aligned. This is where we clear wobbles that are in the way of you experiencing your Life Vision.
            </p>
            <p className="text-sm text-neutral-300 leading-relaxed mb-3">
              Think of your Profile as where you are now, your Life Vision as where you&apos;re headed, and wobbles as what&apos;s in the way.
            </p>
            <p className="text-sm text-neutral-500 leading-relaxed mb-6">
              The page behind this overlay is the real Alignment Gym hub you will use after the
              Intensive — live sessions, coaching requests, and replays. Next, we will walk through
              each section together.
            </p>
            <Button variant="primary" className="w-full" onClick={startWalkthrough}>
              Start walkthrough
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Card>
        </div>
      )}

      {phase === 'walkthrough' && (
        <>
          <div
            className={`${INTENSIVE_MAIN_BOUNDS} z-[90] bg-black/40 pointer-events-none`}
            aria-hidden
          />
          <div
            className={`${INTENSIVE_MAIN_BOUNDS} z-[100] flex flex-col justify-end p-4 pb-[max(1rem,env(safe-area-inset-bottom))]`}
          >
            <Card variant="elevated" className="w-full max-w-2xl mx-auto p-4 md:p-5 border border-[#00FFFF]/25">
              <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#00FFFF] mb-1">
                Walkthrough {stepIndex + 1} of {WALKTHROUGH_STEPS.length}
              </p>
              <h3 className="text-base font-bold text-white mb-1">{step.title}</h3>
              <p className="text-sm text-neutral-400 leading-relaxed mb-4">{step.body}</p>
              {step.id === 'coaching-request' && onRequestCoaching && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onRequestCoaching}
                  className="mb-4 w-full"
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Try it now
                </Button>
              )}
              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => goToStep(Math.max(0, stepIndex - 1))}
                  disabled={stepIndex === 0}
                  className="text-neutral-400"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <div className="flex items-center gap-1.5">
                  {WALKTHROUGH_STEPS.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i === stepIndex ? 'w-5 bg-[#00FFFF]' : 'w-1.5 bg-neutral-600'
                      }`}
                    />
                  ))}
                </div>
                {isLastWalkthroughStep ? (
                  <Button variant="primary" size="sm" onClick={handleFinish} disabled={completing}>
                    {completing ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Finishing...
                      </>
                    ) : (
                      <>
                        Finish tour
                        <CheckCircle className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={() => goToStep(stepIndex + 1)}>
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </>
  )
}
