'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat,
  Edit2, Download, CheckCircle, Loader2, Mic, Music, Waves, Save, Plus, Trash2,
} from 'lucide-react'
import { cn } from '../../shared-utils'
import { useAudioOffline } from '@/hooks/useAudioOffline'
import { useGlobalAudioStore } from '@/lib/stores/global-audio-store'
import { colors } from '../../../tokens'
import { TrackArtwork } from './TrackArtwork'
import type { AudioTrack } from '../types'

function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="relative group/tip">
      {children}
      <span className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-1.5 whitespace-nowrap rounded bg-neutral-900 border border-neutral-700 px-2 py-1 text-[10px] text-neutral-200 opacity-0 group-hover/tip:opacity-100 transition-opacity z-50">
        {label}
      </span>
    </span>
  )
}

const VOICE_NAMES: Record<string, string> = {
  alloy: 'Alloy', shimmer: 'Shimmer', ash: 'Ash', coral: 'Coral',
  echo: 'Echo', fable: 'Fable', onyx: 'Onyx', nova: 'Nova', sage: 'Sage',
}

function triggerFileSave(blob: Blob, title: string) {
  const filename = title.replace(/[^a-zA-Z0-9\s\-_.]/g, '').trim().replace(/\s+/g, '-') + '.mp3'
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export interface MixDetails {
  voiceName?: string
  voiceVolume?: number
  backgroundName?: string
  bgVolume?: number
  binauralName?: string
  binauralVolume?: number
}

interface EmbeddedPlayerProps {
  tracks: AudioTrack[]
  className?: string
  setIcon?: React.ReactNode
  setName?: string
  setIconKey?: string
  contentCategory?: 'life_vision' | 'story' | 'music'
  trackCount?: number
  createdDate?: string
  onRename?: (newName: string) => void
  onDelete?: () => void
  voiceId?: string
  mixDetails?: MixDetails | null
  headerContent?: React.ReactNode
  /** Rendered below the now-playing track title (e.g. View Story link) */
  nowPlayingAccessory?: React.ReactNode
  onAddToPlaylist?: (track: AudioTrack, index: number) => void
  onRemoveTrack?: (track: AudioTrack, index: number) => void
  /** MAP activity to verify on listen; inferred from setIconKey when omitted */
  mapActivityType?: 'vision_audio' | 'story_audio' | 'music_listen' | 'song_listen'
}

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function EmbeddedPlayer({
  tracks,
  className = '',
  setIcon,
  setName,
  setIconKey,
  contentCategory,
  trackCount,
  createdDate,
  onRename,
  onDelete,
  voiceId,
  mixDetails,
  headerContent,
  nowPlayingAccessory,
  onAddToPlaylist,
  onRemoveTrack,
  mapActivityType: mapActivityTypeProp,
}: EmbeddedPlayerProps) {
  const storeTracks = useGlobalAudioStore(s => s.tracks)
  const storeIndex = useGlobalAudioStore(s => s.currentIndex)
  const storeIsPlaying = useGlobalAudioStore(s => s.isPlaying)
  const storeCurrentTime = useGlobalAudioStore(s => s.currentTime)
  const storeDuration = useGlobalAudioStore(s => s.duration)
  const repeatMode = useGlobalAudioStore(s => s.repeatMode)
  const isShuffled = useGlobalAudioStore(s => s.isShuffled)
  const playAction = useGlobalAudioStore(s => s.play)
  const playTrackAction = useGlobalAudioStore(s => s.playTrack)
  const togglePlayPause = useGlobalAudioStore(s => s.togglePlayPause)
  const pauseAction = useGlobalAudioStore(s => s.pause)
  const resumeAction = useGlobalAudioStore(s => s.resume)
  const seekTo = useGlobalAudioStore(s => s.seekTo)
  const skipNext = useGlobalAudioStore(s => s.skipNext)
  const skipPrev = useGlobalAudioStore(s => s.skipPrev)
  const setRepeatMode = useGlobalAudioStore(s => s.setRepeatMode)
  const toggleShuffle = useGlobalAudioStore(s => s.toggleShuffle)

  const [probedDurations, setProbedDurations] = useState<Map<string, number>>(new Map())
  const [isEditingName, setIsEditingName] = useState(false)
  const [editingName, setEditingName] = useState('')
  const lastRepeatClickRef = useRef<number>(0)
  const probeAbortRef = useRef<(() => void) | null>(null)

  const { cachedTrackIds, downloadingTrackIds, downloadTrack, downloadAllTracks, removeTrack } = useAudioOffline(tracks)
  const allCached = tracks.length > 0 && tracks.every(t => cachedTrackIds.has(t.id))
  const anyDownloading = downloadingTrackIds.size > 0
  const [savingTrackIds, setSavingTrackIds] = useState<Set<string>>(new Set())
  const hasTrackedListenRef = useRef(false)
  const mapActivityType =
    mapActivityTypeProp ??
    (setIconKey === 'stories'
      ? 'story_audio'
      : setIconKey === 'music'
        ? 'music_listen'
        : 'vision_audio')

  const saveTrackToDevice = useCallback(async (track: AudioTrack) => {
    setSavingTrackIds(prev => new Set(prev).add(track.id))
    try {
      const response = await fetch(`/api/audio/download?trackId=${encodeURIComponent(track.id)}`)
      if (!response.ok && track.url) {
        const fallback = await fetch(track.url)
        if (!fallback.ok) throw new Error('Download failed')
        const blob = await fallback.blob()
        triggerFileSave(blob, track.title)
        return
      }
      if (!response.ok) throw new Error('Download failed')
      const blob = await response.blob()
      triggerFileSave(blob, track.title)
    } catch (err) {
      console.error('Save to device failed:', err)
    } finally {
      setSavingTrackIds(prev => { const n = new Set(prev); n.delete(track.id); return n })
    }
  }, [])

  const saveAllToDevice = useCallback(async () => {
    for (const track of tracks) {
      await saveTrackToDevice(track)
    }
  }, [tracks, saveTrackToDevice])

  const isThisSetActive = storeTracks.length === tracks.length &&
    tracks.length > 0 &&
    storeTracks[0]?.id === tracks[0]?.id
  const activeIndex = isThisSetActive ? storeIndex : -1
  const activeTrack = isThisSetActive ? storeTracks[storeIndex] : null
  const isActivePlaying = isThisSetActive && storeIsPlaying
  const isBuffering = useGlobalAudioStore(s => s.isBuffering)
  const isActiveBuffering = isThisSetActive && isBuffering
  const currentTime = isThisSetActive ? storeCurrentTime : 0
  const duration = isThisSetActive ? storeDuration : 0
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  useEffect(() => {
    hasTrackedListenRef.current = false
  }, [activeTrack?.id, mapActivityType])

  useEffect(() => {
    if (!isThisSetActive || !activeTrack || hasTrackedListenRef.current) return
    if (currentTime < 5) return
    hasTrackedListenRef.current = true
    void import('@/lib/map/track-map-listen').then(({ trackMapAudioListen }) =>
      trackMapAudioListen(activeTrack.id, mapActivityType),
    )
  }, [isThisSetActive, activeTrack, currentTime, mapActivityType])

  useEffect(() => {
    if (!isThisSetActive || !activeTrack) return
    if (storeDuration > 0 && isFinite(storeDuration)) {
      setProbedDurations(prev => {
        if (prev.get(activeTrack.id) === storeDuration) return prev
        const m = new Map(prev)
        m.set(activeTrack.id, storeDuration)
        return m
      })
    }
  }, [isThisSetActive, activeTrack?.id, storeDuration])

  useEffect(() => {
    probeAbortRef.current?.()

    const needed = tracks.filter(
      t => t.url && !probedDurations.has(t.id) && !(t.duration && t.duration > 0)
    )
    if (needed.length === 0) return

    let cancelled = false
    const queue = [...needed]
    let activeProbes = 0
    const CONCURRENCY = 2
    const INITIAL_DELAY_MS = 800

    function probeNext() {
      if (cancelled) return
      const track = queue.shift()
      if (!track) return
      activeProbes++
      const el = new Audio()
      el.preload = 'metadata'
      const done = (dur?: number) => {
        el.src = ''
        el.load()
        activeProbes--
        if (!cancelled && dur && isFinite(dur) && dur > 0) {
          setProbedDurations(prev => {
            const m = new Map(prev)
            m.set(track.id, dur)
            return m
          })
        }
        probeNext()
      }
      el.addEventListener('loadedmetadata', () => done(el.duration), { once: true })
      el.addEventListener('error', () => done(), { once: true })
      el.src = track.url
    }

    const timerId = setTimeout(() => {
      if (cancelled) return
      for (let i = 0; i < Math.min(CONCURRENCY, queue.length); i++) probeNext()
    }, INITIAL_DELAY_MS)

    const abort = () => {
      cancelled = true
      clearTimeout(timerId)
    }
    probeAbortRef.current = abort
    return abort
  }, [tracks])

  const getTrackDuration = (track: AudioTrack) =>
    (track.duration && track.duration > 0 ? track.duration : 0) || probedDurations.get(track.id) || 0

  const totalDuration = tracks.reduce((sum, track) => sum + getTrackDuration(track), 0)

  const handlePlayAll = () => {
    if (isThisSetActive) {
      togglePlayPause()
    } else {
      playAction(tracks, 0, setName, setIconKey, contentCategory)
    }
  }

  const handleTrackClick = (index: number) => {
    if (isThisSetActive) {
      if (index === activeIndex) {
        togglePlayPause()
      } else {
        playTrackAction(index)
      }
    } else {
      playAction(tracks, index, setName, setIconKey, contentCategory)
    }
  }

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

  const resolvedVoiceName = mixDetails?.voiceName || (voiceId ? VOICE_NAMES[voiceId] || voiceId : null)
  const hasAnyMixDetail = !!(resolvedVoiceName || mixDetails?.backgroundName || mixDetails?.binauralName)

  /** Same as `bg-embedded-panel` / `colors.neutral.embeddedPanel` — one surface for the whole card. */
  const panelBg = 'bg-embedded-panel'

  return (
    <div className={cn(`${panelBg} border border-neutral-800 rounded-2xl overflow-hidden`, className)}>
      {/* ── Header (custom slot or default set header) ── */}
      {headerContent ? (
        <div className="border-b border-neutral-800/60">
          {headerContent}
        </div>
      ) : (setIcon || setName) ? (
        <div className="relative bg-black/40 px-5 pt-5 pb-4 border-b border-neutral-800/60">
          {(onRename || onDelete) && (
            <div className="absolute top-3 right-3 flex items-center gap-0.5">
              {onRename && (
                <button
                  onClick={handleStartEdit}
                  className="p-2 text-neutral-500 hover:text-white transition-colors rounded-lg"
                  aria-label="Rename"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="p-2 text-neutral-500 hover:text-[#FF0040] transition-colors rounded-lg"
                  aria-label="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
          {setIcon && (
            <div className="flex justify-center mb-3">{setIcon}</div>
          )}
          {setName && (
            <div className="flex justify-center items-center mb-1.5 w-full">
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
                  className="bg-neutral-800 text-white px-3 py-1 rounded-lg text-base md:text-lg font-semibold text-center focus:outline-none focus:ring-2 focus:ring-primary-500 max-w-md w-full"
                />
              ) : (
                <h3 className="text-white font-semibold text-lg text-center">
                  {setName}
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
        </div>
      ) : null}

      {/* ── Mix details pills ── */}
      {hasAnyMixDetail && (
        <div className={cn(panelBg, 'px-5 py-3 border-b border-neutral-800/40 flex flex-wrap items-center justify-center gap-2')}>
          {resolvedVoiceName && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-neutral-800 text-neutral-300">
              <Mic className="w-3 h-3 text-primary-500" />
              {resolvedVoiceName}
              {mixDetails?.voiceVolume != null && (
                <span className="text-neutral-500">({mixDetails.voiceVolume}%)</span>
              )}
            </span>
          )}
          {mixDetails?.backgroundName && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-neutral-800 text-neutral-300">
              <Music className="w-3 h-3 text-secondary-500" />
              {mixDetails.backgroundName}
              {mixDetails.bgVolume != null && (
                <span className="text-neutral-500">({mixDetails.bgVolume}%)</span>
              )}
            </span>
          )}
          {mixDetails?.binauralName && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-neutral-800 text-neutral-300">
              <Waves className="w-3 h-3 text-accent-500" />
              {mixDetails.binauralName}
              {mixDetails.binauralVolume != null && (
                <span className="text-neutral-500">({mixDetails.binauralVolume}%)</span>
              )}
            </span>
          )}
        </div>
      )}

      {/* ── Now Playing section (explicit panel so it never diverges from header / list) ── */}
      <div className={cn(panelBg, 'flex flex-col items-center px-6 pt-6 pb-4')}>
        <TrackArtwork
          track={activeTrack || tracks[0]}
          iconKey={setIconKey}
          size={200}
          className="rounded-2xl overflow-hidden shadow-2xl mb-6 flex-shrink-0"
        />

        <div className="text-center mb-5 w-full">
          <h3 className="text-xl font-semibold text-white truncate">
            {activeTrack?.title || tracks[0]?.title || 'Select a track'}
          </h3>
          {nowPlayingAccessory ? (
            <div className="mt-2 flex justify-center">{nowPlayingAccessory}</div>
          ) : null}
          {contentCategory !== 'story' && (
            <p className="text-sm text-neutral-400 mt-1 truncate">
              {setName || activeTrack?.artist || 'Vibration Fit'}
            </p>
          )}
        </div>

        {/* Seek bar */}
        <div className="w-full mb-4">
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-neutral-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg"
            style={{
              background: `linear-gradient(to right, ${colors.primary[500]} ${progress}%, ${colors.neutral.inputBg} ${progress}%)`,
            }}
          />
          <div className="flex justify-between text-xs text-neutral-500 mt-1.5">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Transport controls */}
        <div className="flex items-center justify-center gap-6 mb-3">
          <button
            onClick={() => { if (isThisSetActive) skipPrev() }}
            className="p-3 text-neutral-400 hover:text-white transition-colors"
            aria-label="Previous"
          >
            <SkipBack className="w-6 h-6" />
          </button>

          <button
            onClick={() => {
              if (isThisSetActive) {
                isActivePlaying ? pauseAction() : resumeAction()
              } else {
                handlePlayAll()
              }
            }}
            className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:bg-neutral-200 transition-colors shadow-lg"
            aria-label={isActiveBuffering ? 'Loading' : isActivePlaying ? 'Pause' : 'Play'}
          >
            {isActiveBuffering ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : isActivePlaying ? (
              <Pause className="w-7 h-7" fill="currentColor" />
            ) : (
              <Play className="w-7 h-7 ml-1" fill="currentColor" />
            )}
          </button>

          <button
            onClick={() => { if (isThisSetActive) skipNext() }}
            className="p-3 text-neutral-400 hover:text-white transition-colors"
            aria-label="Next"
          >
            <SkipForward className="w-6 h-6" />
          </button>
        </div>

        {/* Shuffle + Repeat */}
        <div className="flex items-center justify-center gap-4 mb-2">
          <button
            onClick={() => { if (isThisSetActive) toggleShuffle() }}
            className={cn('p-2 rounded-lg transition-colors', isShuffled && isThisSetActive ? 'text-primary-500 bg-primary-500/20' : 'text-neutral-400 hover:text-white')}
          >
            <Shuffle className="w-4 h-4" />
          </button>
          <button
            onClick={handleToggleRepeat}
            className={cn('relative p-2 rounded-lg transition-colors', repeatMode !== 'off' && isThisSetActive ? 'text-primary-500 bg-primary-500/20' : 'text-neutral-400 hover:text-white')}
          >
            <Repeat className="w-4 h-4" />
            {repeatMode === 'one' && isThisSetActive && <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold leading-none text-primary-500">1</span>}
          </button>
        </div>
      </div>

      {/* ── Track list ── */}
      <div className={cn(panelBg, 'border-t border-neutral-800/60 px-3 py-3')}>
        <div className="flex justify-center gap-2 mb-2 flex-wrap">
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
            {allCached ? 'Available Offline' : anyDownloading ? 'Caching...' : 'Play Offline'}
          </button>
          <button
            onClick={() => saveAllToDevice()}
            disabled={savingTrackIds.size > 0}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              savingTrackIds.size > 0
                ? 'text-neutral-500 bg-neutral-800 cursor-wait'
                : 'text-neutral-300 bg-neutral-800 hover:bg-neutral-700'
            )}
          >
            {savingTrackIds.size > 0 ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {savingTrackIds.size > 0 ? 'Downloading...' : 'Download MP3s'}
          </button>
        </div>
        <div className="space-y-0.5 max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
          {tracks.map((track, index) => {
            const isActive = index === activeIndex
            const trackCached = cachedTrackIds.has(track.id)
            const trackDownloading = downloadingTrackIds.has(track.id)
            return (
              <div key={track.id} className="flex items-center gap-1">
                <button
                  onClick={() => handleTrackClick(index)}
                  className={cn(
                    'flex-1 text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3 min-w-0',
                    isActive ? 'bg-primary-500/15 text-primary-500' : 'text-neutral-300 hover:bg-white/5'
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
                  <span className="text-xs text-neutral-500 flex-shrink-0">
                    {formatTime(getTrackDuration(track))}
                  </span>
                  {isActive && isActiveBuffering && (
                    <Loader2 className="w-4 h-4 text-primary-500 animate-spin flex-shrink-0" />
                  )}
                  {isActive && isActivePlaying && !isActiveBuffering && (
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <span className="w-0.5 h-3 bg-primary-500 rounded-full animate-pulse" />
                      <span className="w-0.5 h-4 bg-primary-500 rounded-full animate-pulse [animation-delay:150ms]" />
                      <span className="w-0.5 h-2.5 bg-primary-500 rounded-full animate-pulse [animation-delay:300ms]" />
                    </div>
                  )}
                </button>
                {onAddToPlaylist && (
                  <Tip label="Add to playlist">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onAddToPlaylist(track, index)
                      }}
                      className="p-1.5 rounded-lg transition-colors flex-shrink-0 text-neutral-500 hover:text-primary-500"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </Tip>
                )}
                <Tip label={trackCached ? 'Remove offline copy' : trackDownloading ? 'Caching...' : 'Play offline'}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      trackCached ? removeTrack(track.id) : downloadTrack(track)
                    }}
                    disabled={trackDownloading}
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
                </Tip>
                <Tip label="Download MP3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      saveTrackToDevice(track)
                    }}
                    disabled={savingTrackIds.has(track.id)}
                    className={cn(
                      'p-1.5 rounded-lg transition-colors flex-shrink-0 text-neutral-500 hover:text-neutral-300',
                      savingTrackIds.has(track.id) && 'cursor-wait'
                    )}
                  >
                    {savingTrackIds.has(track.id) ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                  </button>
                </Tip>
                {onRemoveTrack && (
                  <Tip label="Remove">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveTrack(track, index)
                      }}
                      className="p-1.5 rounded-lg transition-colors flex-shrink-0 text-neutral-600 hover:text-[#FF0040]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </Tip>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
