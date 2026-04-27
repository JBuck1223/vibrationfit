'use client'

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { AlignLeft, ChevronUp } from 'lucide-react'
import { useGlobalAudioStore } from '@/lib/stores/global-audio-store'
import type { SyncedLyrics, TimedLine } from '@/lib/utils/lyrics-alignment'

interface SyncedLyricsDisplayProps {
  syncedLyrics: SyncedLyrics
  className?: string
}

function findActiveLine(lines: TimedLine[], time: number): number {
  if (lines.length === 0 || time < lines[0]!.startTime) return -1

  let lo = 0
  let hi = lines.length - 1
  let result = -1

  while (lo <= hi) {
    const mid = (lo + hi) >>> 1
    if (lines[mid]!.startTime <= time) {
      result = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }

  return result
}

export function SyncedLyricsDisplay({ syncedLyrics, className = '' }: SyncedLyricsDisplayProps) {
  const currentTime = useGlobalAudioStore(s => s.currentTime)
  const isPlaying = useGlobalAudioStore(s => s.isPlaying)
  const seekTo = useGlobalAudioStore(s => s.seekTo)

  const [isExpanded, setIsExpanded] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<Map<number, HTMLButtonElement>>(new Map())
  const lastScrolledLine = useRef(-1)

  const { lines } = syncedLyrics
  const activeLineIdx = useMemo(() => findActiveLine(lines, currentTime), [lines, currentTime])

  useEffect(() => {
    if (
      activeLineIdx < 0 ||
      activeLineIdx === lastScrolledLine.current ||
      !containerRef.current ||
      !isExpanded
    ) return

    lastScrolledLine.current = activeLineIdx
    const el = lineRefs.current.get(activeLineIdx)
    if (!el) return

    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()

    const elCenter = elRect.top + elRect.height / 2
    const containerCenter = containerRect.top + containerRect.height / 2
    const offset = elCenter - containerCenter

    container.scrollBy({ top: offset, behavior: 'smooth' })
  }, [activeLineIdx, isExpanded])

  const setLineRef = useCallback((idx: number, el: HTMLButtonElement | null) => {
    if (el) {
      lineRefs.current.set(idx, el)
    } else {
      lineRefs.current.delete(idx)
    }
  }, [])

  const handleLineClick = useCallback(
    (line: TimedLine) => {
      seekTo(line.startTime)
    },
    [seekTo],
  )

  if (lines.length === 0) return null

  return (
    <div className={`rounded-2xl border border-neutral-800 bg-embedded-panel overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={() => setIsExpanded(prev => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-neutral-300">
          <AlignLeft className="w-4 h-4 text-neutral-500" />
          Lyrics
        </span>
        <ChevronUp
          className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${
            isExpanded ? '' : 'rotate-180'
          }`}
        />
      </button>

      {isExpanded && (
        <div
          ref={containerRef}
          className="relative max-h-[360px] overflow-y-auto scroll-smooth px-5 pb-6 pt-2 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent"
        >
          <div className="flex flex-col items-center gap-1">
            {lines.map((line, idx) => {
              const isActive = idx === activeLineIdx
              const isPast = activeLineIdx >= 0 && idx < activeLineIdx
              const isFuture = activeLineIdx >= 0 && idx > activeLineIdx
              const isIdle = activeLineIdx < 0

              let textClass: string
              if (isActive) {
                textClass = 'text-white text-lg font-semibold scale-[1.02]'
              } else if (isPast) {
                textClass = 'text-neutral-500 text-base font-normal'
              } else if (isFuture) {
                textClass = 'text-neutral-400 text-base font-normal'
              } else if (isIdle) {
                textClass = 'text-neutral-400 text-base font-normal'
              } else {
                textClass = 'text-neutral-400 text-base font-normal'
              }

              return (
                <button
                  key={idx}
                  ref={(el) => setLineRef(idx, el)}
                  type="button"
                  onClick={() => handleLineClick(line)}
                  className={`w-full rounded-lg px-3 py-1.5 text-center transition-all duration-300 ease-out hover:bg-white/[0.04] ${textClass}`}
                >
                  {line.text}
                </button>
              )
            })}
          </div>

          {/* Fade-out gradient at top and bottom */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-[var(--color-embedded-panel,#141414)] to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[var(--color-embedded-panel,#141414)] to-transparent" />
        </div>
      )}
    </div>
  )
}
