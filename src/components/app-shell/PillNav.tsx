'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PILL_SECTIONS, sectionForPath } from '@/lib/app-shell/sections'
import { isNativeShell } from '@/lib/mobile/native-shell'
import { useShellNavStore, type PillSide } from '@/lib/stores/shell-nav-store'

async function tapHaptic() {
  if (!isNativeShell()) return
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
    await Haptics.impact({ style: ImpactStyle.Light })
  } catch {
    // Haptics unavailable on this device; the tap still navigates.
  }
}

const glass = cn(
  'vf-glass border border-white/[0.14]',
  // Matches Home's glass cards: violet-dark translucent fill, one hairline outline.
  'bg-[linear-gradient(180deg,rgba(44,36,60,0.55)_0%,rgba(22,18,32,0.68)_100%)]',
  'shadow-[0_14px_40px_rgba(0,0,0,0.28)] backdrop-blur-2xl backdrop-saturate-150',
  'transition-transform duration-200 ease-out',
  'data-[keyboard=open]:translate-y-[140%]',
)

/**
 * The floating glass pill on phones, tablets and the native apps.
 * Hidden on desktop (the rail takes over) and while the keyboard is open.
 * Members can fold it into a round plus button in either bottom corner.
 */
export function PillNav() {
  const pathname = usePathname()
  const active = sectionForPath(pathname)
  const collapsedSide = useShellNavStore((s) => s.collapsedSide)
  const setCollapsedSide = useShellNavStore((s) => s.setCollapsedSide)

  const collapseTo = (side: PillSide) => {
    void tapHaptic()
    setCollapsedSide(side)
  }

  if (collapsedSide) {
    return (
      <button
        type="button"
        data-shell-pill
        onClick={() => {
          void tapHaptic()
          setCollapsedSide(null)
        }}
        aria-label="Show menu"
        className={cn(
          glass,
          'fixed z-40 flex items-center justify-center rounded-full text-white lg:hidden',
          collapsedSide === 'left' ? 'left-3' : 'right-3',
          'bottom-[var(--shell-nav-bottom)]',
          'h-[var(--shell-nav-height)] w-[var(--shell-nav-height)] active:scale-95',
        )}
      >
        <Plus className="h-6 w-6" strokeWidth={2} />
      </button>
    )
  }

  return (
    <nav
      aria-label="Primary"
      data-shell-pill
      className={cn(
        glass,
        'fixed inset-x-3 z-40 rounded-[32px] lg:hidden',
        'bottom-[var(--shell-nav-bottom)]',
      )}
      style={{ height: 'var(--shell-nav-height)' }}
    >
      <ul className="flex h-full items-stretch justify-around px-1">
        <li className="flex">
          <button
            type="button"
            onClick={() => collapseTo('left')}
            aria-label="Hide menu to the left"
            className="flex w-6 items-center justify-center text-white/45 active:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </li>
        {PILL_SECTIONS.map((section) => {
          const isActive = section.id === active.id
          const Icon = section.icon
          return (
            <li key={section.id} className="flex flex-1" data-section={section.accent === 'viva' ? 'viva' : undefined}>
              <Link
                href={section.href}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => void tapHaptic()}
                className={cn(
                  'relative flex flex-1 flex-col items-center justify-center gap-0.5 pb-1.5 rounded-[26px]',
                  'text-[11px] font-medium transition-colors',
                  isActive ? 'text-[var(--section-accent)]' : 'text-white/85 active:text-white',
                )}
              >
                <Icon
                  className={cn('h-5 w-5 transition-transform', isActive && 'scale-105')}
                  strokeWidth={isActive ? 2 : 1.5}
                  style={isActive ? { filter: 'drop-shadow(0 0 8px var(--section-accent-soft))' } : undefined}
                />
                <span className="whitespace-nowrap">{section.label}</span>
                <span
                  aria-hidden
                  className={cn(
                    'absolute bottom-1 h-1 w-1 rounded-full bg-[var(--section-accent)] transition-opacity',
                    isActive ? 'opacity-100' : 'opacity-0',
                  )}
                />
              </Link>
            </li>
          )
        })}
        <li className="flex">
          <button
            type="button"
            onClick={() => collapseTo('right')}
            aria-label="Hide menu to the right"
            className="flex w-6 items-center justify-center text-white/45 active:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </li>
      </ul>
    </nav>
  )
}
