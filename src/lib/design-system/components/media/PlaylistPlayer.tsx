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
  /** 'glass' = binaural-style card; 'app' = compact top-bar layout (music-app density) */
  variant?: 'default' | 'glass' | 'app'
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
  hideCurrentTrack?: boolean
  /** Omit set title/icon/meta row (parent shows the same, e.g. a card header) */
  hideSetHeader?: boolean
  /** Flatten outer chrome (use inside a parent card) */
  embedded?: boolean
}

export const PlaylistPlayer: React.FC<PlaylistPlayerProps> = ({ 
  tracks, 
  className = '',
  variant = 'default',
  autoPlay = false,
  setIcon,
  setName,
  trackCount,
  createdDate,
  voiceName,
  backgroundTrack,
  mixRatio,
  onRename,
  onDurationCalculated,
  hideCurrentTrack = false,
  hideSetHeader = false,
  embedded = false,
}) => {
  const isGlass = variant === 'glass'
  const isApp = variant === 'app'
  const isCompact = isGlass || isApp
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
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user

      await supabase.rpc('increment_audio_play', { p_track_id: trackId })

      if (user) {
        const today = new Date().toISOString().split('T')[0]
        await supabase.from('area_activations').upsert(
          { user_id: user.id, area: 'vision_audio', activation_date: today },
          { onConflict: 'user_id,area,activation_date', ignoreDuplicates: true },
        )
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

  const headerTitleBlock = setName && (
    <div className={cn('min-w-0', isApp ? 'flex-1' : 'flex justify-center items-center mb-2')}>
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
          className={cn(
            'bg-[#2A2A2A] text-white px-3 py-1 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 w-full',
            isApp ? 'text-left text-sm md:text-base' : 'text-base md:text-lg text-center max-w-md',
          )}
        />
      ) : (
        <h3
          className={cn(
            'group/title font-semibold text-white',
            isApp ? 'text-left text-sm font-medium leading-tight' : 'text-center',
            !isApp && (isCompact ? 'text-base' : 'text-lg'),
            onRename && 'cursor-pointer',
          )}
          onClick={onRename ? handleStartEdit : undefined}
          role={onRename ? 'button' : undefined}
          tabIndex={onRename ? 0 : undefined}
        >
          <span className="line-clamp-2">{setName}</span>
          {onRename && (
            <Edit2
              className="inline-block w-3 h-3 ml-1 -translate-y-0.5 text-neutral-400 hover:text-white cursor-pointer opacity-100 md:opacity-0 md:group-hover/title:opacity-100 transition-opacity"
              onClick={handleStartEdit}
            />
          )}
        </h3>
      )}
    </div>
  )

  const headerMeta = (trackCount || createdDate || totalDuration > 0) && (
    <div
      className={cn(
        'flex items-center gap-2 text-xs text-neutral-500',
        isApp ? 'mt-0.5 flex-wrap' : 'justify-center',
        !isApp && 'text-neutral-400',
      )}
    >
      {trackCount && <span>{trackCount} {trackCount === 1 ? 'track' : 'tracks'}</span>}
      {trackCount && (createdDate || totalDuration > 0) && <span className="text-neutral-600">|</span>}
      {createdDate && <span>{createdDate}</span>}
      {createdDate && totalDuration > 0 && <span className="text-neutral-600">|</span>}
      {totalDuration > 0 && <span>{formatTime(totalDuration)}</span>}
    </div>
  )

  const downloadAllButton = (
    <button
      type="button"
      onClick={() => (allCached ? tracks.forEach(t => removeTrack(t.id)) : downloadAllTracks(tracks))}
      disabled={anyDownloading}
      title={allCached ? 'Remove offline copies' : anyDownloading ? 'Downloading...' : 'Download for offline'}
      className={cn(
        'flex items-center transition-colors',
        isApp
          ? cn(
              isApp && hideSetHeader
                ? 'gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium disabled:opacity-50'
                : 'justify-center rounded-lg p-2 disabled:opacity-50',
              allCached
                ? 'text-[#39FF14] hover:bg-[#39FF14]/10'
                : anyDownloading
                  ? 'cursor-wait text-neutral-600'
                  : 'text-neutral-400 hover:bg-white/5 hover:text-white',
            )
          : cn(
              'gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium',
              allCached
                ? 'text-[#39FF14] bg-[#39FF14]/10 hover:bg-[#39FF14]/20'
                : anyDownloading
                  ? 'bg-neutral-800 text-neutral-500 cursor-wait'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700',
            ),
      )}
    >
      {anyDownloading ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" /> : allCached ? <CheckCircle className="h-3.5 w-3.5 shrink-0" /> : <Download className="h-3.5 w-3.5 shrink-0" />}
      {!isApp && (allCached ? 'Available Offline' : anyDownloading ? 'Downloading...' : 'Download for Offline')}
      {isApp && hideSetHeader && (allCached ? 'Saved' : anyDownloading ? 'Saving' : 'Save offline')}
    </button>
  )

  return (
    <div
      className={cn(
        'overflow-hidden',
        isApp
          ? embedded
            ? 'border-0 bg-transparent p-0 ring-0 shadow-none backdrop-blur-0'
            : 'rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-black/20 p-3 ring-1 ring-inset ring-white/[0.04] backdrop-blur-md md:p-4'
          : isGlass
            ? 'rounded-2xl border border-[#333]/50 bg-[#1F1F1F]/50 p-4 backdrop-blur-lg ring-1 ring-inset ring-white/[0.05] md:p-5'
            : 'rounded-2xl border-2 border-[#333] bg-[#1F1F1F] p-4 md:p-6',
        className,
      )}
    >
      <audio ref={audioRef} autoPlay={autoPlay} />

      {isApp && hideSetHeader && tracks.length > 0 && (
        <div className="mb-3 flex justify-end border-b border-white/[0.06] pb-2">{downloadAllButton}</div>
      )}

      {(setIcon || setName) && isApp && !hideSetHeader && (
        <div className="mb-3 flex gap-3 border-b border-white/[0.06] pb-3">
          {setIcon && <div className="mt-0.5 shrink-0 scale-90">{setIcon}</div>}
          <div className="min-w-0 flex flex-1 flex-col gap-0.5">
            {headerTitleBlock}
            {headerMeta}
            {(voiceName || backgroundTrack || mixRatio) && (
              <p className="text-[11px] leading-snug text-neutral-600">
                {[voiceName, backgroundTrack, mixRatio].filter(Boolean).join(' | ')}
              </p>
            )}
          </div>
          <div className="shrink-0 self-start pt-0.5">{downloadAllButton}</div>
        </div>
      )}

      {(setIcon || setName) && !isApp && (
        <div
          className={cn(
            'mb-4',
            isGlass
              ? 'border-b border-white/[0.08] pb-4'
              : '-mx-4 -mt-4 mb-4 rounded-t-2xl border-b border-[#333] bg-gradient-to-b from-[#2A2A2A] to-[#1F1F1F] px-4 pb-4 pt-4 md:-mx-6 md:-mt-6 md:px-6 md:pb-4 md:pt-6',
          )}
        >
          {setIcon && (
            <div className="mb-3 flex justify-center">
              {setIcon}
            </div>
          )}

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
                  className="w-full max-w-md rounded-lg bg-[#2A2A2A] px-3 py-1 text-center text-base font-semibold text-white focus:outline-none focus:ring-2 focus:ring-primary-500 md:text-lg"
                />
              ) : (
                <h3
                  className={cn(
                    'group/title text-center font-semibold text-white',
                    isGlass ? 'text-base' : 'text-lg',
                    onRename && 'cursor-pointer',
                  )}
                  onClick={onRename ? handleStartEdit : undefined}
                  role={onRename ? 'button' : undefined}
                  tabIndex={onRename ? 0 : undefined}
                >
                  {setName}
                  {onRename && (
                    <Edit2
                      className="inline-block w-3 h-3 ml-1 -translate-y-1 text-neutral-400 transition-opacity hover:text-white cursor-pointer opacity-100 md:opacity-0 md:group-hover/title:opacity-100"
                      onClick={handleStartEdit}
                    />
                  )}
                </h3>
              )}
            </div>
          )}

          {(trackCount || createdDate || totalDuration > 0) && (
            <div className="flex items-center justify-center gap-2 text-xs text-neutral-400">
              {trackCount && <span>{trackCount} {trackCount === 1 ? 'track' : 'tracks'}</span>}
              {trackCount && (createdDate || totalDuration > 0) && <span>•</span>}
              {createdDate && <span>{createdDate}</span>}
              {createdDate && totalDuration > 0 && <span>•</span>}
              {totalDuration > 0 && <span>{formatTime(totalDuration)}</span>}
            </div>
          )}

          <div className="mt-3 flex justify-center">{downloadAllButton}</div>
        </div>
      )}

      {currentTrack && !hideCurrentTrack && (
        <div
          className={cn(
            'mb-3',
            isApp && 'text-left',
            !isApp && 'text-center',
            isApp ? 'mt-0' : isGlass ? 'mt-3' : 'mt-6',
            isApp && 'mb-2',
          )}
        >
          <h4 className={cn('font-semibold text-white', isApp ? 'text-sm' : isCompact ? 'text-base' : 'text-lg')}>
            {currentTrack.title}
          </h4>
          {currentTrack.artist && (
            <p className={cn('text-neutral-400', isApp ? 'text-[11px]' : isCompact ? 'text-xs' : 'text-sm')}>
              {currentTrack.artist}
            </p>
          )}
        </div>
      )}

      {/* Shuffle and Repeat - Below title */}
      <div className={cn('mb-3 flex items-center justify-center gap-2', isApp && 'mb-2')}>
        <button
          type="button"
          onClick={toggleShuffle}
          className={cn(
            'rounded-lg p-2 transition-colors',
            isShuffled ? 'bg-[#39FF14]/20 text-[#39FF14]' : isCompact ? 'text-neutral-500 hover:bg-neutral-800/50 hover:text-white' : 'text-neutral-400 hover:text-white',
          )}
        >
          <Shuffle className={cn(isApp ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
        </button>
        <button
          type="button"
          onClick={toggleRepeat}
          className={cn(
            'relative rounded-lg p-2 transition-colors',
            repeatMode !== 'off' ? 'bg-[#39FF14]/20 text-[#39FF14]' : isCompact ? 'text-neutral-500 hover:bg-neutral-800/50 hover:text-white' : 'text-neutral-400 hover:text-white',
          )}
        >
          <Repeat className={cn(isApp ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
          {repeatMode === 'one' && <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold leading-none">1</span>}
        </button>
      </div>

      <div className={cn(isApp ? 'space-y-2' : 'space-y-3')}>
        <div>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className={cn(
              'h-1.5 w-full cursor-pointer appearance-none rounded-full',
              isCompact ? 'bg-neutral-800/80 accent-primary-500' : 'h-2 rounded-lg bg-neutral-700',
            )}
          />
          <div className={cn('mt-1 flex justify-between text-xs text-neutral-400', isApp && 'text-[10px] tabular-nums text-neutral-500')}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback controls */}
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={handlePrevious}
            className={cn(
              'p-2 transition-colors',
              isCompact ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-white',
            )}
          >
            <SkipBack className={isCompact ? 'h-4 w-4' : 'h-5 w-5'} />
          </button>
          <button
            type="button"
            onClick={togglePlayPause}
            className={cn(
              'flex items-center justify-center rounded-full bg-[#39FF14] transition-colors hover:bg-[#00CC44]',
              isApp ? 'h-11 w-11' : isCompact ? 'h-10 w-10' : 'h-12 w-12',
            )}
          >
            {isPlaying ? (
              <Pause
                className={cn('text-black', isApp || isCompact ? 'h-5 w-5' : 'h-6 w-6')}
                fill="black"
              />
            ) : (
              <Play className={cn('text-black', isApp || isCompact ? 'h-5 w-5' : 'h-6 w-6')} fill="black" />
            )}
          </button>
          <button
            type="button"
            onClick={handleNext}
            className={cn(
              'p-2 transition-colors',
              isCompact ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-white',
            )}
          >
            <SkipForward className={isCompact ? 'h-4 w-4' : 'h-5 w-5'} />
          </button>
        </div>

        <div
          className={cn(
            'mt-4 max-h-48 space-y-0.5 overflow-y-auto',
            isApp && 'max-h-40 text-sm',
            isCompact && 'rounded-xl border border-white/[0.06] bg-black/20 p-1.5',
          )}
        >
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
                    'min-w-0 flex-1 rounded-lg px-3 text-left transition-colors',
                    isApp ? 'py-1.5' : 'py-2',
                    index === currentTrackIndex
                      ? isCompact
                        ? 'border border-primary-500/30 bg-primary-500/10 text-primary-500'
                        : 'bg-[#39FF14]/20 text-[#39FF14]'
                      : isCompact
                        ? 'border border-transparent text-neutral-300 hover:border-white/[0.08] hover:bg-neutral-800/50'
                        : 'text-neutral-300 hover:bg-[#333]',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{track.title}</span>
                    <span className="ml-2 flex-shrink-0 text-xs text-neutral-500 tabular-nums">{formatTime(trackDurations.get(track.id) || track.duration || 0)}</span>
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
