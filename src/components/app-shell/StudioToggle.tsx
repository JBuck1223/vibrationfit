'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export interface StudioToggleOption {
  label: string
  href: string
  active: boolean
}

/**
 * The two-way switch at the top of a studio in the app shell (Listen | Create,
 * My Journal | Write). Full width on phones, a fixed centered pill on desktop.
 */
export function StudioToggle({ options, label, className }: { options: StudioToggleOption[]; label: string; className?: string }) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn('grid rounded-full border border-white/15 bg-white/[0.05] p-1 md:w-[320px]', className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => (
        <Link
          key={o.href}
          href={o.href}
          role="tab"
          aria-selected={o.active}
          className={cn(
            'rounded-full py-2 text-center text-sm font-semibold transition-colors',
            o.active ? 'bg-[#39FF14] text-black' : 'text-white/75 hover:text-white',
          )}
        >
          {o.label}
        </Link>
      ))}
    </div>
  )
}
