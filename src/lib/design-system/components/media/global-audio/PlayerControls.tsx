'use client'

import React from 'react'
import { Loader2, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward } from 'lucide-react'
import { cn } from '../../shared-utils'

export function formatPlayerTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * App-style scrubber: a thick rounded track with a green fill and a thumb
 * that only grows while you touch it, times underneath. Works with touch,
 * mouse and keyboard (it is a real range input underneath).
 */
export function PlayerScrubber({
  currentTime,
  duration,
  onSeek,
  disabled,
}: {
  currentTime: number
  duration: number
  onSeek: (time: number) => void
  disabled?: boolean
}) {
  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0
  return (
    <div className="w-full">
      <div className="group relative h-6 w-full">
        <div className="absolute inset-x-0 top-1/2 h-[6px] -translate-y-1/2 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-[#39FF14] transition-[width] duration-150" style={{ width: `${pct}%` }} />
        </div>
        <div
          className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.4)] transition-transform group-active:scale-125"
          style={{ left: `${pct}%` }}
        />
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(currentTime, duration || 0)}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          disabled={disabled || !duration}
          aria-label="Seek"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-default"
        />
      </div>
      <div className="mt-1 flex justify-between text-xs tabular-nums text-white/55">
        <span>{formatPlayerTime(currentTime)}</span>
        <span>-{formatPlayerTime(Math.max(0, duration - currentTime))}</span>
      </div>
    </div>
  )
}

/**
 * One row of transport controls like a native music app: shuffle, previous,
 * a big play/pause, next, repeat.
 */
export function TransportControls({
  isPlaying,
  isBuffering,
  onPlayPause,
  onPrev,
  onNext,
  canPrev = true,
  canNext = true,
  shuffle,
  onShuffle,
  repeatMode,
  onRepeat,
}: {
  isPlaying: boolean
  isBuffering?: boolean
  onPlayPause: () => void
  onPrev: () => void
  onNext: () => void
  canPrev?: boolean
  canNext?: boolean
  shuffle?: boolean
  onShuffle?: () => void
  repeatMode?: 'off' | 'all' | 'one'
  onRepeat?: () => void
}) {
  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat
  return (
    <div className="flex w-full items-center justify-between px-1">
      <button
        type="button"
        onClick={onShuffle}
        disabled={!onShuffle}
        aria-label="Shuffle"
        aria-pressed={!!shuffle}
        className={cn('flex h-11 w-11 items-center justify-center rounded-full transition-colors', shuffle ? 'text-[#39FF14]' : 'text-white/55 hover:text-white', !onShuffle && 'invisible')}
      >
        <Shuffle className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        aria-label="Previous"
        className="flex h-12 w-12 items-center justify-center rounded-full text-white transition-opacity active:scale-95 disabled:opacity-30"
      >
        <SkipBack className="h-7 w-7" fill="currentColor" />
      </button>
      <button
        type="button"
        onClick={onPlayPause}
        aria-label={isBuffering ? 'Loading' : isPlaying ? 'Pause' : 'Play'}
        className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white text-black shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition-transform active:scale-95"
      >
        {isBuffering ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-8 w-8" fill="currentColor" />
        ) : (
          <Play className="ml-1 h-8 w-8" fill="currentColor" />
        )}
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        aria-label="Next"
        className="flex h-12 w-12 items-center justify-center rounded-full text-white transition-opacity active:scale-95 disabled:opacity-30"
      >
        <SkipForward className="h-7 w-7" fill="currentColor" />
      </button>
      <button
        type="button"
        onClick={onRepeat}
        disabled={!onRepeat}
        aria-label={repeatMode === 'one' ? 'Repeat one' : repeatMode === 'all' ? 'Repeat all' : 'Repeat off'}
        className={cn('flex h-11 w-11 items-center justify-center rounded-full transition-colors', repeatMode && repeatMode !== 'off' ? 'text-[#39FF14]' : 'text-white/55 hover:text-white', !onRepeat && 'invisible')}
      >
        <RepeatIcon className="h-5 w-5" />
      </button>
    </div>
  )
}
