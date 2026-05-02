'use client'

import type { LucideIcon } from 'lucide-react'
import { Icon } from '@/lib/design-system/components'

/** Matches `/profile/[id]` card headers — lime tile, black glyph, uppercase title */
export function ProfileSectionCardHeading({ icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <>
      <div className="mb-2 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-500 md:h-8 md:w-8">
          <Icon icon={icon} size="xs" color="#000000" />
        </div>
        <h3 className="max-w-full text-center text-sm font-medium uppercase tracking-[0.25em] text-neutral-400">
          {title}
        </h3>
      </div>
      <div className="mb-6 border-b border-neutral-800" />
    </>
  )
}
