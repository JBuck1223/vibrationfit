'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Circle,
  FileText,
  Headphones,
  Lock,
  Map,
  MessageSquarePlus,
  Rocket,
  Settings,
  Target,
  Unlock,
  Video,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLifeActivation } from '@/hooks/useLifeActivation'
import { LIFE_ACTIVATION_COPY } from '@/lib/life-activation/copy'
import {
  getLifeActivationSidebarItem,
  getLifeActivationSidebarMode,
  isLifeActivationSidebarActive,
} from '@/lib/life-activation/sidebar'
import {
  firstIncompleteOnboarding,
  ONBOARDING_PHASES,
  ONBOARDING_STEPS,
  withSequentialLocks,
  type OnboardingStepId,
} from '@/lib/life-activation/steps'

const STEP_ICONS: Record<OnboardingStepId, LucideIcon> = {
  welcome: Rocket,
  account: Settings,
  intake: FileText,
  vision: Target,
  kit: Headphones,
  tribe: MessageSquarePlus,
  gym: Video,
  map: Map,
  unlock: Unlock,
  complete: Unlock,
}

function pathOf(href: string) {
  return href.split('?')[0]
}

export function LifeActivationSidebarCard({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const { progress } = useLifeActivation()

  const mode = getLifeActivationSidebarMode(progress)
  if (mode === 'hidden') return null

  if (mode === 'tools-training' || collapsed || !progress) {
    const item = getLifeActivationSidebarItem(mode === 'tools-training' ? 'tools-training' : 'getting-started')
    const Icon = item.icon
    const isActive = isLifeActivationSidebarActive(mode === 'hidden' ? 'getting-started' : mode, pathname)
    return (
      <Link
        href={item.href}
        title={item.description}
        className={cn(
          'flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200',
          collapsed ? 'justify-center p-2' : 'px-3 py-2.5',
          isActive
            ? 'bg-[#00CC44]/20 text-[#00CC44] border border-[#00CC44]/30'
            : 'text-neutral-300 hover:text-white hover:bg-neutral-800',
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {!collapsed && <span className="flex-1">{item.name}</span>}
      </Link>
    )
  }

  const steps = withSequentialLocks(
    ONBOARDING_STEPS.map((step) => ({
      ...step,
      completed: Boolean(progress.onboarding[step.id]),
    })),
  )
  const currentId = firstIncompleteOnboarding(progress.onboarding)
  const doneCount = steps.filter((step) => step.completed).length

  const isCurrentPage = (href: string, id: OnboardingStepId) => {
    const path = pathOf(href)
    if (pathname === '/begin' && id === currentId) return true
    if (id === 'account' && pathname.startsWith('/account')) return true
    if (id === 'vision' && pathname.startsWith('/life-vision')) return true
    if (id === 'tribe' && pathname.startsWith('/vibe-tribe')) return true
    if (id === 'gym' && pathname.startsWith('/alignment-gym')) return true
    if (id === 'map' && pathname.startsWith('/map')) return true
    if (path === '/begin') return false
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  return (
    <div className="mb-3 space-y-3">
      <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
        {LIFE_ACTIVATION_COPY.sidebar.onboardingTitle}
        <span className="ml-2 text-neutral-600">{doneCount} of {steps.length}</span>
      </p>
      {ONBOARDING_PHASES.map((phase) => {
        const phaseSteps = steps.filter((step) => step.phase === phase)
        if (phaseSteps.length === 0) return null
        return (
          <div key={phase}>
            <div className="mb-1 px-1 text-[10px] uppercase tracking-wider text-neutral-600">
              {phase}
            </div>
            <div className="space-y-1">
              {phaseSteps.map((step) => {
                const Icon = STEP_ICONS[step.id]
                const active = isCurrentPage(step.href, step.id)
                return (
                  <button
                    key={step.id}
                    type="button"
                    disabled={step.locked}
                    onClick={() => {
                      if (!step.locked) router.push(step.completed ? step.viewHref : step.href)
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium transition-colors',
                      active
                        ? 'border border-primary-500/50 bg-primary-500/10 text-white'
                        : step.locked
                          ? 'cursor-not-allowed text-neutral-600'
                          : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200',
                    )}
                  >
                    <span className="w-3 font-mono text-[10px] text-neutral-600">{step.number}</span>
                    {step.completed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary-500" />
                    ) : step.locked ? (
                      <Lock className="h-3.5 w-3.5 shrink-0 text-neutral-700" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 shrink-0 text-neutral-600" />
                    )}
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{step.title}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
