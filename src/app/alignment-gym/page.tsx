'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlignmentGymHub, type AlignmentGymTourAnchor } from '@/components/alignment-gym/AlignmentGymHub'
import { AlignmentGymIntensiveTour } from '@/components/intensive/AlignmentGymIntensiveTour'
import { createClient } from '@/lib/supabase/client'
import { isAlignmentGymSessionsLocked } from '@/lib/intensive/alignment-gym-access'
import { Container, Spinner } from '@/lib/design-system/components'
import { useLifeActivation } from '@/hooks/useLifeActivation'
import { firstIncompleteOnboarding } from '@/lib/life-activation/steps'

export default function AlignmentGymPage() {
  const router = useRouter()
  const { progress, completeOnboardingStep } = useLifeActivation()
  const [sessionsLocked, setSessionsLocked] = useState<boolean | null>(null)
  const [tourAnchor, setTourAnchor] = useState<AlignmentGymTourAnchor | null>(null)
  const showBeginTour = Boolean(
    progress &&
    !progress.onboarding_completed_at &&
    firstIncompleteOnboarding(progress.onboarding) === 'gym',
  )

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setSessionsLocked(false)
        return
      }
      setSessionsLocked(await isAlignmentGymSessionsLocked(supabase, user.id))
    }
    void load()
  }, [])

  if (sessionsLocked === null) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  return (
    <>
      <AlignmentGymHub
        statsUntilGraduation={sessionsLocked}
        activeTourAnchor={showBeginTour ? tourAnchor : null}
      />
      {showBeginTour && (
        <AlignmentGymIntensiveTour
          alreadyCompleted={false}
          onActiveAnchorChange={setTourAnchor}
          boundsClassName="fixed inset-0 md:left-64 md:right-0"
          onFinish={async () => {
            await completeOnboardingStep('gym')
            router.push('/map/update')
          }}
        />
      )}
    </>
  )
}
