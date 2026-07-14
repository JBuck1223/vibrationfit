'use client'

/**
 * Standalone player for publicly shared songs (/music/[token]).
 *
 * Visitors are not authenticated, so this uses a plain <audio> element
 * instead of the global audio store (which powers the member-only player).
 * Supports synced lyrics from Mureka lyrics_sections when available.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Play, Pause, Download, Loader2, Music, AlignLeft } from 'lucide-react'
import { colors } from '@/lib/design-system/tokens'
import {
  convertMurekaLyrics,
  stripLyricsTitleHeader,
  type MurekaLyricsSection,
  type SyncedLyrics,
  type TimedLine,
} from '@/lib/utils/lyrics-alignment'

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function findActiveLine(lines: TimedLine[], time: number): number {
  if (lines.length === 0 || time < lines[0]!.startTime) return -1
  let lo = 0
  let hi = lines.length - 1
  let result = -1
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1
    if (lines[mid]!.startTime <= time) {
      result = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return result
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

interface PublicSongPlayerProps {
  title: string
  artistName: string
  /** Optional link target for the artist name (e.g. /music/artist/[handle]) */
  artistHref?: string | null
  mp3Url: string
  coverUrl: string | null
  lyrics: string | null
  lyricsSections: MurekaLyricsSection[] | null
  /** Pre-converted synced lyrics (used by catalog tracks); takes precedence */
  preSyncedLyrics?: SyncedLyrics | null
  genres?: string[]
  moods?: string[]
}

export function PublicSongPlayer({
  title,
  artistName,
  artistHref = null,
  mp3Url,
  coverUrl,
  lyrics,
  lyricsSections,
  preSyncedLyrics = null,
  genres = [],
  moods = [],
}: PublicSongPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [downloading, setDownloading] = useState(false)

  const syncedLyrics = useMemo(() => {
    if (preSyncedLyrics && preSyncedLyrics.lines?.length > 0) return preSyncedLyrics
    if (!lyricsSections || lyricsSections.length === 0) return null
    const converted = convertMurekaLyrics(lyricsSections)
    return converted.lines.length > 0 ? converted : null
  }, [preSyncedLyrics, lyricsSections])

  const plainLyrics = useMemo(
    () => (lyrics ? stripLyricsTitleHeader(lyrics) : null),
    [lyrics],
  )

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      void audio.play()
    } else {
      audio.pause()
    }
  }, [])

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = parseFloat(e.target.value)
    setCurrentTime(audio.currentTime)
  }, [])

  const seekToLine = useCallback((line: TimedLine) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = line.startTime
    setCurrentTime(line.startTime)
    if (audio.paused) void audio.play()
  }, [])

  const handleDownload = useCallback(async () => {
    setDownloading(true)
    try {
      const response = await fetch(mp3Url)
      if (!response.ok) throw new Error('Download failed')
      const blob = await response.blob()
      triggerFileSave(blob, title)
    } catch {
      // Fall back to opening the file directly
      window.open(mp3Url, '_blank')
    } finally {
      setDownloading(false)
    }
  }, [mp3Url, title])

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  // ── Synced lyrics auto-scroll ──
  const lyricsContainerRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<Map<number, HTMLButtonElement>>(new Map())
  const lastScrolledLine = useRef(-1)

  const activeLineIdx = useMemo(
    () => (syncedLyrics ? findActiveLine(syncedLyrics.lines, currentTime) : -1),
    [syncedLyrics, currentTime],
  )

  useEffect(() => {
    if (activeLineIdx < 0 || activeLineIdx === lastScrolledLine.current || !lyricsContainerRef.current) return
    lastScrolledLine.current = activeLineIdx
    const el = lineRefs.current.get(activeLineIdx)
    if (!el) return
    const container = lyricsContainerRef.current
    const containerRect = container.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const offset = (elRect.top + elRect.height / 2) - (containerRect.top + containerRect.height / 2)
    container.scrollBy({ top: offset, behavior: 'smooth' })
  }, [activeLineIdx])

  const tags = [...genres, ...moods].filter(Boolean).slice(0, 5)

  return (
    <div className="w-full max-w-xl mx-auto">
      <audio
        ref={audioRef}
        src={mp3Url}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onCanPlay={() => setIsBuffering(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
      />

      {/* ── Player card ── */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="flex flex-col items-center px-6 pt-8 pb-6">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt={`${title} cover art`}
              className="w-[220px] h-[220px] rounded-2xl object-cover shadow-2xl mb-6"
            />
          ) : (
            <div className="w-[220px] h-[220px] rounded-2xl bg-neutral-800 flex items-center justify-center shadow-2xl mb-6">
              <Music className="w-16 h-16 text-neutral-600" />
            </div>
          )}

          <div className="text-center mb-5 w-full">
            <h1 className="text-2xl font-bold text-white truncate">{title}</h1>
            {artistHref ? (
              <a
                href={artistHref}
                className="block text-sm text-neutral-400 mt-1 truncate hover:text-[#39FF14] transition-colors"
              >
                {artistName}
              </a>
            ) : (
              <p className="text-sm text-neutral-400 mt-1 truncate">{artistName}</p>
            )}
            {tags.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-neutral-800 text-neutral-300 capitalize"
                  >
                    {tag}
                  </span>
                ))}
              </div>
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
              aria-label="Seek"
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

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:bg-neutral-200 transition-colors shadow-lg"
              aria-label={isBuffering ? 'Loading' : isPlaying ? 'Pause' : 'Play'}
            >
              {isBuffering ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-7 h-7" fill="currentColor" />
              ) : (
                <Play className="w-7 h-7 ml-1" fill="currentColor" />
              )}
            </button>
          </div>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="mt-5 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-colors text-neutral-300 bg-neutral-800 hover:bg-neutral-700 disabled:cursor-wait disabled:text-neutral-500"
          >
            {downloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            {downloading ? 'Downloading...' : 'Download MP3'}
          </button>
        </div>
      </div>

      {/* ── Lyrics ── */}
      {(syncedLyrics || plainLyrics) && (
        <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 text-sm font-medium text-neutral-300 border-b border-neutral-800/60">
            <AlignLeft className="w-4 h-4 text-neutral-500" />
            Lyrics
          </div>

          {syncedLyrics ? (
            <div
              ref={lyricsContainerRef}
              className="relative max-h-[360px] overflow-y-auto scroll-smooth px-5 pb-6 pt-2"
            >
              <div className="flex flex-col items-center gap-1">
                {syncedLyrics.lines.map((line, idx) => {
                  const isActive = idx === activeLineIdx
                  const isPast = activeLineIdx >= 0 && idx < activeLineIdx
                  return (
                    <button
                      key={idx}
                      ref={(el) => {
                        if (el) lineRefs.current.set(idx, el)
                        else lineRefs.current.delete(idx)
                      }}
                      type="button"
                      onClick={() => seekToLine(line)}
                      className={`w-full rounded-lg px-3 py-1.5 text-center transition-all duration-300 ease-out hover:bg-white/[0.04] ${
                        isActive
                          ? 'text-white text-lg font-semibold scale-[1.02]'
                          : isPast
                            ? 'text-neutral-500 text-base font-normal'
                            : 'text-neutral-400 text-base font-normal'
                      }`}
                    >
                      {line.text}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : plainLyrics ? (
            <div className="max-h-[360px] overflow-y-auto px-5 pb-6 pt-2">
              <div className="flex flex-col items-center gap-1">
                {plainLyrics.split('\n').map((line, idx) => (
                  <p
                    key={idx}
                    className={`w-full rounded-lg px-3 py-1.5 text-center text-base font-normal ${
                      line.trim() ? 'text-neutral-300' : 'h-4'
                    }`}
                  >
                    {line || '\u00A0'}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
