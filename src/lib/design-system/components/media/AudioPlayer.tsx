'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { cn } from '../shared-utils'
import type { AudioTrack } from './types'

interface AudioPlayerProps {
  track: AudioTrack
  autoPlay?: boolean
  className?: string
  onTrackEnd?: () => void
  showInfo?: boolean
}

export const AudioPlayer = React.forwardRef<HTMLAudioElement, AudioPlayerProps>(
  ({ track, autoPlay = false, className = '', onTrackEnd, showInfo = true }, ref) => {
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(1)
    const [isMuted, setIsMuted] = useState(false)
    const audioRef = useRef<HTMLAudioElement>(null)
    const hasTrackedCurrentPlay = useRef<boolean>(false)

    const handleTrackComplete = useCallback(async (trackId: string) => {
      if (hasTrackedCurrentPlay.current) return
      
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        await supabase.rpc('increment_audio_play', {
          p_track_id: trackId
        })
        hasTrackedCurrentPlay.current = true
      } catch (error) {
        console.error('Failed to track audio play:', error)
      }
    }, [])

    const checkAndTrackCompletion = useCallback(() => {
      const audio = audioRef.current
      if (!audio || !audio.duration || hasTrackedCurrentPlay.current) return
      
      const completionPercentage = (audio.currentTime / audio.duration) * 100
      if (completionPercentage >= 80 && track?.id) {
        handleTrackComplete(track.id)
      }
    }, [track?.id, handleTrackComplete])

    useEffect(() => {
      const audio = audioRef.current
      if (!audio) return

      const setAudioData = () => setDuration(audio.duration)
      const setAudioTime = () => setCurrentTime(audio.currentTime)
      const handleEnded = () => {
        checkAndTrackCompletion()
        setIsPlaying(false)
        setCurrentTime(0)
        onTrackEnd?.()
      }

      audio.addEventListener('loadeddata', setAudioData)
      audio.addEventListener('timeupdate', setAudioTime)
      audio.addEventListener('ended', handleEnded)

      return () => {
        audio.removeEventListener('loadeddata', setAudioData)
        audio.removeEventListener('timeupdate', setAudioTime)
        audio.removeEventListener('ended', handleEnded)
      }
    }, [track, onTrackEnd, checkAndTrackCompletion])

    useEffect(() => {
      return () => checkAndTrackCompletion()
    }, [track?.id, checkAndTrackCompletion])

    useEffect(() => {
      hasTrackedCurrentPlay.current = false
    }, [track?.id])

    const togglePlayPause = () => {
      const audio = audioRef.current
      if (!audio) return

      if (isPlaying) {
        audio.pause()
      } else {
        audio.play()
      }
      setIsPlaying(!isPlaying)
    }

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      const audio = audioRef.current
      if (!audio) return
      
      const time = parseFloat(e.target.value)
      audio.currentTime = time
      setCurrentTime(time)
    }

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const audio = audioRef.current
      if (!audio) return
      
      const vol = parseFloat(e.target.value)
      audio.volume = vol
      setVolume(vol)
      setIsMuted(vol === 0)
    }

    const toggleMute = () => {
      const audio = audioRef.current
      if (!audio) return
      
      if (isMuted) {
        audio.volume = volume
        setIsMuted(false)
      } else {
        audio.volume = 0
        setIsMuted(true)
      }
    }

    const formatTime = (time: number) => {
      if (isNaN(time)) return '0:00'
      const minutes = Math.floor(time / 60)
      const seconds = Math.floor(time % 60)
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    return (
      <div className={cn('bg-[#1F1F1F] border-2 border-[#333] rounded-2xl p-4 md:p-6', className)}>
        <audio
          ref={audioRef}
          src={track.url}
          autoPlay={autoPlay}
        />

        {showInfo && (
          <div className="mb-4">
            <h3 className="text-white font-semibold text-lg">{track.title}</h3>
            {track.artist && <p className="text-neutral-400 text-sm">{track.artist}</p>}
          </div>
        )}

        <div className="flex items-center gap-4">
          <button
            onClick={togglePlayPause}
            className="w-12 h-12 rounded-full bg-[#39FF14] hover:bg-[#00CC44] transition-colors flex items-center justify-center"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-black" fill="black" />
            ) : (
              <Play className="w-6 h-6 text-black" fill="black" />
            )}
          </button>

          <div className="flex-1">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-neutral-400 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="text-neutral-400 hover:text-white transition-colors">
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    )
  }
)
AudioPlayer.displayName = 'AudioPlayer'
