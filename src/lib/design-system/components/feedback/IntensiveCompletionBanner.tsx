'use client'

import { useRouter } from 'next/navigation'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import { Button } from '../forms/Button'
import { Card } from '../cards/Card'

/**
 * IntensiveCompletionBanner - Design System Component
 * 
 * A standardized banner for showing completion status during the Activation Intensive.
 * Use this when a user revisits a step they've already completed.
 * 
 * Features a centered, attractive layout with:
 * - Checkmark icon with title
 * - Completion timestamp
 * - Back to Dashboard button
 * 
 * @example
 * // Basic usage
 * <IntensiveCompletionBanner
 *   stepTitle="Account Settings"
 *   completedAt={completedAt}
 * />
 * 
 * @example
 * // With custom message (no "review below" text)
 * <IntensiveCompletionBanner
 *   stepTitle="Start Intensive"
 *   completedAt={startedAt}
 *   showReviewText={false}
 * />
 */

interface IntensiveCompletionBannerProps {
  /** The display name of the completed step */
  stepTitle: string
  /** ISO date string or Date object for when the step was completed */
  completedAt: string | Date
  /** Whether to show "You can review what you submitted below" text. Default: true */
  showReviewText?: boolean
  /** Custom message to replace the default completion message */
  customMessage?: string
}

export function IntensiveCompletionBanner({
  stepTitle,
  completedAt,
  showReviewText = true,
  customMessage
}: IntensiveCompletionBannerProps) {
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

  const handleBackToDashboard = () => {
    router.push('/intensive/dashboard')
  }

  // Build the default message
  const reviewText = showReviewText 
    ? ' You can review what you submitted below.' 
    : ''
  const defaultMessage = `You finished ${stepTitle} on ${formattedDate} at ${formattedTime}.${reviewText} To keep your 72-Hour Activation moving, return to your Dashboard and continue with your next step.`

  return (
    <Card className="bg-neutral-800/80 border-neutral-600/50">
      <div className="space-y-4">
        {/* Centered header with icon */}
        <div className="flex items-center justify-center gap-2">
          <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-primary-500" />
          <p className="text-base md:text-lg font-medium text-white">
            This step is already complete.
          </p>
        </div>
        
        {/* Centered description */}
        <p className="text-sm md:text-base text-neutral-300 text-center max-w-2xl mx-auto">
          {customMessage || defaultMessage}
        </p>
        
        {/* Centered button */}
        <div className="flex justify-center">
          <Button 
            variant="primary"
            size="sm"
            onClick={handleBackToDashboard}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Activation Dashboard
          </Button>
        </div>
      </div>
    </Card>
  )
}
