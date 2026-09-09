'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { keys } from '@/lib/query/keys'
import type { LifeActivationPayload } from '@/lib/life-activation/types'
import type { OnboardingStepId } from '@/lib/life-activation/steps'
import type { TrainingCompletionId } from '@/lib/life-activation/walkthroughs'

async function fetchLifeActivation(): Promise<LifeActivationPayload> {
  const res = await fetch('/api/life-activation')
  if (!res.ok) throw new Error('Failed to load Life Activation')
  return res.json()
}

async function patchLifeActivation(body: Record<string, unknown>): Promise<LifeActivationPayload> {
  const res = await fetch('/api/life-activation', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Failed to update Life Activation')
  return res.json()
}

export function useLifeActivation() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: keys.lifeActivation,
    queryFn: fetchLifeActivation,
    retry: 1,
  })

  const mutate = useMutation({
    mutationFn: patchLifeActivation,
    onSuccess: (data) => {
      queryClient.setQueryData(keys.lifeActivation, data)
    },
  })

  return {
    ...query,
    progress: query.data?.progress ?? null,
    seed: query.data?.seed ?? null,
    completeOnboardingStep: (step: OnboardingStepId, extra?: Record<string, unknown>) =>
      mutate.mutateAsync({ action: 'complete_onboarding_step', step, ...extra }),
    completeTrainingStep: (step: TrainingCompletionId) =>
      mutate.mutateAsync({ action: 'complete_training_step', step }),
    startTraining: () => mutate.mutateAsync({ action: 'start_training' }),
    dismissTraining: () => mutate.mutateAsync({ action: 'dismiss_training' }),
    startOnboarding: () => mutate.mutateAsync({ action: 'start' }),
    saveName: (first_name: string) => mutate.mutateAsync({ action: 'save_name', first_name }),
    isUpdating: mutate.isPending,
  }
}
