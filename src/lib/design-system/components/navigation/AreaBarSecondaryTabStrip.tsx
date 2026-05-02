'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../shared-utils'

const GRID_COLS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
}

/** Class names for a single link in a secondary area strip (matches Audio Create / Listen sub-nav). */
export function areaBarSecondaryTabLinkClassName(isActive: boolean) {
  return `flex min-h-[2.75rem] w-full min-w-0 flex-col items-center justify-center gap-0.5 border-b-2 px-0.5 py-2 sm:min-h-11 sm:flex-row sm:gap-1 sm:px-1.5 ${
    isActive
      ? 'border-primary-500 bg-zinc-900/85 font-semibold text-primary-400'
      : 'border-transparent bg-transparent text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200'
  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500/40`
}

export interface AreaBarSecondaryTabItem {
  key: string
  href: string
  label: string
  icon: LucideIcon
  isActive: boolean
  /** Optional e.g. queue count badge (Audio Queue) */
  badge?: React.ReactNode
}

/**
 * Rounded, full-width column tabs with bottom accent on the active item — same shell as Audio Studio secondary nav.
 * Use for Life Vision, Profile, Vision Board, and other `AreaBar` `contextBar` link rows.
 */
export function AreaBarSecondaryTabStrip({
  'aria-label': ariaLabel,
  items,
  className,
}: {
  'aria-label': string
  items: AreaBarSecondaryTabItem[]
  className?: string
}) {
  if (items.length === 0) return null
  const n = Math.max(1, Math.min(6, items.length))
  const gridCols = GRID_COLS[n] ?? 'grid-cols-4'
  return (
    <div className={cn('w-full sm:max-w-2xl sm:mx-auto', className)}>
      <div
        className="w-full overflow-hidden rounded-2xl bg-zinc-950/90 ring-1 ring-inset ring-white/[0.08]"
        role="region"
      >
        <nav className={cn('grid w-full', gridCols)} aria-label={ariaLabel}>
          {items.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.key}
                href={item.href}
                title={item.label}
                className={areaBarSecondaryTabLinkClassName(item.isActive)}
                aria-current={item.isActive ? 'page' : undefined}
              >
                <Icon
                  className={cn('h-3.5 w-3.5 shrink-0 sm:h-3.5 sm:w-3.5', item.isActive && 'text-primary-400')}
                  strokeWidth={2.25}
                  aria-hidden
                />
                <span className="min-w-0 text-center text-[10px] font-medium leading-tight sm:text-xs">
                  {item.label}
                </span>
                {item.badge}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
