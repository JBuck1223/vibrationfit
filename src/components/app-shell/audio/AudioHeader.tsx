'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AUDIO_TABS, tabForPath } from './sources'

/**
 * The audio header every Listen page shares: "Audio", the Create audio
 * button, and the tabs as swipeable pills (Meditations included).
 */
export function AudioHeader() {
  const pathname = usePathname()
  const tab = tabForPath(pathname)
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 pt-1">
        <h1 className="text-[28px] font-bold leading-tight text-white">Audio</h1>
        <Link
          href="/audio/create"
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-[#39FF14] px-4 text-sm font-semibold text-black transition-transform active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} /> Create audio
        </Link>
      </div>

      <nav aria-label="Audio" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:px-0">
        {AUDIO_TABS.map((t) => {
          const active = t.id === tab
          return (
            <Link
              key={t.id}
              href={t.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                active ? 'border-[#39FF14] bg-[rgba(57,255,20,0.16)] text-[#39FF14]' : 'border-white/15 bg-white/[0.05] text-white/80 hover:text-white',
              )}
            >
              {t.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
