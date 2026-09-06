'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button, Card, Container, PageHero, Spinner, Stack } from '@/lib/design-system/components'
import { useLifeActivation } from '@/hooks/useLifeActivation'
import { LIFE_ACTIVATION_COPY } from '@/lib/life-activation/copy'

export default function TrainingCompletePage() {
  const { progress, isLoading, completeTrainingStep } = useLifeActivation()

  useEffect(() => {
    if (!progress || progress.training_completed_at) return
    void completeTrainingStep('complete')
  }, [progress, completeTrainingStep])

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
          title={LIFE_ACTIVATION_COPY.trainingComplete.title}
          subtitle={LIFE_ACTIVATION_COPY.trainingComplete.body}
        />
        <Card className="p-6">
          <Link href="/dashboard">
            <Button variant="primary">{LIFE_ACTIVATION_COPY.trainingComplete.dashboardCta}</Button>
          </Link>
        </Card>
      </Stack>
    </Container>
  )
}
