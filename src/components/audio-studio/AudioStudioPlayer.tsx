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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#111] border-t border-neutral-800 backdrop-blur-xl safe-area-bottom">
      {/* Progress bar (clickable) */}
      <div
        className="h-1 bg-neutral-800 cursor-pointer group"
        onClick={handleProgressClick}
      >
        <div
          className="h-full bg-[#39FF14] transition-all duration-150 group-hover:h-1.5"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center gap-3 px-4 py-2.5 md:px-6 md:py-3">
        {/* Track info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {currentTrack.title}
          </p>
          <p className="text-xs text-neutral-500 truncate">
            {player.setName && <span>{player.setName} &middot; </span>}
            {formatTime(currentTime)} / {formatTime(duration)}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={skipPrev}
            className="p-2 text-neutral-400 hover:text-white transition-colors"
            disabled={player.currentIndex === 0 && currentTime < 3}
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={player.isPlaying ? pausePlayer : resumePlayer}
            className="p-2.5 bg-white rounded-full text-black hover:bg-neutral-200 transition-colors"
          >
            {player.isPlaying ? (
              <Pause className="w-4 h-4" fill="currentColor" />
            ) : (
              <Play className="w-4 h-4" fill="currentColor" />
            )}
          </button>

          <button
            onClick={skipNext}
            className="p-2 text-neutral-400 hover:text-white transition-colors"
            disabled={player.currentIndex >= player.tracks.length - 1}
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={stopPlayer}
            className="p-2 text-neutral-500 hover:text-neutral-300 transition-colors ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Track counter (desktop) */}
        <div className="hidden md:block text-xs text-neutral-500 w-16 text-right">
          {player.currentIndex + 1} / {player.tracks.length}
        </div>
      </div>
    </div>
  )
}
