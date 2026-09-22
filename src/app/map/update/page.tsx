'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/lib/design-system/components'
import { MapSystemBuilder } from '@/components/map-studio/MapSystemBuilder'
import { MapCustomUpdate } from '@/components/map-studio/MapCustomUpdate'
import { useLifeActivation } from '@/hooks/useLifeActivation'
import { firstIncompleteOnboarding } from '@/lib/life-activation/steps'

export default function MapUpdatePage() {
  const router = useRouter()
  const { progress, isPending, completeOnboardingStep } = useLifeActivation()
  const progressRef = useRef(progress)
  progressRef.current = progress
  const beginStarter = Boolean(
    progress &&
    !progress.onboarding_completed_at &&
    firstIncompleteOnboarding(progress.onboarding) === 'map',
  )

  return (
    <Container size="xl" className="min-w-0 overflow-x-hidden pb-4">
      <h1
        className="text-center text-xl font-bold tracking-tight text-white sm:text-2xl pt-2 pb-5 sm:pb-6"
        data-tour="map-create-heading"
      >
        My Alignment Plan
      </h1>

      {beginStarter && (
        <p className="text-center text-sm text-neutral-400 -mt-2 pb-5">
          Four starter commitments are already on. Change any of them, or add from the full list, then save.
        </p>
      )}

      <div data-tour="map-create-builder">
        {isPending ? null : (
        <MapSystemBuilder
          showHeader={false}
          variant={beginStarter ? 'begin-starter' : 'full'}
          gridLayout
          customSlot={<MapCustomUpdate showHeader={false} embeddedInPlan />}
          onActivateComplete={async () => {
            const current = progressRef.current
            const creatingForBegin =
              Boolean(current) &&
              !current?.onboarding_completed_at &&
              firstIncompleteOnboarding(current?.onboarding ?? {}) === 'map'
            if (creatingForBegin) {
              await completeOnboardingStep('map')
              router.push('/begin/unlock')
              return
            }
            router.push('/map')
          }}
        />
        )}
      </div>
    </Container>
  )
}
