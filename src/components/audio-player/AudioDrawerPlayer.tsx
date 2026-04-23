'use client'

import React, { useRef, useCallback, useEffect, useState } from 'react'
import { Play, Pause, SkipBack, SkipForward, ChevronDown, X, Shuffle, Repeat } from 'lucide-react'
import { useGlobalAudioStore } from '@/lib/stores/global-audio-store'
import { TrackArtwork } from './TrackArtwork'
import { cn } from '@/lib/design-system/components/shared-utils'

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

  const [showPlaylist, setShowPlaylist] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef(0)
  const touchCurrentY = useRef(0)
  const isDragging = useRef(false)
  const lastRepeatClickRef = useRef(0)

  const currentTrack = tracks[currentIndex] ?? null
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden'
      setShowPlaylist(false)
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
      if (showPlaylist) {
        setShowPlaylist(false)
      } else {
        closeDrawer()
      }
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
        className="absolute inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[420px] md:max-h-[85vh] md:rounded-2xl bg-[#111] md:border md:border-neutral-800 flex flex-col transition-transform duration-300"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-neutral-600" />
        </div>

        <div className="flex items-center justify-between px-5 py-3">
          <button
            onClick={closeDrawer}
            className="p-2 -ml-2 text-neutral-400 hover:text-white transition-colors md:hidden"
            aria-label="Close"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
          <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">
            {showPlaylist ? 'Playlist' : 'Now Playing'}
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

        {!showPlaylist ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 pb-8 min-h-0">
            <TrackArtwork
              track={currentTrack}
              iconKey={setIconKey}
              size={256}
              className="rounded-2xl overflow-hidden shadow-2xl mb-8 flex-shrink-0 md:!w-56 md:!h-56"
            />

            <div className="text-center mb-6 w-full">
              <h3 className="text-xl font-semibold text-white truncate">
                {currentTrack.title}
              </h3>
              <p className="text-sm text-neutral-400 mt-1 truncate">
                {setName || currentTrack.artist || 'VibrationFit'}
              </p>
            </div>

            <div className="w-full mb-4">
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-neutral-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg"
                style={{
                  background: `linear-gradient(to right, #39FF14 ${progress}%, #404040 ${progress}%)`,
                }}
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1.5">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 mb-4">
              <button
                onClick={skipPrev}
                className="p-3 text-neutral-400 hover:text-white transition-colors"
                disabled={currentIndex === 0 && currentTime < 3}
                aria-label="Previous"
              >
                <SkipBack className="w-6 h-6" />
              </button>

              <button
                onClick={isPlaying ? pause : resume}
                className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:bg-neutral-200 transition-colors shadow-lg"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7" fill="currentColor" />
                ) : (
                  <Play className="w-7 h-7 ml-1" fill="currentColor" />
                )}
              </button>

              <button
                onClick={skipNext}
                className="p-3 text-neutral-400 hover:text-white transition-colors"
                disabled={currentIndex >= tracks.length - 1}
                aria-label="Next"
              >
                <SkipForward className="w-6 h-6" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 mb-4">
              <button
                onClick={toggleShuffle}
                className={cn('p-2 rounded-lg transition-colors', isShuffled ? 'text-[#39FF14] bg-[#39FF14]/20' : 'text-neutral-400 hover:text-white')}
              >
                <Shuffle className="w-4 h-4" />
              </button>
              <button
                onClick={handleToggleRepeat}
                className={cn('relative p-2 rounded-lg transition-colors', repeatMode !== 'off' ? 'text-[#39FF14] bg-[#39FF14]/20' : 'text-neutral-400 hover:text-white')}
              >
                <Repeat className="w-4 h-4" />
                {repeatMode === 'one' && <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold leading-none text-[#39FF14]">1</span>}
              </button>
            </div>

            {tracks.length > 1 && (
              <button
                onClick={() => setShowPlaylist(true)}
                className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                {currentIndex + 1} of {tracks.length} &middot; View Playlist
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 pb-6 min-h-0">
            <div className="space-y-1">
              {tracks.map((track, index) => {
                const isActive = index === currentIndex
                return (
                  <button
                    key={track.id}
                    onClick={() => {
                      playTrack(index)
                      setShowPlaylist(false)
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3',
                      isActive ? 'bg-[#39FF14]/20 text-[#39FF14]' : 'text-neutral-300 hover:bg-[#222]'
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
                      {track.artist && <p className="truncate text-xs text-neutral-500">{track.artist}</p>}
                    </div>
                    {isActive && isPlaying && (
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <span className="w-0.5 h-3 bg-[#39FF14] rounded-full animate-pulse" />
                        <span className="w-0.5 h-4 bg-[#39FF14] rounded-full animate-pulse [animation-delay:150ms]" />
                        <span className="w-0.5 h-2.5 bg-[#39FF14] rounded-full animate-pulse [animation-delay:300ms]" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
