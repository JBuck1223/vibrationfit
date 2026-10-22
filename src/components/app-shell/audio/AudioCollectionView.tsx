'use client'

import React from 'react'
import { ArrowLeft, Check, Download, Loader2, Pause, Play, Shuffle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGlobalAudioStore } from '@/lib/stores/global-audio-store'
import { useAudioOffline } from '@/hooks/useAudioOffline'
import type { AudioTrack } from '@/lib/design-system/components/media/types'
import { formatPlayerTime } from '@/lib/design-system/components/media/global-audio/PlayerControls'
import { TrackArtwork } from '@/lib/design-system/components/media/global-audio/TrackArtwork'
import type { AudioCollection } from './sources'

function Cover({ src, title, className }: { src: string | null; title: string; className?: string }) {
  return (
    <div className={cn('relative overflow-hidden bg-[linear-gradient(145deg,#4a2f6e,#1e1630)]', className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-3xl font-semibold text-white/70">{title.charAt(0)}</span>
      )}
    </div>
  )
}

export { Cover as AudioCover }

function Equalizer() {
  return (
    <span className="inline-flex items-end gap-[2px]" aria-label="Playing">
      <span className="h-3 w-[3px] animate-pulse rounded bg-[#39FF14]" />
      <span className="h-4 w-[3px] animate-pulse rounded bg-[#39FF14] [animation-delay:150ms]" />
      <span className="h-2.5 w-[3px] animate-pulse rounded bg-[#39FF14] [animation-delay:300ms]" />
    </span>
  )
}

/**
 * A set's page: cover and title, Play / Shuffle / download, the mix details
 * as chips, then the tracks as rows. No player controls here; playback runs
 * in the mini player and Now Playing.
 */
export function AudioCollectionView({ collection, onBack }: { collection: AudioCollection; onBack: () => void }) {
  const [tracks, setTracks] = React.useState<AudioTrack[] | null>(null)
  const play = useGlobalAudioStore((s) => s.play)
  const togglePlayPause = useGlobalAudioStore((s) => s.togglePlayPause)
  const toggleShuffle = useGlobalAudioStore((s) => s.toggleShuffle)
  const isShuffled = useGlobalAudioStore((s) => s.isShuffled)
  const setName = useGlobalAudioStore((s) => s.setName)
  const isPlaying = useGlobalAudioStore((s) => s.isPlaying)
  const currentIndex = useGlobalAudioStore((s) => s.currentIndex)
  const openDrawer = useGlobalAudioStore((s) => s.openDrawer)
  const { cachedTrackIds, downloadingTrackIds, downloadAllTracks } = useAudioOffline(tracks ?? [])

  React.useEffect(() => {
    let cancelled = false
    setTracks(null)
    void collection.loadTracks().then((t) => {
      if (!cancelled) setTracks(t)
    })
    return () => {
      cancelled = true
    }
  }, [collection])

  const isThis = setName === collection.key
  const total = (tracks ?? []).reduce((sum, t) => sum + (t.duration || 0), 0)
  const allCached = !!tracks?.length && tracks.every((t) => cachedTrackIds.has(t.id))
  const downloading = downloadingTrackIds.size > 0
  // Albums of songs carry each track's own cover; a Life Vision set repeats
  // one image, so its rows stay numbered.
  const showArt = new Set((tracks ?? []).map((t) => t.thumbnail).filter(Boolean)).size > 1

  const start = (index = 0, shuffle = false) => {
    if (!tracks?.length) return
    if (isThis && !shuffle && index === currentIndex) {
      togglePlayPause()
      return
    }
    play(tracks, index, collection.key, collection.iconKey, collection.category)
    if (shuffle && !isShuffled) toggleShuffle()
    if (!shuffle && isShuffled) toggleShuffle()
  }

  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-center gap-4 md:gap-6">
        <Cover src={collection.artwork} title={collection.title} className="h-28 w-28 shrink-0 rounded-[22px] shadow-[0_16px_40px_rgba(0,0,0,0.45)] md:h-40 md:w-40" />
        <div className="min-w-0">
          <h2 className="text-2xl font-bold leading-tight text-white md:text-3xl">{collection.title}</h2>
          <p className="mt-1 text-sm text-white/65">
            {collection.subtitle}
            {total > 0 && ` · ${formatPlayerTime(total)}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => start(0)}
          disabled={!tracks?.length}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#39FF14] text-[15px] font-semibold text-black transition-transform active:scale-[0.98] disabled:opacity-50 md:flex-none md:px-10"
        >
          {isThis && isPlaying ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="h-5 w-5" fill="currentColor" />}
          {isThis && isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          onClick={() => start(Math.floor(Math.random() * Math.max(1, tracks?.length ?? 1)), true)}
          disabled={!tracks?.length || tracks.length < 2}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-white/25 text-[15px] font-semibold text-white transition-colors hover:border-white/50 disabled:opacity-40 md:flex-none md:px-8"
        >
          <Shuffle className="h-5 w-5" /> Shuffle
        </button>
        <button
          type="button"
          onClick={() => tracks && !allCached && void downloadAllTracks(tracks)}
          disabled={!tracks?.length || allCached || downloading}
          aria-label={allCached ? 'Downloaded for offline' : 'Download for offline'}
          title={allCached ? 'Downloaded for offline' : 'Download for offline'}
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition-colors',
            allCached ? 'border-[#39FF14]/60 text-[#39FF14]' : 'border-white/20 text-white/75 hover:text-white',
          )}
        >
          {downloading ? <Loader2 className="h-5 w-5 animate-spin" /> : allCached ? <Check className="h-5 w-5" /> : <Download className="h-5 w-5" />}
        </button>
      </div>

      {collection.chips && collection.chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {collection.chips.map((c) => (
            <span key={c} className="rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-xs text-white/75">
              {c}
            </span>
          ))}
        </div>
      )}

      <div className="vf-glass overflow-hidden rounded-[22px] border border-white/[0.12] bg-[linear-gradient(180deg,rgba(44,36,60,0.50)_0%,rgba(24,20,34,0.58)_100%)] backdrop-blur-2xl">
        {tracks === null ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-white/50" />
          </div>
        ) : tracks.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-white/60">No audio is ready here yet.</p>
        ) : (
          <ul>
            {tracks.map((t, i) => {
              const current = isThis && currentIndex === i
              return (
                <li key={t.id} className={cn(i > 0 && 'border-t border-white/[0.07]')}>
                  <button
                    type="button"
                    onClick={() => (current ? openDrawer() : start(i))}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.05]"
                  >
                    {showArt ? (
                      <span className="relative shrink-0">
                        <TrackArtwork track={t} iconKey={collection.iconKey} size={44} className="overflow-hidden rounded-[10px]" />
                        {current && isPlaying && (
                          <span className="absolute inset-0 flex items-center justify-center rounded-[10px] bg-black/50">
                            <Equalizer />
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className={cn('w-6 shrink-0 text-center text-sm tabular-nums', current ? 'text-[#39FF14]' : 'text-white/45')}>
                        {current && isPlaying ? <Equalizer /> : i + 1}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className={cn('block truncate text-[15px]', current ? 'font-semibold text-[#39FF14]' : 'text-white')}>{t.title}</span>
                      {(t.versionLabel || t.artist) && <span className="block truncate text-xs text-white/50">{t.versionLabel || t.artist}</span>}
                    </span>
                    {cachedTrackIds.has(t.id) && <Check className="h-3.5 w-3.5 shrink-0 text-white/40" aria-label="Downloaded" />}
                    <span className="shrink-0 text-xs tabular-nums text-white/45">{t.duration ? formatPlayerTime(t.duration) : ''}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
