'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SECTIONS, areaForPath, sectionForPath } from '@/lib/app-shell/sections'

const COLLAPSED_KEY = 'vf-shell-rail-collapsed'
export const RAIL_WIDTH_EXPANDED = 240
export const RAIL_WIDTH_COLLAPSED = 72

/**
 * Desktop sidebar. The seven sections with labels; the section you are in
 * opens to show its areas (the studios members know by name) with the current
 * one lit. Collapses to an icon rail and remembers the choice.
 */
export function RailNav() {
  const pathname = usePathname()
  const active = sectionForPath(pathname)
  const activeArea = areaForPath(active, pathname)
  const [collapsed, setCollapsed] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_KEY) === 'true')
    } catch {
      // Storage unavailable: stay expanded.
    }
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!mounted) return
    try {
      localStorage.setItem(COLLAPSED_KEY, String(collapsed))
    } catch {
      // Ignore; the choice just won't persist.
    }
    document.documentElement.style.setProperty(
      '--shell-rail-width',
      `${collapsed ? RAIL_WIDTH_COLLAPSED : RAIL_WIDTH_EXPANDED}px`,
    )
  }, [collapsed, mounted])

  return (
    <nav
      aria-label="Primary"
      data-shell-rail
      className={cn(
        'fixed inset-y-0 left-0 z-40 hidden lg:flex flex-col',
        'glass-chrome border-y-0 border-l-0 rounded-none',
        'transition-[width] duration-200 ease-out',
      )}
      style={{
        width: collapsed ? RAIL_WIDTH_COLLAPSED : RAIL_WIDTH_EXPANDED,
        paddingTop: 'var(--native-inset-top, 0px)',
      }}
    >
      <Link href="/home" className="flex h-14 items-center gap-3 px-5 text-white" aria-label="Vibration Fit home">
        <span className="hp-display text-[22px] leading-none text-[#39FF14]">vf</span>
        {!collapsed && <span className="whitespace-nowrap text-sm font-semibold">Vibration Fit</span>}
      </Link>

      <ul className="mt-1 flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-3">
        {SECTIONS.map((section) => {
          const isActive = section.id === active.id
          const Icon = section.icon
          const showAreas = isActive && !collapsed && section.areas.length > 0
          return (
            <li key={section.id} data-section={section.accent === 'viva' ? 'viva' : undefined}>
              <Link
                href={section.href}
                aria-current={isActive && !activeArea ? 'page' : undefined}
                title={collapsed ? section.label : undefined}
                className={cn(
                  'flex h-11 items-center gap-3 rounded-2xl px-3 transition-colors',
                  isActive
                    ? 'bg-[var(--section-accent-soft)] text-[var(--section-accent)]'
                    : 'text-white/70 hover:bg-white/5 hover:text-white',
                  collapsed && 'justify-center px-0',
                )}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.25 : 1.75} />
                {!collapsed && <span className="whitespace-nowrap text-sm font-medium">{section.label}</span>}
              </Link>

              {showAreas && (
                <ul className="mb-2 mt-1 flex flex-col gap-0.5 pl-3">
                  {section.areas.map((area) => {
                    const AreaIcon = area.icon
                    const here = activeArea?.href === area.href
                    return (
                      <li key={area.href}>
                        <Link
                          href={area.href}
                          aria-current={here ? 'page' : undefined}
                          className={cn(
                            'flex h-9 items-center gap-2.5 rounded-xl px-3 text-[13px] transition-colors',
                            here ? 'bg-white/10 font-semibold text-white' : 'text-white/65 hover:bg-white/5 hover:text-white',
                          )}
                        >
                          <AreaIcon className={cn('h-4 w-4 shrink-0', here && 'text-[var(--section-accent)]')} strokeWidth={1.75} />
                          <span className="truncate">{area.label}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}
      </ul>

      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="mx-3 mb-[max(12px,env(safe-area-inset-bottom,0px))] flex h-10 items-center justify-center gap-2 rounded-2xl text-white/60 hover:bg-white/5 hover:text-white"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        {!collapsed && <span className="text-xs">Collapse</span>}
      </button>
    </nav>
  )
}
