'use client'

import React, { useRef, useCallback, useEffect, useState } from 'react'
import { Play, Pause, SkipBack, SkipForward, X, Loader2 } from 'lucide-react'
import { useGlobalAudioStore, getGlobalAudioElement } from '@/lib/stores/global-audio-store'
import { useMediaSession } from '@/hooks/useMediaSession'
import { TrackArtwork } from './TrackArtwork'
import { isSongNowPlayingTrack } from './TrackArtistLine'
import { isShellFlagOn } from '@/lib/app-shell/flag'

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function PersistentMiniPlayer() {
  const tracks = useGlobalAudioStore(s => s.tracks)
  const currentIndex = useGlobalAudioStore(s => s.currentIndex)
  const isPlaying = useGlobalAudioStore(s => s.isPlaying)
  const isBuffering = useGlobalAudioStore(s => s.isBuffering)
  const currentTime = useGlobalAudioStore(s => s.currentTime)
  const duration = useGlobalAudioStore(s => s.duration)
  const setName = useGlobalAudioStore(s => s.setName)
  const setIconKey = useGlobalAudioStore(s => s.setIconKey)
  const contentCategory = useGlobalAudioStore(s => s.contentCategory)
  const openDrawer = useGlobalAudioStore(s => s.openDrawer)
  const pause = useGlobalAudioStore(s => s.pause)
  const resume = useGlobalAudioStore(s => s.resume)
  const seekTo = useGlobalAudioStore(s => s.seekTo)
  const skipNext = useGlobalAudioStore(s => s.skipNext)
  const skipPrev = useGlobalAudioStore(s => s.skipPrev)
  const stop = useGlobalAudioStore(s => s.stop)

  const currentTrack = tracks[currentIndex] ?? null
  // In the new app shell the player floats as a glass card above the bottom bar.
  const [floating, setFloating] = useState(false)
  useEffect(() => {
    const sync = () => setFloating(isShellFlagOn() && !!document.querySelector('[data-app-shell]'))
    sync()
    const t = window.setInterval(sync, 1500)
    return () => window.clearInterval(t)
  }, [])

  const audioRef = useRef<HTMLAudioElement | null>(null)
  audioRef.current = getGlobalAudioElement()

  const handlePlay = useCallback(() => resume(), [resume])
  const handlePause = useCallback(() => pause(), [pause])
  const handleNext = useCallback(() => skipNext(), [skipNext])
  const handlePrev = useCallback(() => skipPrev(), [skipPrev])

  useMediaSession({
    track: currentTrack,
    isPlaying,
    onPlay: handlePlay,
    onPause: handlePause,
    onNext: tracks.length > 1 ? handleNext : undefined,
    onPrevious: tracks.length > 1 ? handlePrev : undefined,
    audioRef,
  })

  if (!currentTrack || tracks.length === 0) return null

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = x / rect.width
    seekTo(pct * duration)
  }

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.closest('button')) return
    openDrawer()
  }

  const subtitle = isSongNowPlayingTrack(currentTrack, contentCategory)
    ? ['Vibration Fit', currentTrack.performers?.map((p) => p.name).join(' · ') || currentTrack.artist].filter(Boolean).join(' · ')
    : setName && !setName.includes(':') ? setName : currentTrack.artist || 'Vibration Fit'

  if (floating) {
    return (
      <div
        className="fixed inset-x-3 z-50 bottom-[calc(var(--shell-nav-height,76px)+env(safe-area-inset-bottom,0px)+18px)] lg:bottom-6 lg:left-[280px] lg:right-6 lg:mx-auto lg:max-w-xl"
      >
        <div
          role="button"
          tabIndex={0}
          onClick={handleBarClick}
          onKeyDown={(e) => { if (e.key === 'Enter') openDrawer() }}
          aria-label="Open Now Playing"
          className="vf-glass relative cursor-pointer overflow-hidden rounded-[22px] border border-white/[0.14] bg-[linear-gradient(180deg,rgba(44,36,60,0.62)_0%,rgba(20,16,30,0.80)_100%)] shadow-[0_14px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl backdrop-saturate-150"
        >
          <div className="flex items-center gap-3 py-2 pl-2 pr-3">
            <TrackArtwork track={currentTrack} iconKey={setIconKey} size={44} className="flex-shrink-0 overflow-hidden rounded-[14px]" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-white">{currentTrack.title}</p>
              <p className="truncate text-xs text-white/60">{subtitle}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); isPlaying ? pause() : resume() }}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white text-black transition-transform active:scale-95"
              aria-label={isBuffering ? 'Loading' : isPlaying ? 'Pause' : 'Play'}
            >
              {isBuffering ? <Loader2 className="h-4 w-4 animate-spin" /> : isPlaying ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="ml-0.5 h-4 w-4" fill="currentColor" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); skipNext() }}
              disabled={currentIndex >= tracks.length - 1}
              className="flex h-10 w-9 flex-shrink-0 items-center justify-center text-white transition-opacity disabled:opacity-30"
              aria-label="Next track"
            >
              <SkipForward className="h-5 w-5" fill="currentColor" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); stop() }}
              className="flex h-10 w-7 flex-shrink-0 items-center justify-center text-white/45 hover:text-white"
              aria-label="Stop"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {/* Progress hairline along the bottom edge; tap to seek */}
          <div className="absolute inset-x-4 bottom-0 h-[3px] cursor-pointer" onClick={handleProgressClick}>
            <div className="h-full rounded-full bg-white/15" />
            <div className="absolute inset-y-0 left-0 rounded-full bg-[#39FF14]" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out">
      <div
        className="h-1 bg-neutral-800 cursor-pointer group relative"
        onClick={handleProgressClick}
      >
        <div
          className="h-full bg-primary-500 transition-all duration-150 group-hover:h-1.5"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        className="bg-zinc-950/95 backdrop-blur-xl border-t border-neutral-800/50 cursor-pointer"
        onClick={handleBarClick}
      >
        <div className="flex items-center gap-3 px-3 py-2 md:px-6 md:py-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom,0.5rem))]">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <TrackArtwork
              track={currentTrack}
              iconKey={setIconKey}
              size={40}
              className="rounded-lg overflow-hidden flex-shrink-0 md:!w-12 md:!h-12"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">
                {currentTrack.title}
              </p>
              {isSongNowPlayingTrack(currentTrack, contentCategory) ? (
                <p className="text-xs text-neutral-400 truncate">
                  Vibration Fit
                  {(currentTrack.performers?.length || currentTrack.artist) && (
                    <>
                      {' · '}
                      {currentTrack.performers && currentTrack.performers.length > 1 ? 'Creators' : 'Creator'}:{' '}
                      {currentTrack.performers?.length
                        ? currentTrack.performers.map((p) => p.name).join(' · ')
                        : currentTrack.artist}
                    </>
                  )}
                </p>
              ) : (
                <p className="text-xs text-neutral-400 truncate">
                  {setName || currentTrack.artist || 'Vibration Fit'}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); skipPrev() }}
              className="p-2 text-neutral-400 hover:text-white transition-colors"
              disabled={currentIndex === 0 && currentTime < 3}
              aria-label="Previous track"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); isPlaying ? pause() : resume() }}
              className="p-2.5 bg-white rounded-full text-black hover:bg-neutral-200 transition-colors"
              aria-label={isBuffering ? 'Loading' : isPlaying ? 'Pause' : 'Play'}
            >
              {isBuffering ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4" fill="currentColor" />
              ) : (
                <Play className="w-4 h-4" fill="currentColor" />
              )}
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); skipNext() }}
              className="p-2 text-neutral-400 hover:text-white transition-colors"
              disabled={currentIndex >= tracks.length - 1}
              aria-label="Next track"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); stop() }}
              className="p-2 text-neutral-500 hover:text-neutral-300 transition-colors ml-0.5"
              aria-label="Stop"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="hidden md:flex items-center gap-3 text-xs text-neutral-500 flex-shrink-0">
            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
