'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { areaForPath, getSection, type SectionId } from '@/lib/app-shell/sections'

/**
 * The areas (studios) under a section as a row of chips, so members can go
 * straight to Audio, MAP, Journal or Manifestations by name from the root.
 */
export function AreaLinks({ sectionId, className }: { sectionId: SectionId; className?: string }) {
  const pathname = usePathname()
  const section = getSection(sectionId)
  const current = areaForPath(section, pathname)
  if (section.areas.length === 0) return null

  return (
    <nav aria-label={`${section.label} areas`} className={cn('-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0', className)}>
      {section.areas.map((area) => {
        const Icon = area.icon
        const here = current?.href === area.href
        return (
          <Link
            key={area.href}
            href={area.href}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
              here
                ? 'border-[var(--section-accent)] bg-[var(--section-accent-soft)] text-[var(--section-accent)]'
                : 'border-white/15 bg-[rgba(28,22,38,0.45)] text-white/90 backdrop-blur-xl hover:text-white',
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
            {area.label}
          </Link>
        )
      })}
    </nav>
  )
}
