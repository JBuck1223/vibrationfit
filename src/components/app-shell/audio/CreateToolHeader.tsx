'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useInShell } from '@/lib/app-shell/shell-context'
import { useAudioStudio } from '@/components/audio-studio/AudioStudioContext'
import { CREATE_TOOLS, QUEUE_HREF, isRunning, toolForPath } from './create-tools'

/**
 * The frame around each create tool in the app shell: back arrow, the
 * tool's name, an "in progress" chip, and pills to jump between tools.
 * Replaces the studio's old top bar there; the tools themselves are unchanged.
 */
export function CreateToolHeader() {
  const inShell = useInShell()
  const pathname = usePathname()
  const { allBatches } = useAudioStudio()
  const tool = toolForPath(pathname)
  const onQueue = pathname === QUEUE_HREF || pathname?.startsWith(`${QUEUE_HREF}/`)
  if (!inShell || (!tool && !onQueue)) return null

  const running = allBatches.filter((b) => isRunning(b.status)).length
  // Deeper pages (a song, a batch) go back to their tool; tool pages go back to Create.
  const atToolRoot = tool ? pathname === tool.href : pathname === QUEUE_HREF
  const back = atToolRoot ? '/audio/create' : tool?.href ?? QUEUE_HREF
  const title = tool ? tool.title : 'In progress'

  return (
    <div className="mb-5 space-y-3">
      <div className="flex items-center gap-2">
        <Link href={back} aria-label="Back" className="-ml-1 flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/[0.06]">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-2xl font-bold text-white">{title}</h1>
        {running > 0 && !onQueue && (
          <Link
            href={QUEUE_HREF}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:text-white"
          >
            <Clock className="h-3.5 w-3.5" /> {running} in progress
          </Link>
        )}
      </div>
      {atToolRoot && (
        <nav aria-label="Create tools" className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0">
          {CREATE_TOOLS.map((t) => {
            const active = t.id === tool?.id
            return (
              <Link
                key={t.id}
                href={t.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors',
                  active ? 'border-[#39FF14] bg-[rgba(57,255,20,0.16)] text-[#39FF14]' : 'border-white/15 bg-white/[0.05] text-white/80 hover:text-white',
                )}
              >
                {t.short}
              </Link>
            )
          })}
        </nav>
      )}
    </div>
  )
}
