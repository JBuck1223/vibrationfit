'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { PILL_BASE, PILL_OFF } from '@/lib/app-shell/glass'
import { areaForPath, getSection, type SectionId } from '@/lib/app-shell/sections'
import { useIsNativeShell } from '@/hooks/useNativeShell'
import { isNativeExternalPath } from '@/lib/mobile/native-shell'

/**
 * The areas (studios) under a section as a row of chips, so members can go
 * straight to Audio, MAP, Journal or Manifestations by name from the root.
 */
export function AreaLinks({ sectionId, className }: { sectionId: SectionId; className?: string }) {
  const pathname = usePathname()
  const section = getSection(sectionId)
  const current = areaForPath(section, pathname)
  const isNativeShell = useIsNativeShell()
  // Billing never renders inside the native shell (App Review 3.1.1).
  const areas = isNativeShell ? section.areas.filter((area) => !isNativeExternalPath(area.href)) : section.areas
  if (areas.length === 0) return null

  return (
    <nav aria-label={`${section.label} areas`} className={cn('-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0', className)}>
      {areas.map((area) => {
        const Icon = area.icon
        const here = current?.href === area.href
        return (
          <Link
            key={area.href}
            href={area.href}
            className={cn(
              PILL_BASE,
              'flex items-center gap-2',
              here ? 'border-[var(--section-accent)] bg-[var(--section-accent-soft)] text-[var(--section-accent)]' : PILL_OFF,
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
