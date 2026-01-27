'use client'

import { useRouter } from 'next/navigation'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/lib/design-system/components'

/**
 * IntensiveStepCompletionContent - Standardized completion message for revisiting completed steps
 * 
 * Displays:
 * - ✓ This step is already complete.
 * - Completion details with date/time
 * - Back to Activation Dashboard button
 */

interface IntensiveStepCompletionContentProps {
  stepTitle: string
  completedAt: string | Date
}

export function IntensiveStepCompletionContent({
  stepTitle,
  completedAt
}: IntensiveStepCompletionContentProps) {
  const router = useRouter()

  // Format the completion date and time
  const completedDate = new Date(completedAt)
  const formattedDate = completedDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric'
  })
  const formattedTime = completedDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })

  return (
    <>
      <div className="flex items-center justify-center gap-2">
        <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-primary-500" />
        <p className="text-base md:text-lg font-medium text-white">
          This step is already complete.
        </p>
      </div>
      <p className="text-sm md:text-base text-neutral-300 text-center max-w-2xl mx-auto">
        You finished {stepTitle} on {formattedDate} at {formattedTime}. You can review what you submitted below. To keep your 72-Hour Activation moving, return to your Dashboard and continue with your next step.
      </p>
      <div className="flex justify-center">
        <Button 
          variant="primary"
          size="sm"
          onClick={() => router.push('/intensive/dashboard')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Activation Dashboard
        </Button>
      </div>
    </>
  )
}
