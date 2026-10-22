'use client'

import React from 'react'
import Link from 'next/link'
import { CheckCircle2, ChevronLeft, Loader2, XCircle } from 'lucide-react'
import { useAudioStudio } from '@/components/audio-studio/AudioStudioContext'
import { GLASS_CARD } from '@/lib/app-shell/glass'
import { cn } from '@/lib/utils'
import { CREATE_TOOLS, QUEUE_HREF, batchTitle, isRunning } from './create-tools'

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Create audio in the app shell: the four ways to make audio as big cards,
 * and what's being made right now in place of a Queue tile.
 */
export function CreateAudioHome() {
  const { allBatches } = useAudioStudio()

  // Running jobs first, then anything finished in the last day; three at most.
  const running = allBatches.filter((b) => isRunning(b.status))
  const recent = allBatches.filter((b) => !isRunning(b.status) && Date.now() - new Date(b.created_at).getTime() < DAY_MS)
  const jobs = [...running, ...recent].slice(0, 3)

  return (
    <div className="space-y-5">
      <div className="pt-1">
        <Link href="/audio" className="-ml-1 inline-flex items-center gap-1 text-white">
          <ChevronLeft className="h-6 w-6" />
          <h1 className="text-[28px] font-bold leading-tight">Create audio</h1>
        </Link>
        <p className="ml-7 text-xs text-white/55">Back to Audio</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-tour="audio-create-tiles">
        {CREATE_TOOLS.map((t) => {
          const Icon = t.icon
          return (
            <Link
              key={t.id}
              href={t.href}
              data-tour={`audio-create-${t.id}`}
              className={cn(GLASS_CARD, 'block p-4 transition-transform active:scale-[0.98] md:p-5')}
            >
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full" style={{ background: t.tint }}>
                <Icon className="h-5 w-5" style={{ color: t.color }} aria-hidden />
              </span>
              <span className="block text-[15px] font-semibold text-white">{t.title}</span>
              <span className="mt-0.5 block text-xs leading-snug text-white/55">{t.description}</span>
            </Link>
          )
        })}
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">In progress</h2>
          <Link href={QUEUE_HREF} className="text-sm text-white/60 hover:text-white">
            See all
          </Link>
        </div>
        <div className={cn(GLASS_CARD, 'overflow-hidden')}>
          {jobs.length === 0 ? (
            <p className="px-4 py-4 text-sm text-white/55">Nothing is being made right now. Anything you create shows up here while it's in progress.</p>
          ) : (
            <ul>
              {jobs.map((b, i) => {
                const total = b.total_tracks_expected || 0
                const done = b.tracks_completed || 0
                const pct = total > 0 ? Math.min(100, (done / total) * 100) : 0
                const failed = b.status === 'failed'
                return (
                  <li key={b.id} className={cn(i > 0 && 'border-t border-white/[0.07]')}>
                    <Link href={QUEUE_HREF} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04]">
                      {isRunning(b.status) ? (
                        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#c4a5ff]" />
                      ) : failed ? (
                        <XCircle className="h-5 w-5 shrink-0 text-[#FF0040]" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-[#39FF14]" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-white">{batchTitle(b)}</span>
                        {isRunning(b.status) && (
                          <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-white/[0.12]">
                            <span className="block h-full rounded-full bg-[#39FF14]" style={{ width: `${pct}%` }} />
                          </span>
                        )}
                      </span>
                      <span className={cn('shrink-0 text-xs', isRunning(b.status) ? 'text-white/55' : failed ? 'text-[#FF0040]' : 'text-[#39FF14]')}>
                        {isRunning(b.status) ? (total > 0 ? `${done} of ${total}` : 'Starting') : failed ? 'Failed' : 'Ready'}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
