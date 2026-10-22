'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { AUDIO_TABS, tabForPath } from './sources'
import { CREATE_TOOLS, isCreatePath, toolForPath } from './create-tools'
import { StudioToggle } from '../StudioToggle'

function Pill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
        active ? 'border-[#39FF14] bg-[rgba(57,255,20,0.16)] text-[#39FF14]' : 'border-white/15 bg-white/[0.05] text-white/80 hover:text-white',
      )}
    >
      {children}
    </Link>
  )
}

/**
 * The header every Audio page shares: the "Audio" title, a Listen | Create
 * toggle, and that side's pages as swipeable pills.
 */
export function AudioHeader({ aside }: { aside?: React.ReactNode }) {
  const pathname = usePathname()
  const creating = isCreatePath(pathname)
  const tab = tabForPath(pathname)
  const tool = toolForPath(pathname)

  return (
    <div className="space-y-4">
      {/* The top bar already says Audio. */}
      <h1 className="sr-only">Audio</h1>
      <div className="flex items-center gap-3 md:justify-center">
        <StudioToggle
          label="Listen or create"
          className="flex-1 md:flex-none"
          options={[
            { label: 'Listen', href: '/audio', active: !creating },
            { label: 'Create', href: '/audio/create', active: creating },
          ]}
        />
        {aside}
      </div>

      <nav aria-label={creating ? 'Create tools' : 'Audio'} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:justify-center md:px-0">
        {creating
          ? CREATE_TOOLS.map((t) => (
              <Pill key={t.id} href={t.href} active={t.id === tool?.id}>
                {t.short}
              </Pill>
            ))
          : AUDIO_TABS.map((t) => (
              <Pill key={t.id} href={t.href} active={t.id === tab}>
                {t.label}
              </Pill>
            ))}
      </nav>
    </div>
  )
}
