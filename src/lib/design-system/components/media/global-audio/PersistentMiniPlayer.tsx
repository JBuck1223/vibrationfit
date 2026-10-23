'use client'

import React, { useRef, useCallback, useEffect, useState } from 'react'
import { Play, Pause, SkipBack, SkipForward, X, Loader2, ChevronUp, Volume2, VolumeX } from 'lucide-react'
import { useGlobalAudioStore, getGlobalAudioElement } from '@/lib/stores/global-audio-store'
import { useShellNavStore } from '@/lib/stores/shell-nav-store'
import { useMediaSession } from '@/hooks/useMediaSession'
import { TrackArtwork } from './TrackArtwork'
import { isSongNowPlayingTrack } from './TrackArtistLine'
import { isShellFlagOn } from '@/lib/app-shell/flag'
import { PlayerScrubber, TransportControls } from './PlayerControls'
import { MarqueeGroup, MarqueeText } from './MarqueeText'

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
  const isShuffled = useGlobalAudioStore(s => s.isShuffled)
  const toggleShuffle = useGlobalAudioStore(s => s.toggleShuffle)
  const repeatMode = useGlobalAudioStore(s => s.repeatMode)
  const setRepeatMode = useGlobalAudioStore(s => s.setRepeatMode)
  const [volume, setVolume] = useState(1)
  const navCollapsedSide = useShellNavStore(s => s.collapsedSide)

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
    const changeVolume = (v: number) => {
      setVolume(v)
      const el = getGlobalAudioElement()
      if (el) el.volume = v
    }
    const nextRepeat = repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off'
    return (
      <>
      {/* Desktop: a full-width bar along the bottom, like a desktop music app. */}
      <div className="fixed inset-x-0 bottom-0 z-50 hidden h-[84px] lg:block">
        <div className="vf-glass grid h-full grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)] items-center gap-6 border-t border-white/[0.12] bg-[linear-gradient(180deg,rgba(36,29,50,0.82)_0%,rgba(18,14,26,0.92)_100%)] px-5 backdrop-blur-2xl backdrop-saturate-150">
          <button type="button" onClick={openDrawer} className="flex min-w-0 items-center gap-3 text-left" aria-label="Open Now Playing">
            <TrackArtwork track={currentTrack} iconKey={setIconKey} size={56} className="flex-shrink-0 overflow-hidden rounded-[12px]" />
            <span className="min-w-0">
              <MarqueeGroup>
              <MarqueeText active={isPlaying} title={currentTrack.title} className="text-[15px] font-semibold text-white">{currentTrack.title}</MarqueeText>
              <MarqueeText active={isPlaying} title={subtitle} className="text-xs text-white/60">{subtitle}</MarqueeText>
              </MarqueeGroup>
            </span>
          </button>
          <div className="flex min-w-0 flex-col items-center">
            <div className="w-[300px] max-w-full [&>div]:!px-0 [&_button]:!h-9 [&_button]:!w-9">
              <TransportControls
                compact
                isPlaying={isPlaying}
                isBuffering={isBuffering}
                onPlayPause={() => (isPlaying ? pause() : resume())}
                onPrev={skipPrev}
                onNext={skipNext}
                canPrev={!(currentIndex === 0 && currentTime < 3)}
                canNext={currentIndex < tracks.length - 1 || repeatMode === 'all'}
                shuffle={isShuffled}
                onShuffle={tracks.length > 1 ? toggleShuffle : undefined}
                repeatMode={repeatMode}
                onRepeat={() => setRepeatMode(nextRepeat)}
              />
            </div>
            <div className="-mt-1 flex w-full max-w-[560px] items-center gap-2 text-[11px] tabular-nums text-white/55">
              <span className="w-10 text-right">{formatTime(currentTime)}</span>
              <div className="flex-1 [&>div>div:last-child]:hidden">
                <PlayerScrubber currentTime={currentTime} duration={duration} onSeek={seekTo} />
              </div>
              <span className="w-10">{formatTime(duration)}</span>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={() => changeVolume(volume > 0 ? 0 : 1)} className="flex h-9 w-9 items-center justify-center text-white/60 hover:text-white" aria-label={volume > 0 ? 'Mute' : 'Unmute'}>
              {volume > 0 ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => changeVolume(parseFloat(e.target.value))}
              aria-label="Volume"
              className="h-1 w-24 cursor-pointer accent-[#39FF14]"
            />
            <button type="button" onClick={openDrawer} className="flex h-9 w-9 items-center justify-center text-white/60 hover:text-white" aria-label="Open Now Playing">
              <ChevronUp className="h-5 w-5" />
            </button>
            <button type="button" onClick={stop} className="flex h-9 w-9 items-center justify-center text-white/45 hover:text-white" aria-label="Stop">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Phones and tablets: a floating glass card above the pill (10px pill offset + 14px gap),
          or beside the plus button when the member has collapsed the pill. */}
      <div
        className={
          navCollapsedSide === 'right'
            ? 'fixed left-3 right-[84px] z-50 bottom-[calc(env(safe-area-inset-bottom,0px)+10px)] lg:hidden'
            : navCollapsedSide === 'left'
              ? 'fixed left-[84px] right-3 z-50 bottom-[calc(env(safe-area-inset-bottom,0px)+10px)] lg:hidden'
              : 'fixed inset-x-3 z-50 bottom-[calc(var(--shell-nav-height,64px)+env(safe-area-inset-bottom,0px)+24px)] lg:hidden'
        }
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
              <MarqueeGroup>
              <MarqueeText active={isPlaying} className="text-[15px] font-semibold text-white">{currentTrack.title}</MarqueeText>
              <MarqueeText active={isPlaying} className="text-xs text-white/60">{subtitle}</MarqueeText>
              </MarqueeGroup>
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
      </>
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
              <MarqueeGroup>
              <MarqueeText active={isPlaying} className="text-sm font-medium text-white">
                {currentTrack.title}
              </MarqueeText>
              {isSongNowPlayingTrack(currentTrack, contentCategory) ? (
                <MarqueeText active={isPlaying} className="text-xs text-neutral-400">
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
                </MarqueeText>
              ) : (
                <MarqueeText active={isPlaying} className="text-xs text-neutral-400">
                  {setName || currentTrack.artist || 'Vibration Fit'}
                </MarqueeText>
              )}
              </MarqueeGroup>
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
