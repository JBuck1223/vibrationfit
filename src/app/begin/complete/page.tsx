'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, Card, Container, PageHero, Spinner, Stack } from '@/lib/design-system/components'
import { useLifeActivation } from '@/hooks/useLifeActivation'
import { LIFE_ACTIVATION_COPY } from '@/lib/life-activation/copy'

export default function BeginCompletePage() {
  const router = useRouter()
  const { progress, isLoading, completeOnboardingStep, startTraining, isUpdating } = useLifeActivation()

  useEffect(() => {
    if (!progress || progress.onboarding_completed_at) return
    if (progress.onboarding.gym) {
      void completeOnboardingStep('complete')
    }
  }, [progress, completeOnboardingStep])

  if (isLoading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          eyebrow={LIFE_ACTIVATION_COPY.complete.eyebrow}
          title={LIFE_ACTIVATION_COPY.complete.title}
          subtitle={LIFE_ACTIVATION_COPY.complete.body}
        />
        <Card className="p-6">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              disabled={isUpdating}
              onClick={async () => {
                await startTraining()
                router.push('/begin/training')
              }}
            >
              {LIFE_ACTIVATION_COPY.complete.trainingCta}
            </Button>
            <Link href="/dashboard">
              <Button variant="secondary">{LIFE_ACTIVATION_COPY.complete.dashboardCta}</Button>
            </Link>
            {progress?.active_vision_id && (
              <Link href={`/life-vision/${progress.active_vision_id}`}>
                <Button variant="ghost">{LIFE_ACTIVATION_COPY.complete.visionCta}</Button>
              </Link>
            )}
          </div>
        </Card>
      </Stack>
    </Container>
  )
}
