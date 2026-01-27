'use client'

import { useRouter } from 'next/navigation'
import { Card, Button } from '@/lib/design-system/components'
import { ArrowRight, CheckCircle } from 'lucide-react'

interface IntensiveStepCompleteBannerProps {
  currentStepName: string
  nextStepName: string
  nextStepHref: string
  position: 'top' | 'bottom'
}

/**
 * IntensiveStepCompleteBanner - Scenario A: Just completed a step
 * 
 * Shows immediately after a user completes a step to provide forward momentum.
 * Displays at top and/or bottom of the page with a prominent "Continue" button.
 * 
 * Headline: Step complete. You're ready for what's next.
 * Body: You've finished **{Current Step Name}**. Keep your 72-Hour Activation moving and begin **{Next Step Name}** now.
 * Button: Continue to {Next Step Name}
 */
export function IntensiveStepCompleteBanner({
  currentStepName,
  nextStepName,
  nextStepHref,
  position
}: IntensiveStepCompleteBannerProps) {
  const router = useRouter()

  const handleContinue = () => {
    router.push(nextStepHref)
  }

  return (
    <Card 
      variant="elevated" 
      className={`
        bg-gradient-to-r from-primary-500/20 to-secondary-500/10 
        border-primary-500/40
        ${position === 'bottom' ? 'sticky bottom-4 z-40' : ''}
      `}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-primary-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-black" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-white mb-1">
              Step complete. You're ready for what's next.
            </h3>
            <p className="text-sm md:text-base text-neutral-300">
              You've finished <span className="font-semibold text-white">{currentStepName}</span>. 
              Keep your 72-Hour Activation moving and begin{' '}
              <span className="font-semibold text-white">{nextStepName}</span> now.
            </p>
          </div>
        </div>
        <Button 
          variant="primary"
          size="sm"
          onClick={handleContinue}
          className="w-full sm:w-auto flex-shrink-0"
        >
          Continue to {nextStepName}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </Card>
  )
}
