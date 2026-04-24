'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Shuffle, Repeat, Edit2, Download, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '../../shared-utils'
import { useAudioOffline } from '@/hooks/useAudioOffline'
import { useGlobalAudioStore } from '@/lib/stores/global-audio-store'
import type { AudioTrack } from '../types'

interface InlineTrackListProps {
  tracks: AudioTrack[]
  className?: string
  setIcon?: React.ReactNode
  setName?: string
  setIconKey?: string
  trackCount?: number
  createdDate?: string
  onRename?: (newName: string) => void
  hideCurrentTrack?: boolean
}

function formatTime(time: number) {
  if (isNaN(time) || !isFinite(time)) return '0:00'
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function InlineTrackList({
  tracks,
  className = '',
  setIcon,
  setName,
  setIconKey,
  trackCount,
  createdDate,
  onRename,
  hideCurrentTrack = false,
}: InlineTrackListProps) {
  const storeTracks = useGlobalAudioStore(s => s.tracks)
  const storeIndex = useGlobalAudioStore(s => s.currentIndex)
  const storeIsPlaying = useGlobalAudioStore(s => s.isPlaying)
  const repeatMode = useGlobalAudioStore(s => s.repeatMode)
  const isShuffled = useGlobalAudioStore(s => s.isShuffled)
  const playAction = useGlobalAudioStore(s => s.play)
  const playTrackAction = useGlobalAudioStore(s => s.playTrack)
  const togglePlayPause = useGlobalAudioStore(s => s.togglePlayPause)
  const setRepeatMode = useGlobalAudioStore(s => s.setRepeatMode)
  const toggleShuffle = useGlobalAudioStore(s => s.toggleShuffle)

  const [trackDurations, setTrackDurations] = useState<Map<string, number>>(new Map())
  const [isEditingName, setIsEditingName] = useState(false)
  const [editingName, setEditingName] = useState('')
  const lastRepeatClickRef = useRef<number>(0)

  const { cachedTrackIds, downloadingTrackIds, downloadTrack, downloadAllTracks, removeTrack } = useAudioOffline(tracks)
  const allCached = tracks.length > 0 && tracks.every(t => cachedTrackIds.has(t.id))
  const anyDownloading = downloadingTrackIds.size > 0

  const isThisSetActive = storeTracks.length === tracks.length &&
    tracks.length > 0 &&
    storeTracks[0]?.id === tracks[0]?.id
  const activeIndex = isThisSetActive ? storeIndex : -1
  const activeTrack = isThisSetActive ? storeTracks[storeIndex] : null
  const isActivePlaying = isThisSetActive && storeIsPlaying

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

  const totalDuration = tracks.reduce((sum, track) => {
    const dur = trackDurations.get(track.id) || track.duration || 0
    return sum + dur
  }, 0)

  const handleTrackClick = (index: number) => {
    if (isThisSetActive) {
      if (index === activeIndex) {
        togglePlayPause()
      } else {
        playTrackAction(index)
      }
    } else {
      playAction(tracks, index, setName, setIconKey)
    }
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
    <div className={cn('bg-neutral-800 border-2 border-neutral-700 rounded-2xl p-4 md:p-6 overflow-hidden', className)}>
      {(setIcon || setName) && (
        <div className="-mx-4 md:-mx-6 -mt-4 md:-mt-6 mb-4 pb-4 px-4 md:px-6 pt-4 md:pt-6 bg-gradient-to-b from-neutral-700/80 to-neutral-800 rounded-t-2xl border-b border-neutral-700">
          {setIcon && (
            <div className="flex justify-center mb-3">
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
                  className="bg-neutral-700 text-white px-3 py-1 rounded-lg text-base md:text-lg font-semibold text-center focus:outline-none focus:ring-2 focus:ring-primary-500 max-w-md w-full"
                />
              ) : (
                <h3
                  className={`group/title text-white font-semibold text-lg text-center${onRename ? ' cursor-pointer' : ''}`}
                  onClick={onRename ? handleStartEdit : undefined}
                  role={onRename ? 'button' : undefined}
                  tabIndex={onRename ? 0 : undefined}
                >
                  {setName}
                  {onRename && (
                    <Edit2
                      className="inline-block w-3 h-3 ml-1 -translate-y-1 text-neutral-400 hover:text-white cursor-pointer opacity-100 md:opacity-0 md:group-hover/title:opacity-100 transition-opacity"
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
              {trackCount && (createdDate || totalDuration > 0) && <span>&middot;</span>}
              {createdDate && <span>{createdDate}</span>}
              {createdDate && totalDuration > 0 && <span>&middot;</span>}
              {totalDuration > 0 && <span>{formatTime(totalDuration)}</span>}
            </div>
          )}

          <div className="flex justify-center mt-3">
            <button
              onClick={() => allCached ? tracks.forEach(t => removeTrack(t.id)) : downloadAllTracks(tracks)}
              disabled={anyDownloading}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                allCached
                  ? 'text-primary-500 bg-primary-500/10 hover:bg-primary-500/20'
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

      {activeTrack && !hideCurrentTrack && (
        <div className="mt-6 mb-3 text-center">
          <h4 className="text-white font-semibold text-lg">{activeTrack.title}</h4>
          {activeTrack.artist && <p className="text-neutral-400 text-sm">{activeTrack.artist}</p>}
        </div>
      )}

      <div className="flex items-center justify-center gap-2 mb-3 mt-4">
        <button
          onClick={() => { if (isThisSetActive) toggleShuffle(); }}
          className={cn('p-2 rounded-lg transition-colors', isShuffled && isThisSetActive ? 'text-primary-500 bg-primary-500/20' : 'text-neutral-400 hover:text-white')}
        >
          <Shuffle className="w-4 h-4" />
        </button>
        <button
          onClick={handleToggleRepeat}
          className={cn('relative p-2 rounded-lg transition-colors', repeatMode !== 'off' && isThisSetActive ? 'text-primary-500 bg-primary-500/20' : 'text-neutral-400 hover:text-white')}
        >
          <Repeat className="w-4 h-4" />
          {repeatMode === 'one' && isThisSetActive && <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold leading-none">1</span>}
        </button>
      </div>

      <div className="space-y-1 mt-2 max-h-[45vh] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
        {tracks.map((track, index) => {
          const isActive = index === activeIndex
          const trackCached = cachedTrackIds.has(track.id)
          const trackDownloading = downloadingTrackIds.has(track.id)
          return (
            <div key={track.id} className="flex items-center gap-1">
              <button
                onClick={() => handleTrackClick(index)}
                className={cn(
                  'flex-1 text-left px-3 py-2.5 rounded-lg transition-colors min-w-0',
                  isActive ? 'bg-primary-500/20 text-primary-500' : 'text-neutral-300 hover:bg-neutral-800'
                )}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="truncate">{track.title}</span>
                  </div>
                  <span className="text-xs text-neutral-500 ml-2 flex-shrink-0">
                    {formatTime(trackDurations.get(track.id) || track.duration || 0)}
                  </span>
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
                  trackCached ? 'text-primary-500/70 hover:text-primary-500' : 'text-neutral-500 hover:text-neutral-300',
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
  )
}
