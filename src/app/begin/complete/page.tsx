'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Spinner } from '@/lib/design-system/components'
import { signalBeginComplete } from '@/lib/life-activation/celebration'
import { useLifeActivation } from '@/hooks/useLifeActivation'

export default function BeginCompletePage() {
  const router = useRouter()
  const { progress, completeOnboardingStep, isLoading } = useLifeActivation()

  useEffect(() => {
    if (isLoading) return
    if (progress && !progress.onboarding_completed_at && progress.onboarding.map) {
      void completeOnboardingStep('complete')
    }
    signalBeginComplete()
    router.replace('/map')
  }, [completeOnboardingStep, isLoading, progress, router])

  return (
    <Container className="flex min-h-[40vh] items-center justify-center">
      <Spinner size="lg" />
    </Container>
  )
}
