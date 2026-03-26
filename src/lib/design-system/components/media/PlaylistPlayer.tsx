'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Edit2, Download, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '../shared-utils'
import { useMediaSession } from '@/hooks/useMediaSession'
import { useAudioOffline } from '@/hooks/useAudioOffline'
import type { AudioTrack } from './types'

interface PlaylistPlayerProps {
  tracks: AudioTrack[]
  className?: string
  autoPlay?: boolean
  setIcon?: React.ReactNode
  setName?: string
  trackCount?: number
  createdDate?: string
  voiceName?: string
  backgroundTrack?: string
  mixRatio?: string
  onRename?: (newName: string) => void
  onDurationCalculated?: (duration: number) => void
}

export const PlaylistPlayer: React.FC<PlaylistPlayerProps> = ({ 
  tracks, 
  className = '',
  autoPlay = false,
  setIcon,
  setName,
  trackCount,
  createdDate,
  voiceName,
  backgroundTrack,
  mixRatio,
  onRename,
  onDurationCalculated
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
  const [isEditingName, setIsEditingName] = useState(false)
  const [editingName, setEditingName] = useState('')
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const lastRepeatClickRef = useRef<number>(0)
  const hasTrackedThisListen = useRef<boolean>(false)

  const currentTrack = tracks[currentTrackIndex]

  const handleMediaPlay = useCallback(() => {
    const audio = audioRef.current
    if (audio) { audio.play().catch(() => setIsPlaying(false)); setIsPlaying(true) }
  }, [])

  const handleMediaPause = useCallback(() => {
    const audio = audioRef.current
    if (audio) { audio.pause(); setIsPlaying(false) }
  }, [])

  const handleMediaNext = useCallback(() => {
    setCurrentTrackIndex((currentIndex) => {
      const newIndex = currentIndex + 1 >= tracks.length ? 0 : currentIndex + 1
      setCurrentTime(0)
      setIsPlaying(true)
      return newIndex
    })
  }, [tracks.length])

  const handleMediaPrevious = useCallback(() => {
    setCurrentTrackIndex((currentIndex) => {
      const newIndex = currentIndex - 1 < 0 ? tracks.length - 1 : currentIndex - 1
      setCurrentTime(0)
      setIsPlaying(true)
      return newIndex
    })
  }, [tracks.length])

  useMediaSession({
    track: currentTrack,
    isPlaying,
    onPlay: handleMediaPlay,
    onPause: handleMediaPause,
    onNext: handleMediaNext,
    onPrevious: handleMediaPrevious,
    audioRef,
  })

  const { cachedTrackIds, downloadingTrackIds, downloadTrack, downloadAllTracks, removeTrack, getPlaybackUrl } = useAudioOffline(tracks)
  const [resolvedUrl, setResolvedUrl] = useState<string>('')
  const allCached = tracks.length > 0 && tracks.every(t => cachedTrackIds.has(t.id))
  const anyDownloading = downloadingTrackIds.size > 0

  useEffect(() => {
    let cancelled = false
    if (currentTrack) {
      getPlaybackUrl(currentTrack).then(url => {
        if (!cancelled) setResolvedUrl(url)
      })
    }
    return () => { cancelled = true }
  }, [currentTrack, cachedTrackIds, getPlaybackUrl])

  const handleTrackComplete = useCallback(async (trackId: string) => {
    if (hasTrackedThisListen.current) return
    
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.rpc('increment_audio_play', {
        p_track_id: trackId
      })
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('area_activations').insert({
          user_id: user.id,
          area: 'vision_audio',
        })
      }
    } catch (error) {
      console.error('Failed to track audio play:', error)
    }
  }, [])

  const checkAndTrackPlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio || hasTrackedThisListen.current) return
    
    if (audio.currentTime >= 5) {
      const track = tracks[currentTrackIndex]
      if (track?.id) {
        hasTrackedThisListen.current = true
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

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime)
      checkAndTrackPlay()
    }
    const handleEnded = () => {
      hasTrackedThisListen.current = false
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
  }, [handleNext, currentTrack, checkAndTrackPlay])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !resolvedUrl) return
    
    checkAndTrackPlay()
    hasTrackedThisListen.current = false
    audio.src = resolvedUrl
    
    if (isPlaying && resolvedUrl) {
      const playWhenReady = () => {
        audio.play().catch(() => setIsPlaying(false))
        audio.removeEventListener('canplaythrough', playWhenReady)
      }
      
      if (audio.readyState >= 3) {
        audio.play().catch(() => setIsPlaying(false))
      } else {
        audio.addEventListener('canplaythrough', playWhenReady, { once: true })
      }
    }
  }, [currentTrackIndex, resolvedUrl, isPlaying, checkAndTrackPlay])

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
    hasTrackedThisListen.current = false
    
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

  const handleStartEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setIsEditingName(true)
    setEditingName(setName || '')
  }

  const handleSaveEdit = () => {
    if (editingName.trim() && onRename) {
      onRename(editingName.trim())
    }
    setIsEditingName(false)
  }

  const handleCancelEdit = () => {
    setIsEditingName(false)
    setEditingName('')
  }

  return (
    <div className={cn('bg-[#1F1F1F] border-2 border-[#333] rounded-2xl p-4 md:p-6 overflow-hidden', className)}>
      <audio ref={audioRef} autoPlay={autoPlay} />

      {(setIcon || setName) && (
        <div className="-mx-4 md:-mx-6 -mt-4 md:-mt-6 mb-4 pb-4 px-4 md:px-6 pt-4 md:pt-6 bg-gradient-to-b from-[#2A2A2A] to-[#1F1F1F] rounded-t-2xl border-b border-[#333]">
          {/* Icon - Centered */}
          {setIcon && (
            <div className="flex justify-center mb-3">
              {setIcon}
            </div>
          )}
          
          {/* Title - Centered with edit functionality */}
          {setName && (
            <div className="flex justify-center items-center mb-2">
              {isEditingName ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={handleSaveEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit()
                    if (e.key === 'Escape') handleCancelEdit()
                  }}
                  autoFocus
                  className="bg-[#2A2A2A] text-white px-3 py-1 rounded-lg text-base md:text-lg font-semibold text-center focus:outline-none focus:ring-2 focus:ring-primary-500 max-w-md w-full"
                />
              ) : (
                <div
                  className="group/title flex items-center justify-center gap-2"
                  onClick={onRename ? handleStartEdit : undefined}
                  role={onRename ? 'button' : undefined}
                  tabIndex={onRename ? 0 : undefined}
                >
                  <h3 className={`text-white font-semibold text-lg text-center${onRename ? ' cursor-pointer' : ''}`}>
                    {setName}
                  </h3>
                  {onRename && (
                    <Edit2
                      className="w-4 h-4 text-neutral-400 hover:text-white cursor-pointer opacity-100 md:opacity-0 md:group-hover/title:opacity-100 transition-opacity flex-shrink-0"
                      onClick={handleStartEdit}
                    />
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Tracks/Date/Duration - Under title */}
          {(trackCount || createdDate || totalDuration > 0) && (
            <div className="flex items-center justify-center gap-2 text-xs text-neutral-400">
              {trackCount && <span>{trackCount} tracks</span>}
              {trackCount && (createdDate || totalDuration > 0) && <span>•</span>}
              {createdDate && <span>{createdDate}</span>}
              {createdDate && totalDuration > 0 && <span>•</span>}
              {totalDuration > 0 && <span>{formatTime(totalDuration)}</span>}
            </div>
          )}

          {/* Download All for offline */}
          <div className="flex justify-center mt-3">
            <button
              onClick={() => allCached ? tracks.forEach(t => removeTrack(t.id)) : downloadAllTracks(tracks)}
              disabled={anyDownloading}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                allCached
                  ? 'text-[#39FF14] bg-[#39FF14]/10 hover:bg-[#39FF14]/20'
                  : anyDownloading
                    ? 'text-neutral-500 bg-neutral-800 cursor-wait'
                    : 'text-neutral-300 bg-neutral-800 hover:bg-neutral-700'
              )}
            >
              {anyDownloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : allCached ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              {allCached ? 'Available Offline' : anyDownloading ? 'Downloading...' : 'Download for Offline'}
            </button>
          </div>
        </div>
      )}

      {currentTrack && (
        <div className="mt-6 mb-3 text-center">
          <h4 className="text-white font-semibold text-lg">{currentTrack.title}</h4>
          {currentTrack.artist && <p className="text-neutral-400 text-sm">{currentTrack.artist}</p>}
        </div>
      )}

      {/* Shuffle and Repeat - Below title */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <button onClick={toggleShuffle} className={cn('p-2 rounded-lg transition-colors', isShuffled ? 'text-[#39FF14] bg-[#39FF14]/20' : 'text-neutral-400 hover:text-white')}>
          <Shuffle className="w-4 h-4" />
        </button>
        <button onClick={toggleRepeat} className={cn('relative p-2 rounded-lg transition-colors', repeatMode !== 'off' ? 'text-[#39FF14] bg-[#39FF14]/20' : 'text-neutral-400 hover:text-white')}>
          <Repeat className="w-4 h-4" />
          {repeatMode === 'one' && <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold leading-none">1</span>}
        </button>
      </div>

      <div className="space-y-3">
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

        <div className="space-y-1 max-h-48 overflow-y-auto mt-4">
          {tracks.map((track, index) => {
            const trackCached = cachedTrackIds.has(track.id)
            const trackDownloading = downloadingTrackIds.has(track.id)
            return (
              <div key={track.id} className="flex items-center gap-1">
                <button
                  onClick={() => {
                    checkAndTrackPlay()
                    const wasPlaying = isPlaying
                    setIsPlaying(false)
                    setTimeout(() => {
                      setCurrentTrackIndex(index)
                      if (wasPlaying) {
                        setIsPlaying(true)
                      }
                    }, 300)
                  }}
                  className={cn(
                    'flex-1 text-left px-3 py-2 rounded-lg transition-colors min-w-0',
                    index === currentTrackIndex ? 'bg-[#39FF14]/20 text-[#39FF14]' : 'text-neutral-300 hover:bg-[#333]'
                  )}
                >
                  <div className="flex justify-between items-center">
                    <span className="truncate">{track.title}</span>
                    <span className="text-xs text-neutral-500 ml-2 flex-shrink-0">{formatTime(trackDurations.get(track.id) || track.duration || 0)}</span>
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    trackCached ? removeTrack(track.id) : downloadTrack(track)
                  }}
                  disabled={trackDownloading}
                  title={trackCached ? 'Remove offline copy' : trackDownloading ? 'Downloading...' : 'Download for offline'}
                  className={cn(
                    'p-1.5 rounded-lg transition-colors flex-shrink-0',
                    trackCached ? 'text-[#39FF14]/70 hover:text-[#39FF14]' : 'text-neutral-500 hover:text-neutral-300',
                    trackDownloading && 'cursor-wait'
                  )}
                >
                  {trackDownloading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : trackCached ? (
                    <CheckCircle className="w-3.5 h-3.5" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
