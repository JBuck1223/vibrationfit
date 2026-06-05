'use client'

import { useEffect, useState } from 'react'
import { IntensiveStepCompleteModal } from '@/lib/design-system/components'
import { useIntensiveStepCompleteModal } from '@/lib/intensive/use-step-complete-modal'
import { useIntensiveStep } from '@/components/intensive-studio/IntensiveStepContext'
import {
  AlignmentGymHub,
  type AlignmentGymTourAnchor,
} from '@/components/alignment-gym/AlignmentGymHub'
import { AlignmentGymIntensiveTour } from '@/components/intensive/AlignmentGymIntensiveTour'
import { createClient } from '@/lib/supabase/client'

export default function IntensiveAlignmentGymPage() {
  const { setCompletedAt } = useIntensiveStep()
  const { isOpen, stepId, closeModal } = useIntensiveStepCompleteModal()
  const [checklistReady, setChecklistReady] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [completedAt, setLocalCompletedAt] = useState<string | null>(null)
  const [activeTourAnchor, setActiveTourAnchor] = useState<AlignmentGymTourAnchor | null>(null)
  const [coachingOpenFromTour, setCoachingOpenFromTour] = useState(false)
  const [hasGraduated, setHasGraduated] = useState(false)

  useEffect(() => {
    if (completedAt) setCompletedAt(completedAt)
    return () => setCompletedAt(null)
  }, [completedAt, setCompletedAt])

  useEffect(() => {
    let cancelled = false

    async function loadChecklist() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || cancelled) return

        const { data } = await supabase
          .from('intensive_checklist')
          .select('alignment_gym_toured, alignment_gym_toured_at, unlock_completed')
          .eq('user_id', user.id)
          .in('status', ['pending', 'in_progress', 'completed'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (cancelled) return

        if (data?.unlock_completed) {
          setHasGraduated(true)
        }
        if (data?.alignment_gym_toured) {
          setIsCompleted(true)
          setLocalCompletedAt(data.alignment_gym_toured_at)
        }
      } finally {
        if (!cancelled) setChecklistReady(true)
      }
    }

    void loadChecklist()
    return () => {
      cancelled = true
    }
  }, [])

  const tourInProgress = checklistReady && !isCompleted

  return (
    <div className="relative pt-6">
      <AlignmentGymHub
        activeTourAnchor={activeTourAnchor}
        forceWhatIsOpen={activeTourAnchor === 'what-is'}
        skipMapAutoVerify={tourInProgress}
        statsUntilGraduation={!hasGraduated}
        forceCoachingOpen={coachingOpenFromTour}
        onCoachingClose={() => setCoachingOpenFromTour(false)}
      />

      {checklistReady && (
        <AlignmentGymIntensiveTour
          alreadyCompleted={isCompleted}
          onActiveAnchorChange={setActiveTourAnchor}
          onRequestCoaching={() => setCoachingOpenFromTour(true)}
        />
      )}

      <IntensiveStepCompleteModal
        isOpen={isOpen}
        onClose={closeModal}
        stepId={stepId || 'alignment_gym_tour'}
      />
    </div>
  )
}
