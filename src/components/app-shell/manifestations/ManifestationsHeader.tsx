'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useInShell } from '@/lib/app-shell/shell-context'
import { StudioToggle } from '../StudioToggle'
import { ShellWalkthroughButton } from '../ShellWalkthroughButton'

const CREATE_TOOLS = [
  { label: 'Add New', href: '/manifestations/new' },
  { label: 'VIVA Ideas', href: '/manifestations/ideas' },
  { label: 'Queue', href: '/manifestations/queue' },
]

const SUBPAGE_TITLES: Record<string, string> = {
  '/manifestations/export': 'Download PDF',
  '/manifestations/resources': 'Manifestation resources',
  '/manifestations/about': 'Manifestation resources',
}

/**
 * Manifestations' header in the app shell, in place of the studio's top bar:
 * a centered My Board | Create toggle, Add New / VIVA Ideas / Queue pills on
 * the create tools, and a back arrow to the board everywhere deeper.
 */
export function ManifestationsHeader() {
  const inShell = useInShell()
  const path = (usePathname() ?? '/manifestations').replace(/\/$/, '') || '/manifestations'
  if (!inShell) return null

  const onBoard = path === '/manifestations'
  const onTool = CREATE_TOOLS.some((t) => path === t.href || path.startsWith(t.href + '/'))
  const onCreate = path === '/manifestations/create' || onTool

  if (!onBoard && !onCreate) {
    // A single creation already shows its name beside the photo, so the
    // header names where the arrow goes back to.
    const title = SUBPAGE_TITLES[path] ?? 'My Board'
    return (
      <div className="mb-5 flex items-center gap-2">
        <Link href="/manifestations" aria-label="Back" className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/[0.06]">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-2xl font-bold text-white">{title}</h1>
        <ShellWalkthroughButton />
      </div>
    )
  }

  return (
    <div className="mb-5 space-y-3">
      <h1 className="sr-only">Manifestations</h1>
      <div className="flex justify-center">
        <StudioToggle
          label="Manifestations"
          className="w-full md:w-[320px]"
          options={[
            { label: 'My Board', href: '/manifestations', active: onBoard, dataTour: 'studio-tab-manifestations-view' },
            { label: 'Create', href: '/manifestations/create', active: onCreate, dataTour: 'studio-tab-manifestations-create' },
          ]}
        />
        <ShellWalkthroughButton />
      </div>
      {onTool ? (
        <nav className="flex justify-center gap-2" aria-label="Create tools">
          {CREATE_TOOLS.map((t) => {
            const active = path === t.href || path.startsWith(t.href + '/')
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                  active ? 'border-[#39FF14] bg-[rgba(57,255,20,0.16)] text-[#39FF14]' : 'border-white/15 bg-white/[0.05] text-white/80 hover:text-white',
                )}
              >
                {t.label}
              </Link>
            )
          })}
        </nav>
      ) : null}
    </div>
  )
}
