'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { SECTIONS, sectionForPath } from '@/lib/app-shell/sections'

/**
 * Desktop left rail: the same seven sections as the pill and header, in the
 * same order and colors. Icon-only at rest, labels on hover.
 */
export function RailNav() {
  const pathname = usePathname()
  const active = sectionForPath(pathname)

  return (
    <nav
      aria-label="Primary"
      data-shell-rail
      className={cn(
        'group/rail fixed inset-y-0 left-0 z-40 hidden lg:flex flex-col',
        'w-[72px] hover:w-[232px] transition-[width] duration-200 ease-out',
        'glass-chrome border-y-0 border-l-0 rounded-none',
      )}
      style={{ paddingTop: 'var(--native-inset-top, 0px)' }}
    >
      <Link href="/home" className="flex h-14 items-center gap-3 px-5 text-white" aria-label="Vibration Fit home">
        <span className="hp-display text-[22px] leading-none text-[#39FF14]">vf</span>
        <span className="whitespace-nowrap text-sm font-semibold opacity-0 transition-opacity group-hover/rail:opacity-100">
          Vibration Fit
        </span>
      </Link>
      <ul className="mt-2 flex flex-1 flex-col gap-1 px-3">
        {SECTIONS.map((section) => {
          const isActive = section.id === active.id
          const Icon = section.icon
          return (
            <li key={section.id} data-section={section.accent === 'viva' ? 'viva' : undefined}>
              <Link
                href={section.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex h-11 items-center gap-3 rounded-2xl px-3 transition-colors',
                  isActive
                    ? 'bg-[var(--section-accent-soft)] text-[var(--section-accent)]'
                    : 'text-white/70 hover:bg-white/5 hover:text-white',
                )}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.25 : 1.75} />
                <span className="whitespace-nowrap text-sm font-medium opacity-0 transition-opacity group-hover/rail:opacity-100">
                  {section.label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
