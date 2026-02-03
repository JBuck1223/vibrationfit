'use client'

import { useRouter } from 'next/navigation'
import { Card, Button } from '@/lib/design-system/components'
import { CheckCircle, ArrowLeft, ExternalLink } from 'lucide-react'

interface IntensiveStepCompletedBannerProps {
  stepName: string
  completedAt: string | Date  // ISO date string or Date object
  secondaryAction?: {
    label: string
    href: string
  }
}

/**
 * IntensiveStepCompletedBanner - Scenario B: Revisiting a completed step
 * 
 * Shows when a user returns to a step they've already completed.
 * Confirms completion, displays timestamp, and pushes them back to dashboard.
 * 
 * Headline: This step is already complete.
 * Body: You finished **{Step Name}** on {Date} at {Time}. You can review what you submitted below.
 *       To keep your 72-Hour Activation moving, return to your Dashboard and continue with your next step.
 * Primary Button: Back to Activation Dashboard
 * Secondary Button (optional): View My Results, etc.
 */
export function IntensiveStepCompletedBanner({
  stepName,
  completedAt,
  secondaryAction
}: IntensiveStepCompletedBannerProps) {
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

  const handleBackToDashboard = () => {
    router.push('/intensive/dashboard')
  }

  const handleSecondaryAction = () => {
    if (secondaryAction) {
      router.push(secondaryAction.href)
    }
  }

  return (
    <Card 
      variant="elevated" 
      className="bg-neutral-800/80 border-neutral-600/50"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-primary-500/20 border-2 border-primary-500/40 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-primary-500" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-white mb-1">
              This step is already complete.
            </h3>
            <p className="text-sm md:text-base text-neutral-300">
              You finished <span className="font-semibold text-white">{stepName}</span> on{' '}
              {formattedDate} at {formattedTime}. You can review what you submitted below.
              To keep your 72-Hour Activation moving, return to your Dashboard and continue with your next step.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:ml-14">
          <Button 
            variant="primary"
            size="sm"
            onClick={handleBackToDashboard}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Activation Dashboard
          </Button>
          {secondaryAction && (
            <Button 
              variant="ghost"
              size="sm"
              onClick={handleSecondaryAction}
              className="w-full sm:w-auto"
            >
              {secondaryAction.label}
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

/**
 * ReadOnlySection - Helper component for displaying locked content
 * 
 * Wraps submitted responses in a clearly labeled read-only section
 */
interface ReadOnlySectionProps {
  title?: string
  helperText?: string
  children: React.ReactNode
}

export function ReadOnlySection({
  title = 'Your Submitted Responses',
  helperText = 'These responses are locked in as part of your 72-Hour Activation baseline and cannot be edited.',
  children
}: ReadOnlySectionProps) {
  return (
    <div>
      <Card className="mb-6 text-center">
        <h3 className="text-xl md:text-2xl font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-neutral-400 max-w-lg mx-auto">{helperText}</p>
      </Card>
      <div className="opacity-80">
        {children}
      </div>
    </div>
  )
}
