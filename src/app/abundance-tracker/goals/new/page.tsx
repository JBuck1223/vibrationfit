'use client'

import React from 'react'
import { Container, Stack } from '@/lib/design-system/components'
import { SetGoalForm } from '../set-goal-form'

export default function AbundanceGoalsNewPage() {
  return (
    <Container size="xl">
      <Stack gap="lg">
        <h1 className="sr-only">New money goal</h1>
        <SetGoalForm />
      </Stack>
    </Container>
  )
}
