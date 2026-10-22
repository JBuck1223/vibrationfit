'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { useInShell } from '@/lib/app-shell/shell-context'
import { StudioToggle } from '../StudioToggle'
import { ShellWalkthroughButton } from '../ShellWalkthroughButton'

/**
 * Daily Paper's header in the app shell, in place of the studio's top bar:
 * a centered My Papers | Create | About toggle, and a back arrow on a
 * single paper. The walkthrough button goes up into the top bar.
 */
export function DailyPaperHeader() {
  const inShell = useInShell()
  const pathname = (usePathname() ?? '/daily-paper').replace(/\/$/, '')
  if (!inShell) return null

  const top = ['/daily-paper', '/daily-paper/new', '/daily-paper/resources']
  if (top.includes(pathname)) {
    return (
      <div className="mb-5 flex justify-center">
        <h1 className="sr-only">Daily Paper</h1>
        <StudioToggle
          label="Daily Paper"
          className="w-full md:w-[380px]"
          options={[
            { label: 'My Papers', href: '/daily-paper', active: pathname === '/daily-paper', dataTour: 'studio-tab-daily-paper-view' },
            { label: 'Create', href: '/daily-paper/new', active: pathname === '/daily-paper/new', dataTour: 'studio-tab-daily-paper-create' },
            { label: 'About', href: '/daily-paper/resources', active: pathname === '/daily-paper/resources', dataTour: 'studio-tab-daily-paper-resources' },
          ]}
        />
        <ShellWalkthroughButton />
      </div>
    )
  }

  const id = pathname.split('/')[2]
  const back = pathname.endsWith('/edit') ? `/daily-paper/${id}` : '/daily-paper'
  return (
    <div className="mb-5 flex items-center gap-2">
      <Link href={back} aria-label="Back" className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/[0.06]">
        <ChevronLeft className="h-6 w-6" />
      </Link>
      <h1 className="min-w-0 flex-1 truncate text-2xl font-bold text-white">{pathname.endsWith('/edit') ? 'Edit Daily Paper' : 'Daily Paper'}</h1>
      <ShellWalkthroughButton />
    </div>
  )
}
