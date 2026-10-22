'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { PILL_SECTIONS, sectionForPath } from '@/lib/app-shell/sections'
import { isNativeShell } from '@/lib/mobile/native-shell'

async function tapHaptic() {
  if (!isNativeShell()) return
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
    await Haptics.impact({ style: ImpactStyle.Light })
  } catch {
    // Haptics unavailable on this device; the tap still navigates.
  }
}

/**
 * The floating glass pill on phones, tablets and the native apps.
 * Hidden on desktop (the rail takes over) and while the keyboard is open.
 */
export function PillNav() {
  const pathname = usePathname()
  const active = sectionForPath(pathname)

  return (
    <nav
      aria-label="Primary"
      data-shell-pill
      className={cn(
        'fixed inset-x-4 z-40 lg:hidden',
        'bottom-[calc(env(safe-area-inset-bottom,0px)+12px)]',
        'glass-chrome rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.55)]',
        'transition-transform duration-200 ease-out',
        'data-[keyboard=open]:translate-y-[140%]',
      )}
      style={{ height: 'var(--shell-nav-height)' }}
    >
      <ul className="flex h-full items-stretch justify-around px-1">
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
                  'relative flex flex-1 flex-col items-center justify-center gap-1 rounded-full',
                  'text-[11px] font-medium tracking-wide transition-colors',
                  isActive ? 'text-[var(--section-accent)]' : 'text-white/70 active:text-white',
                )}
              >
                <Icon
                  className={cn('h-[22px] w-[22px] transition-transform', isActive && 'scale-105')}
                  strokeWidth={isActive ? 2.25 : 1.75}
                  style={isActive ? { filter: 'drop-shadow(0 0 8px var(--section-accent-soft))' } : undefined}
                />
                <span>{section.label}</span>
                <span
                  aria-hidden
                  className={cn(
                    'absolute bottom-1.5 h-1 w-1 rounded-full bg-[var(--section-accent)] transition-opacity',
                    isActive ? 'opacity-100' : 'opacity-0',
                  )}
                />
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
