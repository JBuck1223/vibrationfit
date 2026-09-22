'use client'

import type { ReactNode } from 'react'
import { CheckCircle, Home, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { userNavigationGroups } from '@/lib/navigation'
import {
  getLifeActivationSidebarItem,
  type LifeActivationSidebarMode,
} from '@/lib/life-activation/sidebar'
import { ONBOARDING_PHASES, ONBOARDING_STEPS, TRAINING_STEPS } from '@/lib/life-activation/steps'

const TOOL_WALKTHROUGHS = TRAINING_STEPS.filter((step) => step.id !== 'complete')

export function MemberSidebarPreview({
  mode,
}: {
  mode: LifeActivationSidebarMode
}) {
  const journey = mode === 'hidden' ? null : getLifeActivationSidebarItem(mode)
  const JourneyIcon = journey?.icon

  return (
    <div className="overflow-hidden rounded-2xl border border-[#222] bg-[#0A0A0A]">
      <div className="flex items-center justify-between border-b border-[#1A1A1A] px-4 py-3">
        <p className="text-sm font-medium text-white">Member sidebar</p>
        <p className="text-[11px] uppercase tracking-wider text-neutral-500">Preview</p>
      </div>
      <div className="p-3">
        <div className="space-y-1">
          {mode === 'getting-started' ? (
            <div className="mb-3 space-y-3">
              <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                Getting Started
              </p>
              {ONBOARDING_PHASES.map((phase) => {
                const phaseSteps = ONBOARDING_STEPS.filter((step) => step.phase === phase)
                if (phaseSteps.length === 0) return null
                return (
                  <div key={phase}>
                    <p className="mb-1 px-1 text-[10px] uppercase tracking-wider text-neutral-600">{phase}</p>
                    <div className="space-y-1">
                      {phaseSteps.map((step) => (
                        <PreviewLink
                          key={step.id}
                          icon={<span className="w-4 text-[10px] text-neutral-600">{step.number}</span>}
                          label={step.title}
                          muted={step.number > 1}
                          active={step.number === 1}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            journey && JourneyIcon && (
              <PreviewLink
                icon={<JourneyIcon className="h-5 w-5 shrink-0" />}
                label={journey.name}
                active
              />
            )
          )}
          <PreviewLink icon={<Home className="h-5 w-5 shrink-0" />} label="Dashboard" />
          <PreviewLink icon={<Sparkles className="h-5 w-5 shrink-0" />} label="VIVA" />
        </div>

        {userNavigationGroups.slice(0, 3).map((group) => (
          <div key={group.name} className="mt-4">
            <p className="mb-1 px-3 text-[11px] uppercase tracking-wider text-neutral-500">
              {group.name}
            </p>
            <div className="space-y-1">
              {group.items.slice(0, 3).map((item) => {
                const Icon = item.icon
                return (
                  <PreviewLink
                    key={item.name}
                    icon={<Icon className="h-5 w-5 shrink-0" />}
                    label={item.name}
                    muted
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {mode === 'tools-training' && (
        <div className="border-t border-[#1A1A1A] px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Tool walk-throughs
          </p>
          <p className="mt-1 text-sm text-neutral-400">
            Same idea as Life Vision: each tool has a short walk-through. Checking one off
            here is just whether they finished that page&apos;s tour.
          </p>
          <ol className="mt-3 space-y-1.5">
            {TOOL_WALKTHROUGHS.map((step, i) => {
              const done = i < 3
              return (
                <li key={step.id} className="flex items-center gap-2 text-sm">
                  <CheckCircle
                    className={cn(
                      'h-4 w-4 shrink-0',
                      done ? 'text-[#39FF14]' : 'text-neutral-700',
                    )}
                  />
                  <span className={done ? 'text-neutral-200' : 'text-neutral-500'}>
                    {step.title}
                  </span>
                </li>
              )
            })}
          </ol>
        </div>
      )}

      {mode === 'hidden' && (
        <div className="border-t border-[#1A1A1A] px-4 py-4">
          <p className="text-sm text-neutral-400">
            Every tool walk-through is done, so the sidebar tab is gone. The regular
            Dashboard and VIVA links stay.
          </p>
        </div>
      )}
    </div>
  )
}

function PreviewLink({
  icon,
  label,
  active,
  muted,
}: {
  icon: ReactNode
  label: string
  active?: boolean
  muted?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
        active
          ? 'border border-[#00CC44]/30 bg-[#00CC44]/20 text-[#00CC44]'
          : muted
            ? 'text-neutral-500'
            : 'text-neutral-300',
      )}
    >
      {icon}
      <span>{label}</span>
    </div>
  )
}
