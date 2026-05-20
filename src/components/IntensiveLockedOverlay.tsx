'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button, Card, Badge } from '@/lib/design-system/components'
import { Lock, ArrowRight, LayoutDashboard } from 'lucide-react'

interface NextStepInfo {
  stepNumber: number
  title: string
  href: string
  totalSteps: number
}

export function IntensiveLockedOverlay() {
  const router = useRouter()
  const [nextStep, setNextStep] = useState<NextStepInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNextStep()
  }, [])

  const loadNextStep = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get intensive checklist (source of truth for all tracking)
      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!checklist) return

      // If intensive hasn't been started yet, direct to start page
      if (!checklist.started_at) {
        setNextStep({
          stepNumber: 0,
          title: 'Start Your Intensive',
          href: '/intensive/start',
          totalSteps: 14
        })
        return
      }

      // Check settings completion from user_accounts (Step 1)
      const { data: accountData } = await supabase
        .from('user_accounts')
        .select('first_name, last_name, email, phone')
        .eq('id', user.id)
        .single()

      const hasSettings = !!(accountData && 
        accountData.first_name?.trim() && 
        accountData.last_name?.trim() && 
        accountData.email?.trim() && 
        accountData.phone?.trim())

      // Step 8 completion from checklist fields
      const step8Complete = !!checklist.voice_recording_completed || !!checklist.voice_recording_skipped

      // Determine next step (14-step flow)
      const steps = [
        { id: 'settings', stepNumber: 1, title: 'Account Settings', href: '/intensive/account/settings', completed: hasSettings },
        { id: 'intake', stepNumber: 2, title: 'Baseline Intake', href: '/intensive/intake', completed: !!checklist.intake_completed },
        { id: 'profile', stepNumber: 3, title: 'Create Profile', href: '/intensive/profile/new', completed: !!checklist.profile_completed },
        { id: 'vision', stepNumber: 4, title: 'Create Life Vision', href: '/intensive/life-vision/create', completed: !!checklist.vision_built },
        { id: 'audio', stepNumber: 5, title: 'Generate Audio', href: '/intensive/audio/generate', completed: !!checklist.audio_generated },
        { id: 'record', stepNumber: 6, title: 'Record Your Voice', href: '/intensive/audio/record', completed: step8Complete },
        { id: 'mix', stepNumber: 7, title: 'Create Audio Mix', href: '/intensive/audio/mix', completed: !!checklist.audios_generated },
        { id: 'board', stepNumber: 8, title: 'Vision Board', href: '/intensive/vision-board/about', completed: !!checklist.vision_board_completed },
        { id: 'journal', stepNumber: 9, title: 'First Journal Entry', href: '/intensive/journal/about', completed: !!checklist.first_journal_entry },
        { id: 'vibe_post', stepNumber: 10, title: 'First Vibe Post', href: '/intensive/vibe-tribe/post', completed: !!checklist.first_vibe_post },
        { id: 'vibe_engage', stepNumber: 11, title: 'Engage in Tribe', href: '/intensive/vibe-tribe/engage', completed: !!checklist.vibe_engagement },
        { id: 'gym_tour', stepNumber: 12, title: 'Alignment Gym', href: '/intensive/alignment-gym', completed: !!checklist.alignment_gym_toured },
        { id: 'activate', stepNumber: 13, title: 'My Alignment Plan', href: '/intensive/map', completed: !!checklist.activation_protocol_completed },
        { id: 'unlock', stepNumber: 14, title: 'Unlock Platform', href: '/intensive/unlock', completed: !!checklist.unlock_completed },
      ]

      const next = steps.find(s => !s.completed)
      if (next) {
        setNextStep({ 
          stepNumber: next.stepNumber, 
          title: next.title, 
          href: next.href,
          totalSteps: 14
        })
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-neutral-400">Loading...</div>
      </div>
    )
  }

  // Check if this is the "not started yet" case
  const isNotStarted = nextStep?.stepNumber === 0

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card variant="elevated" className="max-w-md w-full p-6 md:p-8 text-center">
        {/* Step Badge - only show if intensive has started */}
        {nextStep && !isNotStarted && (
          <Badge variant="premium" className="mb-4">
            Step {nextStep.stepNumber} of {nextStep.totalSteps}
          </Badge>
        )}

        {/* Lock Icon */}
        <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 md:mb-6 bg-primary-500/10 rounded-full flex items-center justify-center">
          <Lock className="w-8 h-8 md:w-10 md:h-10 text-primary-500" />
        </div>

        {/* Title */}
        <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">
          {isNotStarted ? 'Start Your Intensive First' : 'Complete Previous Step First'}
        </h2>

        {/* Description */}
        <p className="text-sm md:text-base text-neutral-400 mb-6 md:mb-8">
          {isNotStarted ? (
            <>
              This page unlocks after you start your 72-Hour Activation Intensive.
              Begin your transformation journey now!
            </>
          ) : nextStep ? (
            <>
              This page unlocks after you complete <span className="text-white font-medium">{nextStep.title}</span>. 
              Stay on track with your 14-step activation journey!
            </>
          ) : (
            <>
              Complete the previous steps in your activation journey to unlock this page.
            </>
          )}
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {nextStep ? (
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push(nextStep.href)}
              className="w-full text-sm md:text-base"
            >
              {isNotStarted ? (
                <>
                  Start My Activation Intensive
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
                </>
              ) : (
                <>
                  Go to Step {nextStep.stepNumber}: {nextStep.title}
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push('/intensive/dashboard')}
              className="w-full text-sm md:text-base"
            >
              View Dashboard
              <LayoutDashboard className="w-4 h-4 md:w-5 md:h-5 ml-2" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/intensive/dashboard')}
            className="text-xs md:text-sm"
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Go to Intensive Dashboard
          </Button>
        </div>
      </Card>
    </div>
  )
}

