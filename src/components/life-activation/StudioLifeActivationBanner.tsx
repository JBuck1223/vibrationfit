'use client'

import { Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { LifeActivationBanner } from './LifeActivationBanner'
import { LIFE_ACTIVATION_COPY } from '@/lib/life-activation/copy'
import type { OnboardingStepId, TrainingStepId } from '@/lib/life-activation/steps'

function StudioLifeActivationBannerInner() {
  const pathname = usePathname()
  const search = useSearchParams()
  const kind = search.get('kind')

  let onboardingStep: OnboardingStepId | undefined
  let trainingStep: TrainingStepId | undefined
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
  } else if (pathname.startsWith('/profile')) {
    trainingStep = 'profile'
    title = 'Life Profile'
    body = 'This snapshot helps VIVA know you. Save a profile, then mark this done.'
  } else if (pathname.startsWith('/story')) {
    if (kind === 'incantation' || kind === 'spark_query') {
      trainingStep = 'spoken'
      title = 'Incantations and SparkQueries'
      body = 'These are the spoken tools from your Activation. Open one, then mark this done.'
    } else {
      trainingStep = 'stories'
      title = 'Stories'
      body = 'Your Activation story lives here. You can make another anytime.'
    }
  } else if (pathname.startsWith('/audio/songs')) {
    trainingStep = 'songs'
    title = 'Songs'
    body = 'Your Activation song is in this library. You can make another whenever you want.'
  } else if (pathname.startsWith('/audio')) {
    trainingStep = 'voice'
    title = 'Your voice'
    body = 'You can narrate your Life Vision in your own voice, or skip this.'
    doneLabel = 'I have seen this'
  } else if (pathname.startsWith('/manifestations')) {
    trainingStep = 'manifestations'
    title = 'Manifestations'
    body = 'Desires live here — Active or Actualized. Open one or add one.'
  } else if (pathname.startsWith('/journal')) {
    trainingStep = 'journal'
    title = 'Journal'
    body = 'One entry is enough to know you can come back whenever something wants to be written.'
  } else if (pathname.startsWith('/daily-paper')) {
    trainingStep = 'daily_paper'
    title = 'Daily Paper'
    body = 'A daily capture. Open it once so you know where it lives.'
  } else if (pathname.startsWith('/viva')) {
    trainingStep = 'viva'
    title = 'Talk with VIVA'
    body = 'She is your coach, not only the one who wrote your vision. Have a conversation, then mark this done.'
  } else if (pathname.startsWith('/map')) {
    trainingStep = 'map'
    title = 'MAP'
    body = 'This is the daily return to the life you just wrote. Review it, then mark this done.'
  } else {
    return null
  }

  return (
    <LifeActivationBanner
      onboardingStep={onboardingStep}
      trainingStep={trainingStep}
      title={title}
      body={body}
      doneLabel={doneLabel}
    />
  )
}

export function StudioLifeActivationBanner() {
  return (
    <Suspense fallback={null}>
      <StudioLifeActivationBannerInner />
    </Suspense>
  )
}
