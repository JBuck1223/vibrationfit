'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle } from 'lucide-react'
import { cn } from '../shared-utils'
import type { AudioTrack } from './types'

interface PlaylistPlayerProps {
  tracks: AudioTrack[]
  className?: string
  autoPlay?: boolean
  setIcon?: React.ReactNode
  setName?: string
  trackCount?: number
  createdDate?: string
}

export const PlaylistPlayer: React.FC<PlaylistPlayerProps> = ({ 
  tracks, 
  className = '',
  autoPlay = false,
  setIcon,
  setName,
  trackCount,
  createdDate
}) => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off')
  const [isShuffled, setIsShuffled] = useState(false)
  const [originalOrder, setOriginalOrder] = useState<number[]>([])
  const [trackDurations, setTrackDurations] = useState<Map<string, number>>(new Map())
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const lastRepeatClickRef = useRef<number>(0)
  const hasTrackedCurrentPlay = useRef<boolean>(false)

  const currentTrack = tracks[currentTrackIndex]
  
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
    if (completionPercentage >= 80) {
      const track = tracks[currentTrackIndex]
      if (track?.id) {
        handleTrackComplete(track.id)
      }
    }
  }, [currentTrackIndex, tracks, handleTrackComplete])
  
  useEffect(() => {
    tracks.forEach(track => {
      if (track.url && !trackDurations.has(track.id)) {
        const tempAudio = new Audio()
        tempAudio.src = track.url
        tempAudio.addEventListener('loadedmetadata', () => {
          if (tempAudio.duration && !isNaN(tempAudio.duration) && isFinite(tempAudio.duration)) {
            setTrackDurations(prev => {
              const newMap = new Map(prev)
              newMap.set(track.id, tempAudio.duration)
              return newMap
            })
          }
        })
      }
    })
  }, [tracks, trackDurations])
  
  const handleNext = useCallback(() => {
    // Add a small gap before transitioning to next track
    setIsPlaying(false)
    
    setTimeout(() => {
      setCurrentTrackIndex((currentIndex) => {
        let newIndex = currentIndex + 1

        if (repeatMode === 'one') {
          newIndex = currentIndex
        } else if (repeatMode === 'all' && newIndex >= tracks.length) {
          newIndex = 0
        } else if (newIndex >= tracks.length) {
          return currentIndex
        }

        setCurrentTime(0)
        setIsPlaying(true) // Resume playing after gap
        return newIndex
      })
    }, 800) // 800ms gap between tracks
  }, [repeatMode, tracks.length])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const setAudioData = () => {
      setDuration(audio.duration)
      if (currentTrack && audio.duration && !isNaN(audio.duration)) {
        setTrackDurations(prev => {
          const newMap = new Map(prev)
          newMap.set(currentTrack.id, audio.duration)
          return newMap
        })
      }
    }

    const setAudioTime = () => setCurrentTime(audio.currentTime)
    const handleEnded = () => {
      checkAndTrackCompletion()
      handleNext()
    }

    audio.addEventListener('loadeddata', setAudioData)
    audio.addEventListener('timeupdate', setAudioTime)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('loadeddata', setAudioData)
      audio.removeEventListener('timeupdate', setAudioTime)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [handleNext, currentTrack, checkAndTrackCompletion])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    
    checkAndTrackCompletion()
    hasTrackedCurrentPlay.current = false
    audio.src = currentTrack?.url || ''
    
    // Wait for audio to be ready before playing to prevent cutting off the beginning
    if (isPlaying && currentTrack?.url) {
      const playWhenReady = () => {
        audio.play().catch(() => setIsPlaying(false))
        audio.removeEventListener('canplaythrough', playWhenReady)
      }
      
      // If already loaded, play immediately
      if (audio.readyState >= 3) {
        audio.play().catch(() => setIsPlaying(false))
      } else {
        // Otherwise wait for it to be ready
        audio.addEventListener('canplaythrough', playWhenReady, { once: true })
      }
    }
  }, [currentTrackIndex, currentTrack?.url, isPlaying, checkAndTrackCompletion])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch(() => setIsPlaying(false))
    }
    setIsPlaying(!isPlaying)
  }

  const handlePrevious = () => {
    checkAndTrackCompletion()
    
    // Add a small gap before transitioning to previous track
    const wasPlaying = isPlaying
    setIsPlaying(false)
    
    setTimeout(() => {
      setCurrentTrackIndex((currentIndex) => {
        const newIndex = currentIndex - 1 < 0 ? tracks.length - 1 : currentIndex - 1
        setCurrentTime(0)
        if (wasPlaying) {
          setIsPlaying(true) // Resume playing after gap
        }
        return newIndex
      })
    }, 400) // Shorter gap for manual navigation
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

  const toggleRepeat = () => {
    const now = Date.now()
    if (now - lastRepeatClickRef.current < 300) {
      setRepeatMode('one')
    } else {
      setRepeatMode(prev => prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off')
    }
    lastRepeatClickRef.current = now
  }

  const toggleShuffle = () => {
    if (!isShuffled) {
      const order = tracks.map((_, i) => i)
      setOriginalOrder(order)
      const shuffled = [...order].sort(() => Math.random() - 0.5)
      setCurrentTrackIndex(shuffled[0])
    } else {
      setCurrentTrackIndex(originalOrder[currentTrackIndex] || 0)
    }
    setIsShuffled(!isShuffled)
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const totalDuration = tracks.reduce((sum, track) => {
    const dur = trackDurations.get(track.id) || track.duration || 0
    return sum + dur
  }, 0)

  return (
    <div className={cn('bg-[#1F1F1F] border-2 border-[#333] rounded-2xl p-4 md:p-6', className)}>
      <audio ref={audioRef} autoPlay={autoPlay} />

      {(setIcon || setName) && (
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#333]">
          {setIcon && <div className="flex-shrink-0">{setIcon}</div>}
          <div className="flex-1 min-w-0">
            {setName && <h3 className="text-white font-semibold text-lg truncate">{setName}</h3>}
            <div className="flex gap-3 text-xs text-neutral-400">
              {trackCount && <span>{trackCount} tracks</span>}
              {createdDate && <span>{createdDate}</span>}
              {totalDuration > 0 && <span>{formatTime(totalDuration)}</span>}
            </div>
          </div>
        </div>
      )}

      {currentTrack && (
        <div className="mb-4 text-center">
          <h4 className="text-white font-semibold">{currentTrack.title}</h4>
          {currentTrack.artist && <p className="text-neutral-400 text-sm">{currentTrack.artist}</p>}
        </div>
      )}

      {/* Shuffle and Repeat - Below title */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <button onClick={toggleShuffle} className={cn('p-2 rounded-lg transition-colors', isShuffled ? 'text-[#39FF14] bg-[#39FF14]/20' : 'text-neutral-400 hover:text-white')}>
          <Shuffle className="w-4 h-4" />
        </button>
        <button onClick={toggleRepeat} className={cn('p-2 rounded-lg transition-colors', repeatMode !== 'off' ? 'text-[#39FF14] bg-[#39FF14]/20' : 'text-neutral-400 hover:text-white')}>
          <Repeat className="w-4 h-4" />
          {repeatMode === 'one' && <span className="text-[10px] absolute">1</span>}
        </button>
      </div>

      <div className="space-y-4">
        <div>
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

        {/* Playback controls */}
        <div className="flex items-center justify-center gap-2">
          <button onClick={handlePrevious} className="p-2 text-neutral-400 hover:text-white transition-colors">
            <SkipBack className="w-5 h-5" />
          </button>
          <button onClick={togglePlayPause} className="w-12 h-12 rounded-full bg-[#39FF14] hover:bg-[#00CC44] transition-colors flex items-center justify-center">
            {isPlaying ? <Pause className="w-6 h-6 text-black" fill="black" /> : <Play className="w-6 h-6 text-black" fill="black" />}
          </button>
          <button onClick={handleNext} className="p-2 text-neutral-400 hover:text-white transition-colors">
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1 max-h-48 overflow-y-auto">
          {tracks.map((track, index) => (
            <button
              key={track.id}
              onClick={() => {
                checkAndTrackCompletion()
                
                // Add a small gap before transitioning when clicking a track
                const wasPlaying = isPlaying
                setIsPlaying(false)
                
                setTimeout(() => {
                  setCurrentTrackIndex(index)
                  if (wasPlaying) {
                    setIsPlaying(true)
                  }
                }, 300) // Short gap for direct selection
              }}
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg transition-colors',
                index === currentTrackIndex ? 'bg-[#39FF14]/20 text-[#39FF14]' : 'text-neutral-300 hover:bg-[#333]'
              )}
            >
              <div className="flex justify-between items-center">
                <span className="truncate">{track.title}</span>
                <span className="text-xs text-neutral-500 ml-2">{formatTime(trackDurations.get(track.id) || track.duration || 0)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
