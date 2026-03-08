'use client'

import { useRouter } from 'next/navigation'
import { CheckCircle, ArrowRight } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from '../forms/Button'
import { getStepInfo, getNextStep as getNextStepById } from '@/lib/intensive/step-mapping'

interface IntensiveStepCompleteModalProps {
  isOpen: boolean
  onClose: () => void
  /** Key from INTENSIVE_STEPS (e.g., 'profile', 'build_vision', 'intake') */
  stepId: string
  /** Override for the stay-here action */
  onStayHere?: () => void
  /** Override for the continue action */
  onContinue?: () => void
}

export function IntensiveStepCompleteModal({
  isOpen,
  onClose,
  stepId,
  onStayHere,
  onContinue
}: IntensiveStepCompleteModalProps) {
  const router = useRouter()
  const stepInfo = getStepInfo(stepId)
  const nextStep = stepInfo ? getNextStepById(stepId) : null

  const handleStayHere = () => {
    onStayHere?.()
    onClose()
  }

  const handleContinue = () => {
    if (onContinue) {
      onContinue()
    } else if (nextStep) {
      router.push(nextStep.href)
    } else {
      router.push('/intensive/dashboard')
    }
  }

  if (!stepInfo) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleStayHere}
      size="sm"
      showCloseButton={false}
    >
      <div className="text-center space-y-6 py-2">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center ring-4 ring-primary-500/10">
            <CheckCircle className="w-10 h-10 text-primary-500" />
          </div>
        </div>

        <div className="inline-block px-4 py-1 rounded-full bg-primary-500/20 border border-primary-500/40">
          <span className="text-sm font-semibold text-primary-400">
            Step {stepInfo.stepNumber} of 14
          </span>
        </div>

        <h2 className="text-2xl font-bold text-white">
          {stepInfo.title} Complete!
        </h2>

        {nextStep && (
          <p className="text-neutral-300 text-sm">
            Your next step: <span className="text-white font-medium">&ldquo;{nextStep.title}&rdquo;</span>
          </p>
        )}

        <div className="flex flex-col gap-3 pt-2">
          <Button
            variant="primary"
            size="lg"
            onClick={handleContinue}
            className="w-full"
          >
            {nextStep ? 'Continue to Next Step' : 'Back to Dashboard'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleStayHere}
            className="w-full"
          >
            Stay on This Page
          </Button>
        </div>
      </div>
    </Modal>
  )
}
