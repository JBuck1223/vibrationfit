import { Rocket, Wrench, type LucideIcon } from 'lucide-react'
import { LIFE_ACTIVATION_COPY } from './copy'
import type { LifeActivationProgress } from './types'

/**
 * Tools Training is the post-begin sidebar tab. Keep it off the live member
 * sidebar until every tool has a walk-through like Life Vision.
 * Admin/begin can preview the conversion regardless of this flag.
 */
export const LIFE_ACTIVATION_TRAINING_NAV_ENABLED = false

export type LifeActivationSidebarMode = 'getting-started' | 'tools-training' | 'hidden'

export function getLifeActivationSidebarMode(
  progress: LifeActivationProgress | null | undefined,
  options?: { allowTrainingNav?: boolean },
): LifeActivationSidebarMode {
  const allowTraining = options?.allowTrainingNav ?? LIFE_ACTIVATION_TRAINING_NAV_ENABLED
  const onboardingDone = Boolean(progress?.onboarding_completed_at)

  if (!onboardingDone) return 'getting-started'
  if (!allowTraining) return 'hidden'
  if (progress?.training_completed_at || progress?.training_dismissed_at) return 'hidden'
  return 'tools-training'
}

export function getLifeActivationSidebarItem(mode: Exclude<LifeActivationSidebarMode, 'hidden'>): {
  name: string
  href: string
  icon: LucideIcon
  description: string
} {
  if (mode === 'getting-started') {
    return {
      name: LIFE_ACTIVATION_COPY.sidebar.onboardingTitle,
      href: '/begin',
      icon: Rocket,
      description: 'Return to Getting Started',
    }
  }
  return {
    name: LIFE_ACTIVATION_COPY.sidebar.trainingTitle,
    href: '/begin/training',
    icon: Wrench,
    description: 'Walk through each tool',
  }
}

export function isLifeActivationSidebarActive(
  mode: LifeActivationSidebarMode,
  pathname: string,
): boolean {
  if (mode === 'getting-started') {
    if (pathname.startsWith('/begin/training') || pathname.startsWith('/begin/intake')) return false
    return (
      pathname === '/begin' ||
      pathname.startsWith('/begin/') ||
      pathname.startsWith('/life-vision/begin')
    )
  }
  if (mode === 'tools-training') {
    return pathname.startsWith('/begin/training') || pathname.startsWith('/begin/intake')
  }
  return false
}
