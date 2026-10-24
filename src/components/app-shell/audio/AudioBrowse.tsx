'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Pause, Play, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAudioStudio } from '@/components/audio-studio/AudioStudioContext'
import { useGlobalAudioStore } from '@/lib/stores/global-audio-store'
import { useThemeImage } from '@/components/app-shell/ThemeProvider'
import type { ThemeSlot } from '@/lib/app-shell/theme-slots'
import {
  AUDIO_TABS,
  lifeVisionCollection,
  loadArtists,
  loadMySongs,
  loadPlaylists,
  storyCollection,
  tabForPath,
  withCollectionArt,
  type AudioCollection,
} from './sources'
import { AudioCollectionView, AudioCover } from './AudioCollectionView'
import { VisionVersionMenu } from './VisionVersionMenu'
import { AudioHeader } from './AudioHeader'

const CARD_SLOTS: ThemeSlot[] = ['card.1', 'card.2', 'card.3', 'card.4', 'card.5', 'card.6']

function CollectionCard({ c, onOpen }: { c: AudioCollection; onOpen: () => void }) {
  const play = useGlobalAudioStore((s) => s.play)
  const togglePlayPause = useGlobalAudioStore((s) => s.togglePlayPause)
  const setName = useGlobalAudioStore((s) => s.setName)
  const isPlaying = useGlobalAudioStore((s) => s.isPlaying)
  const [loading, setLoading] = React.useState(false)
  const isThis = setName === c.key

  const quickPlay = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isThis) {
      togglePlayPause()
      return
    }
    setLoading(true)
    try {
      const tracks = await c.loadTracks()
      if (tracks.length) play(tracks, 0, c.key, c.iconKey, c.category)
    } finally {
      setLoading(false)
    }
  }

  return (
    <li>
      <div role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => e.key === 'Enter' && onOpen()} className="group cursor-pointer">
        <div className="relative">
          <AudioCover src={c.artwork} title={c.title} badge={c.badge} className="aspect-square w-full rounded-[20px] shadow-[0_10px_28px_rgba(0,0,0,0.35)] transition-transform group-active:scale-[0.98]" />
          <button
            type="button"
            onClick={quickPlay}
            aria-label={isThis && isPlaying ? `Pause ${c.title}` : `Play ${c.title}`}
            className="absolute bottom-2.5 right-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-[#39FF14] text-black shadow-[0_6px_18px_rgba(0,0,0,0.4)] transition-transform active:scale-95"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : isThis && isPlaying ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="ml-0.5 h-5 w-5" fill="currentColor" />}
          </button>
        </div>
        <p className={cn('mt-2 truncate text-[15px] font-semibold', isThis ? 'text-[#39FF14]' : 'text-white')}>{c.title}</p>
        <p className="truncate text-xs text-white/55">{c.subtitle}</p>
      </div>
    </li>
  )
}

/**
 * The app-style audio library: tabs as swipeable pills, a Create audio
 * button, and every set as a cover card. Opening a card shows its set page.
 * There is never a player on this page; the mini player and Now Playing
 * handle playback everywhere.
 */
export function AudioBrowse() {
  const pathname = usePathname()
  const router = useRouter()
  const params = useSearchParams()
  const tab = tabForPath(pathname)
  const { visionId, vision, visionLoading, audioSets, audioSetsLoading: setsPending, storiesWithAudio, storiesWithAudioLoading } = useAudioStudio()
  const artRaw = CARD_SLOTS.map((s) => useThemeImage(s)) // eslint-disable-line react-hooks/rules-of-hooks
  const heroArt = useThemeImage('studio.life-vision' as ThemeSlot)
  const artKey = artRaw.join('|')
  const art = React.useMemo(() => artKey.split('|').map((u) => u || null), [artKey])

  const songs = useQuery({ queryKey: ['audio-browse', 'songs'], queryFn: loadMySongs, enabled: tab === 'songs' })
  const artists = useQuery({ queryKey: ['audio-browse', 'artists'], queryFn: loadArtists, enabled: tab === 'music' })
  const playlists = useQuery({ queryKey: ['audio-browse', 'playlists'], queryFn: loadPlaylists, enabled: tab === 'playlists' })

  // A disabled query (no vision yet) reports pending forever.
  const audioSetsLoading = visionLoading || (!!visionId && setsPending)
  const visionTitle = vision?.title || (vision?.is_household ? 'The Life We Choose' : 'The Life I Choose')

  const { collections, loading } = React.useMemo((): { collections: AudioCollection[]; loading: boolean } => {
    switch (tab) {
      case 'life-vision':
        return {
          collections: audioSets
            .filter((s) => s.isReady && s.track_count > 0)
            .map((s, i) => lifeVisionCollection(s, visionTitle, i === 0 ? heroArt ?? art[0] : art[i % art.length])),
          loading: audioSetsLoading,
        }
      case 'stories':
        return {
          collections: storiesWithAudio.map((s, i) => storyCollection(s as Parameters<typeof storyCollection>[0], art[(i + 2) % art.length])),
          loading: storiesWithAudioLoading,
        }
      case 'songs':
        return { collections: (songs.data ?? []).map((c, i) => withCollectionArt(c, art[i % art.length])), loading: songs.isLoading }
      case 'music':
        return { collections: (artists.data ?? []).map((c, i) => withCollectionArt(c, art[i % art.length])), loading: artists.isLoading }
      case 'meditations':
        // Meditations open the breathing studio at /meditations instead.
        return { collections: [], loading: false }
      case 'playlists':
        return { collections: (playlists.data ?? []).map((c, i) => withCollectionArt(c, art[(i + 3) % art.length])), loading: playlists.isLoading }
    }
  }, [tab, audioSets, audioSetsLoading, storiesWithAudio, storiesWithAudioLoading, songs.data, songs.isLoading, artists.data, artists.isLoading, playlists.data, playlists.isLoading, visionTitle, heroArt, art])

  // The open set lives in the URL (?open=<key>) so Back returns to the grid.
  const openKey = params.get('open')
  const open = openKey ? collections.find((c) => c.key === openKey) ?? null : null
  const openCollection = (c: AudioCollection) => router.push(`${pathname}?open=${encodeURIComponent(c.key)}`)
  const closeCollection = () => router.push(pathname ?? '/audio')

  if (open) return <AudioCollectionView collection={open} onBack={closeCollection} />

  return (
    <div className="space-y-5">
      <AudioHeader />

      {tab === 'life-vision' && <VisionVersionMenu />}

      {loading ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i}>
              <div className="aspect-square animate-pulse rounded-[20px] bg-white/[0.06]" />
              <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-white/[0.06]" />
            </li>
          ))}
        </ul>
      ) : collections.length === 0 ? (
        <div className="vf-glass rounded-[22px] border border-white/[0.12] bg-[linear-gradient(180deg,rgba(44,36,60,0.50)_0%,rgba(24,20,34,0.58)_100%)] p-6 text-center backdrop-blur-2xl">
          <p className="text-[15px] font-semibold text-white">Nothing here yet</p>
          <p className="mt-1 text-sm text-white/60">Create your first {AUDIO_TABS.find((t) => t.id === tab)?.label.toLowerCase()} audio and it shows up here.</p>
          <Link href="/audio/create" className="btn btn-primary mt-4 !py-2.5 !px-5 text-sm">
            <Plus className="mr-1.5 h-4 w-4" /> Create audio
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {collections.map((c) => (
            <CollectionCard key={c.key} c={c} onOpen={() => openCollection(c)} />
          ))}
        </ul>
      )}
    </div>
  )
}
