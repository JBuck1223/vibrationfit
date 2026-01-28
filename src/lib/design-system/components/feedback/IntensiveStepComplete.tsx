'use client'

import { useRouter } from 'next/navigation'
import { CheckCircle, ArrowRight, Eye, ArrowLeft } from 'lucide-react'
import { Button } from '../forms/Button'
import { Card } from '../cards/Card'
import { Container } from '../layout/Container'
import { Stack } from '../layout/Stack'

/**
 * IntensiveStepComplete - Design System Component
 * 
 * A full-page completion component for the Activation Intensive.
 * Shown on dedicated completion pages after a user finishes a step.
 * 
 * Features:
 * - Centered success card with checkmark icon
 * - "Step X Complete!" heading
 * - Success message describing what was accomplished
 * - Completion timestamp
 * - Three action buttons: Begin Next Step, View Item, Back to Dashboard
 * 
 * @example
 * // Basic usage for Step 3 (Profile)
 * <IntensiveStepComplete
 *   stepNumber={3}
 *   stepTitle="Create Your Profile"
 *   successMessage="Your profile is now complete with all 12 life categories filled out."
 *   completedAt={completedAt}
 *   viewLabel="View Profile"
 *   viewHref="/profile"
 *   nextStepTitle="Vibration Assessment"
 *   nextStepHref="/assessment/new"
 * />
 * 
 * @example
 * // Final step (no next step)
 * <IntensiveStepComplete
 *   stepNumber={14}
 *   stepTitle="Full Platform Unlock"
 *   successMessage="Congratulations! Your Activation Intensive is complete."
 *   completedAt={completedAt}
 *   viewLabel="Enter Dashboard"
 *   viewHref="/dashboard"
 *   isFinalStep={true}
 * />
 */

interface IntensiveStepCompleteProps {
  /** The step number (1-14) */
  stepNumber: number
  /** The display name of the completed step */
  stepTitle: string
  /** Success message describing what was accomplished */
  successMessage: string
  /** ISO date string or Date object for when the step was completed */
  completedAt: string | Date
  /** Label for the view button (e.g., "View Profile") */
  viewLabel: string
  /** URL for the view button */
  viewHref: string
  /** Title of the next step (optional - not needed for final step) */
  nextStepTitle?: string
  /** URL for the next step (optional - not needed for final step) */
  nextStepHref?: string
  /** Whether this is the final step (hides "Begin Next Step" button) */
  isFinalStep?: boolean
}

export function IntensiveStepComplete({
  stepNumber,
  stepTitle,
  successMessage,
  completedAt,
  viewLabel,
  viewHref,
  nextStepTitle,
  nextStepHref,
  isFinalStep = false
}: IntensiveStepCompleteProps) {
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

  const handleNextStep = () => {
    if (nextStepHref) {
      router.push(nextStepHref)
    }
  }

  const handleView = () => {
    router.push(viewHref)
  }

  const handleBackToDashboard = () => {
    router.push('/intensive/dashboard')
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <Card 
          variant="elevated" 
          className="p-4 md:p-8 lg:p-12 text-center bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border-primary-500/30"
        >
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary-500/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-primary-500" />
            </div>
          </div>

          {/* Step Badge */}
          <div className="inline-block px-4 py-1 rounded-full bg-primary-500/20 border border-primary-500/40 mb-4">
            <span className="text-sm font-semibold text-primary-400">
              Step {stepNumber} of 14
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
            {stepTitle} Complete!
          </h1>

          {/* Completion Time */}
          <p className="text-sm text-neutral-400 mb-6">
            Completed on {formattedDate} at {formattedTime}
          </p>

          {/* Success Message */}
          <p className="text-sm md:text-base lg:text-lg text-neutral-300 mb-8 max-w-xl mx-auto">
            {successMessage}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3 justify-center items-center">
            {/* Primary: Begin Next Step (if not final) */}
            {!isFinalStep && nextStepTitle && nextStepHref && (
              <Button 
                variant="primary"
                size="sm"
                onClick={handleNextStep}
                className="w-full sm:w-auto"
              >
                Begin {nextStepTitle}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}

            {/* Secondary: View Item */}
            <Button 
              variant={isFinalStep ? 'primary' : 'secondary'}
              size="sm"
              onClick={handleView}
              className="w-full sm:w-auto"
            >
              <Eye className="w-4 h-4 mr-2" />
              {viewLabel}
            </Button>

            {/* Ghost: Back to Dashboard */}
            <Button 
              variant="ghost"
              size="sm"
              onClick={handleBackToDashboard}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </Card>

        {/* Progress Indicator */}
        <div className="text-center">
          <p className="text-sm text-neutral-500">
            {isFinalStep ? (
              "You've completed all steps of the Activation Intensive!"
            ) : (
              `${14 - stepNumber} step${14 - stepNumber === 1 ? '' : 's'} remaining in your Activation Intensive`
            )}
          </p>
        </div>
      </Stack>
    </Container>
  )
}
