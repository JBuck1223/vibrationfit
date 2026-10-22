'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { useInShell } from '@/lib/app-shell/shell-context'
import { useJournalStudio } from '@/components/journal-studio'
import { StudioToggle } from '../StudioToggle'

const SUBPAGE_TITLES: Record<string, string> = {
  '/journal/about': 'About the Journal',
  '/journal/resources': 'Journal resources',
}

/**
 * Journal's header in the app shell, in place of the studio's top bar:
 * a My Journal | Write toggle on the two main pages, and a back arrow
 * with the entry's title anywhere deeper.
 */
export function JournalHeader() {
  const inShell = useInShell()
  const pathname = usePathname() ?? '/journal'
  const { entries } = useJournalStudio()
  if (!inShell) return null

  const path = pathname.replace(/\/$/, '')
  if (path === '/journal' || path === '/journal/new') {
    return (
      <div className="mb-5 flex justify-center">
        <h1 className="sr-only">Journal</h1>
        <StudioToggle
          label="Journal"
          className="w-full md:w-[320px]"
          options={[
            { label: 'My Journal', href: '/journal', active: path === '/journal' },
            { label: 'Write', href: '/journal/new', active: path === '/journal/new' },
          ]}
        />
      </div>
    )
  }

  const id = path.split('/')[2]
  const entry = entries.find((e) => e.id === id)
  const title = SUBPAGE_TITLES[path] ?? (entry?.title || 'Journal entry')
  const back = path.endsWith('/edit') ? `/journal/${id}` : '/journal'

  return (
    <div className="mb-5 flex items-center gap-2">
      <Link href={back} aria-label="Back" className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/[0.06]">
        <ChevronLeft className="h-6 w-6" />
      </Link>
      <h1 className="min-w-0 flex-1 truncate text-2xl font-bold text-white">{title}</h1>
    </div>
  )
}
