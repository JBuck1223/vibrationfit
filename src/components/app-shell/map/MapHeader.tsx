'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useInShell } from '@/lib/app-shell/shell-context'
import { useMapStudio } from '@/components/map-studio/MapStudioContext'
import { StudioToggle } from '../StudioToggle'
import { ShellWalkthroughButton } from '../ShellWalkthroughButton'

const VIEWS = [
  { id: 'day', label: 'Day', tour: 'map-view-day' },
  { id: 'week', label: 'Week', tour: 'map-view-week' },
  { id: 'month', label: 'Month', tour: 'map-view-month' },
] as const

/**
 * MAP's header in the app shell, in place of the studio's top bar: a centered
 * View | Update toggle, Day / Week / Month pills on the plan, and a back
 * arrow on a single plan.
 */
export function MapHeader() {
  const inShell = useInShell()
  const path = (usePathname() ?? '/map').replace(/\/$/, '') || '/map'
  const { viewMode, setViewMode } = useMapStudio()
  if (!inShell) return null

  const onView = path === '/map'
  const onUpdate = path.startsWith('/map/update')

  if (!onView && !onUpdate) {
    return (
      <div className="mb-5 flex items-center gap-2">
        <Link href="/map" aria-label="Back" className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/[0.06]">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-2xl font-bold text-white">My Alignment Plan</h1>
        <ShellWalkthroughButton />
      </div>
    )
  }

  return (
    <div className="mb-5 space-y-3">
      <h1 className="sr-only">My Alignment Plan</h1>
      <div className="flex justify-center">
        <StudioToggle
          label="MAP"
          className="w-full md:w-[320px]"
          options={[
            { label: 'View', href: '/map', active: onView, dataTour: 'studio-tab-map-view' },
            { label: 'Update', href: '/map/update', active: onUpdate, dataTour: 'studio-tab-map-update' },
          ]}
        />
        <ShellWalkthroughButton />
      </div>
      {onView ? (
        <div className="flex justify-center gap-2" role="group" aria-label="Plan view">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              data-tour={v.tour}
              aria-pressed={viewMode === v.id}
              onClick={() => setViewMode(v.id)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                viewMode === v.id ? 'border-[#39FF14] bg-[rgba(57,255,20,0.16)] text-[#39FF14]' : 'border-white/15 bg-white/[0.05] text-white/80 hover:text-white',
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
