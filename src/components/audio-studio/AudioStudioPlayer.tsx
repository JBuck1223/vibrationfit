'use client'

import React from 'react'
import { Play, Pause, SkipBack, SkipForward, X } from 'lucide-react'
import { useAudioStudio } from './AudioStudioContext'

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function AudioStudioPlayer() {
  const {
    player,
    pausePlayer,
    resumePlayer,
    stopPlayer,
    skipNext,
    skipPrev,
    seekTo,
    currentTime,
    duration,
  } = useAudioStudio()

  if (player.tracks.length === 0) return null

  const currentTrack = player.tracks[player.currentIndex]
  if (!currentTrack) return null

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = x / rect.width
    seekTo(pct * duration)
  }

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <div className="pointer-events-auto mx-auto max-w-2xl px-3 pb-3 sm:px-4">
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#1F1F1F]/55 shadow-[0_8px_32px_rgba(0,0,0,0.5)] ring-1 ring-inset ring-white/[0.06] backdrop-blur-lg">
          <div
            className="h-0.5 cursor-pointer bg-black/30 group"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-primary-500 transition-all duration-150 group-hover:brightness-110"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center gap-2 px-3 py-2 md:gap-3 md:px-4 md:py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium leading-tight text-white">
                {currentTrack.title}
              </p>
              <p className="mt-0.5 truncate text-[11px] leading-tight text-neutral-500">
                {player.setName && (
                  <>
                    {player.setName}
                    <span className="text-neutral-600"> · </span>
                  </>
                )}
                {formatTime(currentTime)} / {formatTime(duration)}
              </p>
            </div>

            <div className="flex flex-shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={skipPrev}
                className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
                disabled={player.currentIndex === 0 && currentTime < 3}
                aria-label="Previous track"
              >
                <SkipBack className="h-3.5 w-3.5" strokeWidth={2.25} />
              </button>

              <button
                type="button"
                onClick={player.isPlaying ? pausePlayer : resumePlayer}
                className="mx-0.5 rounded-full bg-primary-500 p-2 text-black transition-colors hover:bg-primary-400"
                aria-label={player.isPlaying ? 'Pause' : 'Play'}
              >
                {player.isPlaying ? (
                  <Pause className="h-3.5 w-3.5" fill="currentColor" />
                ) : (
                  <Play className="h-3.5 w-3.5 pl-0.5" fill="currentColor" />
                )}
              </button>

              <button
                type="button"
                onClick={skipNext}
                className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
                disabled={player.currentIndex >= player.tracks.length - 1}
                aria-label="Next track"
              >
                <SkipForward className="h-3.5 w-3.5" strokeWidth={2.25} />
              </button>

              <button
                type="button"
                onClick={stopPlayer}
                className="ml-0.5 rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-white/[0.06] hover:text-neutral-300"
                aria-label="Stop and close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="hidden w-11 flex-shrink-0 text-right text-[10px] tabular-nums text-neutral-500 md:block">
              {player.currentIndex + 1}/{player.tracks.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
