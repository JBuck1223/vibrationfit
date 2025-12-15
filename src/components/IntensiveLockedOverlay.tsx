'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button, Card } from '@/lib/design-system/components'
import { Lock, ArrowRight, LayoutDashboard } from 'lucide-react'

export function IntensiveLockedOverlay() {
  const router = useRouter()
  const [nextStep, setNextStep] = useState<{ title: string; href: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNextStep()
  }, [])

  const loadNextStep = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: intensive } = await supabase
        .from('intensive_purchases')
        .select('id')
        .eq('user_id', user.id)
        .in('completion_status', ['pending', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!intensive) return

      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('*')
        .eq('intensive_id', intensive.id)
        .maybeSingle()

      if (!checklist) return

      // Determine next step
      const steps = [
        { id: 'profile', title: 'Complete Your Profile', href: '/profile/active/edit', completed: !!checklist.profile_completed },
        { id: 'assessment', title: 'Take Assessment', href: '/assessment', completed: !!checklist.assessment_completed },
        { id: 'call', title: 'Schedule Call', href: '/intensive/schedule-call', completed: !!checklist.call_scheduled },
        { id: 'vision', title: 'Build Your Vision', href: '/vision/build', completed: !!checklist.vision_built },
        { id: 'refine', title: 'Refine Vision', href: '/intensive/refine-vision', completed: !!checklist.vision_refined },
        { id: 'audio', title: 'Generate Audio', href: '/life-vision?action=audio', completed: !!checklist.audio_generated },
        { id: 'board', title: 'Create Vision Board', href: '/vision-board', completed: !!checklist.vision_board_completed },
        { id: 'journal', title: 'First Journal Entry', href: '/journal/new', completed: !!checklist.first_journal_entry },
        { id: 'prep', title: 'Calibration Prep', href: '/intensive/call-prep', completed: !!checklist.calibration_call_completed },
        { id: 'activate', title: 'Activation Protocol', href: '/intensive/activation-protocol', completed: !!checklist.activation_protocol_completed },
      ]

      const next = steps.find(s => !s.completed)
      if (next) {
        setNextStep({ title: next.title, href: next.href })
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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card variant="elevated" className="max-w-md w-full p-6 md:p-8 text-center">
        {/* Lock Icon */}
        <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 md:mb-6 bg-primary-500/10 rounded-full flex items-center justify-center">
          <Lock className="w-8 h-8 md:w-10 md:h-10 text-primary-500" />
        </div>

        {/* Title */}
        <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">
          Complete Your Intensive First
        </h2>

        {/* Description */}
        <p className="text-sm md:text-base text-neutral-400 mb-6 md:mb-8">
          This page is locked until you complete your 72-Hour Activation Intensive. 
          Focus on your journey—unlock the full platform when you finish!
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
              Continue: {nextStep.title}
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
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

