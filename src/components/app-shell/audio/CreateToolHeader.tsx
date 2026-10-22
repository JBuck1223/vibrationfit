'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, Clock } from 'lucide-react'
import { useInShell } from '@/lib/app-shell/shell-context'
import { useAudioStudio } from '@/components/audio-studio/AudioStudioContext'
import { QUEUE_HREF, isCreatePath, isRunning, toolForPath } from './create-tools'
import { AudioHeader } from './AudioHeader'

/**
 * The Create side's header in the app shell. Top-level pages (Create, each
 * tool, the queue) share the Audio header with its Listen | Create toggle;
 * a page deeper in a tool (one song, one job) gets a back arrow instead.
 */
export function CreateToolHeader() {
  const inShell = useInShell()
  const pathname = usePathname()
  const { allBatches } = useAudioStudio()
  if (!inShell || !isCreatePath(pathname)) return null

  const tool = toolForPath(pathname)
  const running = allBatches.filter((b) => isRunning(b.status)).length
  const topLevel = pathname === '/audio/create' || pathname === QUEUE_HREF || (tool && pathname === tool.href)

  if (topLevel) {
    const chip =
      running > 0 && pathname !== QUEUE_HREF ? (
        <Link
          href={QUEUE_HREF}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:text-white"
        >
          <Clock className="h-3.5 w-3.5" /> {running} in progress
        </Link>
      ) : null
    return (
      <div className="mb-5">
        <AudioHeader aside={chip} />
      </div>
    )
  }

  return (
    <div className="mb-5 flex items-center gap-2">
      <Link
        href={tool?.href ?? QUEUE_HREF}
        aria-label="Back"
        className="-ml-1 flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/[0.06]"
      >
        <ChevronLeft className="h-6 w-6" />
      </Link>
      <h1 className="min-w-0 flex-1 truncate text-2xl font-bold text-white">{tool?.title ?? 'In progress'}</h1>
    </div>
  )
}
