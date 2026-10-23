'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Stack } from '@/lib/design-system/components'
import { useInShell } from '@/lib/app-shell/shell-context'
import { SetGoalForm } from '../set-goal-form'

/** Read by the Goals page: open the new-goal form in place. */
const OPEN_NEW_GOAL_KEY = 'vf_open_new_goal'

export default function AbundanceGoalsNewPage() {
  const inShell = useInShell()
  const router = useRouter()

  // In the app shell a new goal is added on the Goals page itself, so the
  // tabs stay put; send old links there with the form open.
  useEffect(() => {
    if (!inShell) return
    try {
      sessionStorage.setItem(OPEN_NEW_GOAL_KEY, '1')
    } catch {
      /* storage unavailable */
    }
    router.replace('/abundance-tracker/goals')
  }, [inShell, router])

  if (inShell) return null

  return (
    <Container size="xl">
      <Stack gap="lg">
        <h1 className="sr-only">New money goal</h1>
        <SetGoalForm />
      </Stack>
    </Container>
  )
}
