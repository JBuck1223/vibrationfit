'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Rocket, Mail, CheckCircle, HelpCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Target, User, Headphones, BookOpen, ImageIcon, Settings, ClipboardList, Map, Unlock, Compass } from 'lucide-react'
import { useIntensiveStep } from './IntensiveStepContext'

interface StepRoute {
  pathPrefix: string
  areaName: string
  areaIcon: LucideIcon
  stepNumber: number
  stepLabel: string
  subtitle: string
}

const STEP_ROUTES: StepRoute[] = [
  // Pre-onboarding
  { pathPrefix: '/intensive/welcome', areaName: 'Activation Intensive', areaIcon: Rocket, stepNumber: 0, stepLabel: '', subtitle: 'Your 14-step journey to creating and activating the life you truly desire.' },
  { pathPrefix: '/intensive/start', areaName: 'Activation Intensive', areaIcon: Rocket, stepNumber: 0, stepLabel: 'Start Intensive', subtitle: 'Your 14-step journey to creating and activating the life you truly desire begins now.' },
  { pathPrefix: '/intensive/check-email', areaName: 'Check Email', areaIcon: Mail, stepNumber: 0, stepLabel: '', subtitle: 'Your payment was successful!' },
  { pathPrefix: '/intensive/dashboard', areaName: 'Activation Intensive', areaIcon: Rocket, stepNumber: 0, stepLabel: '', subtitle: 'Follow each step in order. Complete all 14 to graduate.' },

  // Setup
  { pathPrefix: '/intensive/account/settings', areaName: 'Account Settings', areaIcon: Settings, stepNumber: 1, stepLabel: 'Account Settings', subtitle: 'Manage your personal information and preferences' },
  { pathPrefix: '/intensive/intake', areaName: 'Baseline Intake', areaIcon: ClipboardList, stepNumber: 2, stepLabel: 'Baseline Intake', subtitle: 'Help us understand where you are today so we can measure your transformation.' },

  // Foundation
  { pathPrefix: '/intensive/profile', areaName: 'My Profile', areaIcon: User, stepNumber: 3, stepLabel: 'Create Your Profile', subtitle: 'Your profile is the foundation of your journey with Vibration Fit.' },

  // Vision Creation
  { pathPrefix: '/intensive/life-vision/create', areaName: 'Life Vision', areaIcon: Target, stepNumber: 4, stepLabel: 'Create Your Life Vision', subtitle: 'Your Life Vision is the blueprint for the life you choose to create.' },
  { pathPrefix: '/intensive/life-vision', areaName: 'Life Vision', areaIcon: Target, stepNumber: 4, stepLabel: 'Life Vision', subtitle: '' },

  // Audio (more specific prefixes first)
  { pathPrefix: '/intensive/audio/generate', areaName: 'Audio Studio', areaIcon: Headphones, stepNumber: 5, stepLabel: 'Generate Vision Audio', subtitle: '' },
  { pathPrefix: '/intensive/audio/record', areaName: 'Audio Studio', areaIcon: Headphones, stepNumber: 6, stepLabel: 'Record Your Voice', subtitle: '' },
  { pathPrefix: '/intensive/audio/mix', areaName: 'Audio Studio', areaIcon: Headphones, stepNumber: 7, stepLabel: 'Create Audio Mix', subtitle: '' },
  { pathPrefix: '/intensive/audio', areaName: 'Audio Studio', areaIcon: Headphones, stepNumber: 5, stepLabel: 'Vision Audio', subtitle: '' },

  // Activation
  { pathPrefix: '/intensive/vision-board', areaName: 'Vision Board', areaIcon: ImageIcon, stepNumber: 8, stepLabel: 'Create Vision Board', subtitle: '' },
  { pathPrefix: '/intensive/journal', areaName: 'Journal', areaIcon: BookOpen, stepNumber: 9, stepLabel: 'First Journal Entry', subtitle: '' },

  // Community
  { pathPrefix: '/intensive/vibe-tribe/post', areaName: 'Vibe Tribe', areaIcon: User, stepNumber: 10, stepLabel: 'First Vibe Tribe Post', subtitle: 'Introduce yourself to the community.' },
  { pathPrefix: '/intensive/vibe-tribe/engage', areaName: 'Vibe Tribe', areaIcon: User, stepNumber: 11, stepLabel: 'Engage in Vibe Tribe', subtitle: '' },
  { pathPrefix: '/intensive/vibe-tribe', areaName: 'Vibe Tribe', areaIcon: User, stepNumber: 10, stepLabel: 'Vibe Tribe', subtitle: '' },
  { pathPrefix: '/intensive/alignment-gym', areaName: 'Alignment Gym', areaIcon: Target, stepNumber: 12, stepLabel: 'Alignment Gym', subtitle: 'Weekly live group coaching to keep you aligned with your Life Vision.' },

  // Completion
  {
    pathPrefix: '/intensive/map',
    areaName: 'MAP',
    areaIcon: Map,
    stepNumber: 13,
    stepLabel: 'MAP — My Alignment Plan',
    subtitle: '',
  },
  { pathPrefix: '/intensive/journey', areaName: 'Journey', areaIcon: Compass, stepNumber: 0, stepLabel: '', subtitle: '' },
  { pathPrefix: '/intensive/unlock', areaName: 'Graduation', areaIcon: Unlock, stepNumber: 14, stepLabel: 'Graduation', subtitle: "Graduate into full Vision Pro member mode." },
]

function resolveStep(pathname: string): StepRoute {
  for (const route of STEP_ROUTES) {
    if (pathname.startsWith(route.pathPrefix)) return route
  }
  return { pathPrefix: '/intensive', areaName: 'Intensive', areaIcon: Target, stepNumber: 0, stepLabel: '', subtitle: '' }
}

interface IntensiveStepBarProps {
  subtitle?: string
}

function formatCompletedDate(iso: string): string {
  const d = new Date(iso)
  const day = d.getDate()
  const month = d.toLocaleDateString('en-US', { month: 'long' })
  const suffix =
    day > 3 && day < 21 ? 'th' : [null, 'st', 'nd', 'rd'][day % 10] ?? 'th'
  return `${month} ${day}${suffix}`
}

function CompleteBadge({ completedAt }: { completedAt: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [open])

  return (
    <div ref={ref} className="relative inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className="inline-flex items-center gap-1 rounded-full bg-primary-500/15 border border-primary-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-primary-400 uppercase tracking-wide">
        <CheckCircle className="w-3 h-3" />
        Complete
      </span>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-center w-5 h-5 rounded-full text-neutral-500 hover:text-neutral-300 transition-colors"
        aria-label="Completion details"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 z-[100] w-64 whitespace-normal rounded-xl bg-neutral-800 border border-neutral-700 shadow-xl p-3 text-xs text-neutral-300 leading-relaxed">
          <div className="absolute -top-1.5 right-3 w-3 h-3 rotate-45 bg-neutral-800 border-l border-t border-neutral-700" />
          <span className="relative">
            Completed {formatCompletedDate(completedAt)}. To keep your 72-Hour Activation moving, return to your Dashboard and continue with your next step.
          </span>
        </div>
      )}
    </div>
  )
}

export function IntensiveStepBar({ subtitle: subtitleOverride }: IntensiveStepBarProps = {}) {
  const pathname = usePathname()
  const resolved = resolveStep(pathname)
  const { areaName, areaIcon: AreaIcon, stepNumber, stepLabel } = resolved
  const { completedAt } = useIntensiveStep()
  const subtitle = subtitleOverride ?? resolved.subtitle
  const displayTitle = stepLabel || areaName

  return (
    <>
      {/* Mobile */}
      <div className="md:hidden w-full min-w-0 border-b border-neutral-800/60 bg-neutral-850">
        <div
          className="flex items-center justify-center gap-2.5 px-4 pb-2.5"
          style={{ paddingTop: 'calc(0.5rem + env(safe-area-inset-top, 0px))' }}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#39FF14]/10">
            <AreaIcon className="h-4 w-4 text-[#39FF14]" />
          </div>
          <span className="max-w-[min(72vw,18rem)] truncate text-base font-bold tracking-tight text-white">
            {displayTitle}
          </span>
        </div>
        {(stepNumber > 0 || stepLabel) && (
          <div className="w-full min-w-0 px-3 pb-2.5">
            <div className="w-full rounded-xl bg-zinc-950/90 ring-1 ring-inset ring-white/[0.08]">
              <div className="flex w-full items-center justify-center gap-2 px-4 py-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">
                  Step {stepNumber} of 14
                </span>
                {completedAt && (
                  <>
                    <span className="text-neutral-700">·</span>
                    <CompleteBadge completedAt={completedAt} />
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        {subtitle && (
          <div className="px-4 pb-2.5">
            <p className="text-xs text-neutral-400 text-center leading-relaxed">{subtitle}</p>
          </div>
        )}
      </div>

      {/* Desktop */}
      <div className="hidden md:block rounded-2xl border-2 border-[#333] bg-neutral-850">
        <div className="px-6">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center">
            <div className="flex items-center gap-3 py-3">
              <div className="w-9 h-9 rounded-xl bg-[#39FF14]/10 flex items-center justify-center">
                <AreaIcon className="w-5 h-5 text-[#39FF14]" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">{displayTitle}</h1>
              {completedAt && <CompleteBadge completedAt={completedAt} />}
            </div>
            {(stepNumber > 0 || stepLabel) && (
              <div className="rounded-xl bg-zinc-950/90 ring-1 ring-inset ring-white/[0.08]">
                <div className="flex items-center justify-center gap-2.5 px-5 py-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">
                    Step {stepNumber} of 14
                  </span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 justify-end py-3">
              <Link
                href="/intensive/dashboard"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/80 border border-neutral-700/50 hover:border-neutral-600 transition-colors text-xs font-medium text-neutral-400 hover:text-neutral-200"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-[#39FF14] flex-shrink-0" />
                Dashboard
              </Link>
            </div>
          </div>
          {subtitle && (
            <div className="pb-3 -mt-1">
              <p className="text-sm text-neutral-400 text-center leading-relaxed">{subtitle}</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
