'use client'

import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react'
import { Play, Pause, SkipBack, SkipForward, ChevronDown, X, Shuffle, Repeat, Loader2, AlignLeft } from 'lucide-react'
import { useGlobalAudioStore } from '@/lib/stores/global-audio-store'
import { colors } from '../../../tokens'
import { TrackArtwork } from './TrackArtwork'
import { PlayerScrubber, TransportControls } from './PlayerControls'
import { TrackNowPlayingMeta, MusicTrackListSubtitle, isSongNowPlayingTrack } from './TrackArtistLine'
import { cn } from '../../shared-utils'
import { SyncedLyricsDisplay, PlainLyricsDisplay } from '@/components/audio-studio/SyncedLyricsDisplay'
import type { SyncedLyrics } from '@/lib/utils/lyrics-alignment'

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function AudioDrawerPlayer() {
  const tracks = useGlobalAudioStore(s => s.tracks)
  const currentIndex = useGlobalAudioStore(s => s.currentIndex)
  const isPlaying = useGlobalAudioStore(s => s.isPlaying)
  const currentTime = useGlobalAudioStore(s => s.currentTime)
  const duration = useGlobalAudioStore(s => s.duration)
  const setName = useGlobalAudioStore(s => s.setName)
  const setIconKey = useGlobalAudioStore(s => s.setIconKey)
  const contentCategory = useGlobalAudioStore(s => s.contentCategory)
  const repeatMode = useGlobalAudioStore(s => s.repeatMode)
  const isShuffled = useGlobalAudioStore(s => s.isShuffled)
  const isDrawerOpen = useGlobalAudioStore(s => s.isDrawerOpen)
  const closeDrawer = useGlobalAudioStore(s => s.closeDrawer)
  const pause = useGlobalAudioStore(s => s.pause)
  const resume = useGlobalAudioStore(s => s.resume)
  const seekTo = useGlobalAudioStore(s => s.seekTo)
  const skipNext = useGlobalAudioStore(s => s.skipNext)
  const skipPrev = useGlobalAudioStore(s => s.skipPrev)
  const playTrack = useGlobalAudioStore(s => s.playTrack)
  const setRepeatMode = useGlobalAudioStore(s => s.setRepeatMode)
  const toggleShuffle = useGlobalAudioStore(s => s.toggleShuffle)

  const isBuffering = useGlobalAudioStore(s => s.isBuffering)

  const [showPlaylist, setShowPlaylist] = useState(false)
  const [showLyrics, setShowLyrics] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef(0)
  const touchCurrentY = useRef(0)
  const isDragging = useRef(false)
  const lastRepeatClickRef = useRef(0)

  const currentTrack = tracks[currentIndex] ?? null
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const isMusicTrack = currentTrack?.sectionKey === 'music'
  const hasLyrics = isMusicTrack && !!(currentTrack?.syncedLyrics || currentTrack?.plainLyrics)

  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden'
      setShowPlaylist(false)
      setShowLyrics(false)
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isDrawerOpen])

  useEffect(() => {
    if (!isDrawerOpen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isDrawerOpen, closeDrawer])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
    isDragging.current = false
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchCurrentY.current = e.touches[0].clientY
    const diff = touchCurrentY.current - touchStartY.current
    if (diff > 10) {
      isDragging.current = true
      if (drawerRef.current) {
        drawerRef.current.style.transform = `translateY(${Math.max(0, diff)}px)`
      }
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    const diff = touchCurrentY.current - touchStartY.current
    if (drawerRef.current) {
      drawerRef.current.style.transform = ''
    }
    if (isDragging.current && diff > 100) {
      closeDrawer()
    }
    isDragging.current = false
  }, [closeDrawer, showPlaylist])

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seekTo(parseFloat(e.target.value))
  }

  const handleToggleRepeat = () => {
    const now = Date.now()
    if (now - lastRepeatClickRef.current < 300) {
      setRepeatMode('one')
    } else {
      setRepeatMode(repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off')
    }
    lastRepeatClickRef.current = now
  }

  if (!isDrawerOpen || !currentTrack) return null

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={closeDrawer}
      />

      <div
        ref={drawerRef}
        className="absolute inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[440px] md:max-h-[88vh] md:rounded-[32px] overflow-hidden bg-[#0f0c16] md:border md:border-white/[0.12] flex flex-col transition-transform duration-300 pt-[env(safe-area-inset-top,0px)]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Ambient glow from the artwork, like a native Now Playing screen */}
        {currentTrack.thumbnail ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 scale-125 bg-cover bg-center opacity-60 blur-3xl saturate-150"
            style={{ backgroundImage: `url("${currentTrack.thumbnail}")` }}
          />
        ) : (
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_0%,rgba(120,60,200,0.45),transparent_70%)]" />
        )}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black/80" />

        <div className="relative md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/40" />
        </div>

        <div className="relative flex items-center justify-between px-5 py-3">
          <button
            onClick={closeDrawer}
            className="p-2 -ml-2 text-neutral-400 hover:text-white transition-colors md:hidden"
            aria-label="Close"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
          <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">
            Now Playing
          </p>
          <button
            onClick={closeDrawer}
            className="p-2 -mr-2 text-neutral-400 hover:text-white transition-colors hidden md:block"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-10 md:hidden" />
        </div>

        <div className="relative flex-1 flex flex-col min-h-0 overflow-y-auto">
          <div className="flex flex-col items-center px-7 pb-6">
            <TrackArtwork
              track={currentTrack}
              iconKey={setIconKey}
              size={300}
              className="rounded-[28px] overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.55)] mt-2 mb-8 flex-shrink-0 !w-[min(78vw,300px)] !h-[min(78vw,300px)] md:!w-64 md:!h-64"
            />

            <div className="mb-5 w-full text-left">
              <h3 className="text-2xl font-bold text-white truncate">
                {currentTrack.title}
              </h3>
              <div className="mt-1">
                {isSongNowPlayingTrack(currentTrack, contentCategory) ? (
                  <TrackNowPlayingMeta track={currentTrack} />
                ) : (
                  <p className="text-sm text-neutral-400 truncate">
                    {setName || currentTrack.artist || 'Vibration Fit'}
                  </p>
                )}
              </div>
            </div>

            <div className="mb-4 w-full">
              <PlayerScrubber currentTime={currentTime} duration={duration} onSeek={seekTo} />
            </div>

            <div className="mb-6 w-full">
              <TransportControls
                isPlaying={isPlaying}
                isBuffering={isBuffering}
                onPlayPause={isPlaying ? pause : resume}
                onPrev={skipPrev}
                onNext={skipNext}
                canPrev={!(currentIndex === 0 && currentTime < 3)}
                canNext={currentIndex < tracks.length - 1 || repeatMode === 'all'}
                shuffle={isShuffled}
                onShuffle={toggleShuffle}
                repeatMode={repeatMode}
                onRepeat={handleToggleRepeat}
              />
            </div>

            <div className="flex items-center gap-3">
              {tracks.length > 1 && (
                <button
                  onClick={() => { setShowPlaylist(prev => !prev); setShowLyrics(false) }}
                  className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-medium text-white/80 hover:text-white transition-colors"
                >
                  {currentIndex + 1} of {tracks.length} &middot; {showPlaylist ? 'Hide queue' : 'Up next'}
                  <ChevronDown className={cn('w-3 h-3 transition-transform duration-200', showPlaylist && 'rotate-180')} />
                </button>
              )}
              {hasLyrics && (
                <button
                  onClick={() => { setShowLyrics(prev => !prev); setShowPlaylist(false) }}
                  className={cn(
                    'flex items-center gap-1.5 text-xs transition-colors',
                    showLyrics ? 'text-primary-500' : 'text-neutral-500 hover:text-neutral-300'
                  )}
                >
                  <AlignLeft className="w-3 h-3" />
                  {showLyrics ? 'Hide Lyrics' : 'Lyrics'}
                </button>
              )}
            </div>
          </div>

          {showPlaylist && tracks.length > 1 && (
            <div className="border-t border-white/10 px-4 py-3">
              <div className="space-y-1">
                {tracks.map((track, index) => {
                  const isActive = index === currentIndex
                  return (
                    <button
                      key={track.id}
                      onClick={() => playTrack(index)}
                      className={cn(
                        'w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3',
                        isActive ? 'bg-white/10 text-white' : 'text-white/75 hover:bg-white/[0.06]'
                      )}
                    >
                      <TrackArtwork
                        track={track}
                        iconKey={setIconKey}
                        size={36}
                        className="rounded-md overflow-hidden flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">{track.title}</p>
                        {track.versionLabel ? (
                          <p className="truncate text-xs text-neutral-500">{track.versionLabel}</p>
                        ) : isSongNowPlayingTrack(track, contentCategory) ? (
                          <MusicTrackListSubtitle albumLabel={track.albumLabel} />
                        ) : track.artist ? (
                          <p className="truncate text-xs text-neutral-500">{track.artist}</p>
                        ) : null}
                      </div>
                      <span className="text-xs text-neutral-500 flex-shrink-0 tabular-nums">
                        {track.duration && track.duration > 0 ? formatTime(track.duration) : ''}
                      </span>
                      {isActive && isBuffering && (
                        <Loader2 className="w-4 h-4 text-primary-500 animate-spin flex-shrink-0" />
                      )}
                      {isActive && isPlaying && !isBuffering && (
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <span className="w-0.5 h-3 bg-primary-500 rounded-full animate-pulse" />
                          <span className="w-0.5 h-4 bg-primary-500 rounded-full animate-pulse [animation-delay:150ms]" />
                          <span className="w-0.5 h-2.5 bg-primary-500 rounded-full animate-pulse [animation-delay:300ms]" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {showLyrics && hasLyrics && currentTrack && (
            <div className="border-t border-neutral-800/60 px-2 py-3">
              {currentTrack.syncedLyrics ? (
                <SyncedLyricsDisplay
                  syncedLyrics={currentTrack.syncedLyrics as SyncedLyrics}
                  plainText={currentTrack.plainLyrics}
                  defaultExpanded
                />
              ) : currentTrack.plainLyrics ? (
                <PlainLyricsDisplay
                  lyrics={currentTrack.plainLyrics}
                  defaultExpanded
                />
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
