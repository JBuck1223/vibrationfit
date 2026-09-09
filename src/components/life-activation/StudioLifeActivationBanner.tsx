'use client'

import { usePathname } from 'next/navigation'
import { LifeActivationBanner } from './LifeActivationBanner'
import { LIFE_ACTIVATION_COPY } from '@/lib/life-activation/copy'
import type { OnboardingStepId } from '@/lib/life-activation/steps'

export function StudioLifeActivationBanner() {
  const pathname = usePathname()

  let onboardingStep: OnboardingStepId | undefined
  let title = ''
  let body = ''
  let doneLabel: string | undefined

  if (pathname.startsWith('/vibe-tribe')) {
    onboardingStep = 'tribe'
    title = LIFE_ACTIVATION_COPY.tribe.title
    body = LIFE_ACTIVATION_COPY.tribe.body
    doneLabel = LIFE_ACTIVATION_COPY.tribe.cta
  } else if (pathname.startsWith('/alignment-gym')) {
    onboardingStep = 'gym'
    title = LIFE_ACTIVATION_COPY.gym.title
    body = LIFE_ACTIVATION_COPY.gym.body
    doneLabel = LIFE_ACTIVATION_COPY.gym.cta
  } else {
    return null
  }

  return (
    <LifeActivationBanner
      onboardingStep={onboardingStep}
      title={title}
      body={body}
      doneLabel={doneLabel}
    />
  )
}
