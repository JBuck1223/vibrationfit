'use client'

import { useRouter } from 'next/navigation'
import { CheckCircle, ArrowLeft, Eye } from 'lucide-react'
import { Button } from '../forms/Button'
import { Card } from '../cards/Card'
import { Container } from '../layout/Container'

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
 * - Two action buttons: Back to Dashboard (primary), View (ghost)
 * 
 * @example
 * // Basic usage for Step 2 (Intake)
 * <IntensiveStepComplete
 *   stepNumber={2}
 *   stepTitle="Baseline Intake"
 *   successMessage="Your baseline intake is recorded. This helps us measure your transformation throughout the Activation Intensive."
 *   completedAt={completedAt}
 *   viewLabel="View"
 *   viewHref="/intensive/intake"
 * />
 * 
 * @example
 * // Step 3 (Profile)
 * <IntensiveStepComplete
 *   stepNumber={3}
 *   stepTitle="Create Your Profile"
 *   successMessage="Your profile is now complete with all 12 life categories filled out."
 *   completedAt={completedAt}
 *   viewLabel="View"
 *   viewHref="/profile"
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
  /** Label for the view button (e.g., "View") */
  viewLabel: string
  /** URL for the view button */
  viewHref: string
}

export function IntensiveStepComplete({
  stepNumber,
  stepTitle,
  successMessage,
  completedAt,
  viewLabel,
  viewHref
}: IntensiveStepCompleteProps) {
  const router = useRouter()

  // Helper function to get ordinal suffix for day
  const getOrdinalSuffix = (day: number): string => {
    if (day > 3 && day < 21) return 'th' // 11th, 12th, 13th, etc.
    switch (day % 10) {
      case 1: return 'st'
      case 2: return 'nd'
      case 3: return 'rd'
      default: return 'th'
    }
  }

  // Format the completion date and time
  const completedDate = new Date(completedAt)
  const day = completedDate.getDate()
  const month = completedDate.toLocaleDateString('en-US', { month: 'long' })
  const formattedDate = `${month} ${day}${getOrdinalSuffix(day)}`
  const formattedTime = completedDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })

  const handleView = () => {
    router.push(viewHref)
  }

  const handleBackToDashboard = () => {
    router.push('/intensive/dashboard')
  }

  return (
    <Container size="xl">
      <Card 
        variant="elevated" 
        className="text-center bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border-primary-500/30"
      >
        <div className="space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary-500/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-primary-500" />
            </div>
          </div>

          {/* Step Badge */}
          <div className="inline-block px-4 py-1 rounded-full bg-primary-500/20 border border-primary-500/40">
            <span className="text-sm font-semibold text-primary-400">
              Step {stepNumber} of 14
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-xl md:text-3xl lg:text-4xl font-bold text-white">
            {stepTitle} Complete!
          </h1>

          {/* Completion Time */}
          <p className="text-sm text-neutral-400">
            Completed on {formattedDate} at {formattedTime}
          </p>

          {/* Success Message */}
          <p className="text-sm md:text-base lg:text-lg text-neutral-300 max-w-xl mx-auto">
            {successMessage}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
            {/* Primary: Back to Dashboard */}
            <Button 
              variant="primary"
              size="sm"
              onClick={handleBackToDashboard}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>

            {/* Ghost: View */}
            <Button 
              variant="ghost"
              size="sm"
              onClick={handleView}
              className="w-full sm:w-auto"
            >
              <Eye className="w-4 h-4 mr-2" />
              {viewLabel}
            </Button>
          </div>
        </div>
      </Card>
    </Container>
  )
}
