'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, Plus } from 'lucide-react'
import { useInShell } from '@/lib/app-shell/shell-context'
import { StudioToggle } from '../StudioToggle'
import { ShellWalkthroughButton } from '../ShellWalkthroughButton'

const BASE = '/abundance-tracker'

/**
 * Abundance's header in the app shell, in place of the studio's top bar: a
 * centered Track | Create | Insights | Goals toggle (Goals adds a New goal
 * button under it), and a back arrow on a single entry or the new-goal form.
 */
export function AbundanceHeader() {
  const inShell = useInShell()
  const path = (usePathname() ?? BASE).replace(/\/$/, '')
  if (!inShell) return null

  const top = [BASE, `${BASE}/new`, `${BASE}/reports`, `${BASE}/goals`]
  if (top.includes(path)) {
    const action = path === `${BASE}/goals` ? { href: `${BASE}/goals/new`, label: 'New goal' } : null
    return (
      <div className="mb-5 space-y-3">
        <h1 className="sr-only">Abundance Tracker</h1>
        <div className="flex justify-center">
          <StudioToggle
            label="Abundance Tracker"
            className="w-full md:w-[440px]"
            options={[
              { label: 'Track', href: BASE, active: path === BASE },
              { label: 'Create', href: `${BASE}/new`, active: path === `${BASE}/new` },
              { label: 'Insights', href: `${BASE}/reports`, active: path === `${BASE}/reports` },
              { label: 'Goals', href: `${BASE}/goals`, active: path === `${BASE}/goals` },
            ]}
          />
          <ShellWalkthroughButton />
        </div>
        {action ? (
          <div className="flex justify-center">
            <Link
              href={action.href}
              className="flex h-10 items-center gap-1.5 rounded-full bg-[#39FF14] px-5 text-sm font-semibold text-black transition-transform active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} /> {action.label}
            </Link>
          </div>
        ) : null}
      </div>
    )
  }

  const id = path.split('/')[2]
  const { title, back } =
    path === `${BASE}/goals/new`
        ? { title: 'New goal', back: `${BASE}/goals` }
        : path.endsWith('/edit')
          ? { title: 'Edit entry', back: `${BASE}/${id}` }
          : { title: 'Abundance moment', back: BASE }

  return (
    <div className="mb-5 flex items-center gap-2">
      <Link href={back} aria-label="Back" className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/[0.06]">
        <ChevronLeft className="h-6 w-6" />
      </Link>
      <h1 className="min-w-0 flex-1 truncate text-2xl font-bold text-white">{title}</h1>
      <ShellWalkthroughButton />
    </div>
  )
}
