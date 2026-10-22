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
        'fixed inset-x-3 z-40 lg:hidden',
        'bottom-[calc(env(safe-area-inset-bottom,0px)+10px)]',
        // Matches Home's glass cards: violet-dark translucent fill, one hairline outline.
        'rounded-[36px] border border-white/[0.14]',
        'bg-[linear-gradient(180deg,rgba(44,36,60,0.55)_0%,rgba(22,18,32,0.68)_100%)]',
        'shadow-[0_14px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl backdrop-saturate-150',
        'transition-transform duration-200 ease-out',
        'data-[keyboard=open]:translate-y-[140%]',
      )}
      style={{ height: 'var(--shell-nav-height)' }}
    >
      <ul className="flex h-full items-stretch justify-around px-2">
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
                  'relative flex flex-1 flex-col items-center justify-center gap-1 pb-2 pt-1 rounded-[28px]',
                  'text-[13px] font-medium transition-colors',
                  isActive ? 'text-[var(--section-accent)]' : 'text-white/85 active:text-white',
                )}
              >
                <Icon
                  className={cn('h-[26px] w-[26px] transition-transform', isActive && 'scale-105')}
                  strokeWidth={isActive ? 2 : 1.5}
                  style={isActive ? { filter: 'drop-shadow(0 0 8px var(--section-accent-soft))' } : undefined}
                />
                <span>{section.label}</span>
                <span
                  aria-hidden
                  className={cn(
                    'absolute bottom-1 h-[5px] w-[5px] rounded-full bg-[var(--section-accent)] transition-opacity',
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
