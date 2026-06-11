'use client'

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Container, Stack, Card, Button, Spinner, DeleteConfirmationDialog } from '@/lib/design-system/components'
import { type AudioTrack as BaseAudioTrack } from '@/lib/design-system'
import { createClient } from '@/lib/supabase/client'
import {
  Headphones, Moon, Zap, Flame, Shield,
  Sparkles, Mic, Music, Trash2, BookOpen, Image, Edit2,
  Volume2, Plus, Music2, ChevronDown, CheckCircle, Target, Lightbulb,
  Clock, ChevronRight, Library, AlertTriangle, RefreshCw,
} from 'lucide-react'
import { useAudioStudio, type AudioSetItem } from '@/components/audio-studio'
import { useAreaStats, type AreaStats } from '@/hooks/useAreaStats'
import { VISION_CATEGORIES, LIFE_CATEGORY_KEYS } from '@/lib/design-system/vision-categories'
import { EmbeddedPlayer, type MixDetails } from '@/lib/design-system/components'
import { useGlobalAudioStore } from '@/lib/stores/global-audio-store'
import { SyncedLyricsDisplay, PlainLyricsDisplay } from '@/components/audio-studio/SyncedLyricsDisplay'
import { convertMurekaLyrics, type SyncedLyrics } from '@/lib/utils/lyrics-alignment'
import { PlaylistsView } from '@/components/audio-studio/PlaylistsView'
import { AddToPlaylistSheet } from '@/components/audio-studio/AddToPlaylistSheet'
import type { SourceType } from '@/lib/services/playlistService'
import { storyTextMatchesTrack } from '@/lib/audio/content-normalize'
import { musicCatalogArtistFallback, musicCatalogPerformerLinks } from '@/lib/audio/music-performers'
import { dedupeMemberCatalogTracks } from '@/lib/songs/catalog-sync'
import type { Story } from '@/lib/stories/types'
import { useSongGeneration } from '@/lib/songs/hooks/useSongGeneration'
import type { Song } from '@/lib/songs/types'
import { AlbumArtModal } from '@/components/audio-studio/AlbumArtModal'
import { SubmitForPublishingSheet } from '@/components/audio-studio/SubmitForPublishingSheet'

function firstTrackIndexForStory(tracks: AudioTrack[], storyId: string) {
  const prefix = `${storyId}:`
  return tracks.findIndex(t => t.id.startsWith(prefix))
}

function storyIdFromTrackId(trackId: string): string | null {
  const colon = trackId.indexOf(':')
  return colon > 0 ? trackId.slice(0, colon) : null
}

interface AudioTrack extends BaseAudioTrack {
  sectionKey: string
}

function formatAccountDisplayName(account: {
  first_name?: string | null
  last_name?: string | null
  full_name?: string | null
} | null | undefined) {
  const full = (account?.full_name || '').trim()
  if (full) return full
  const first = (account?.first_name || '').trim()
  const last = (account?.last_name || '').trim()
  if (first && last) return `${first} ${last}`
  if (first) return first
  return 'You'
}

const ENTITY_META: Record<string, { label: string; badgeColor: string; icon: React.ElementType }> = {
  life_vision: { label: 'Life Vision', badgeColor: 'text-purple-400 bg-purple-500/20 border-purple-500/30', icon: Target },
  vision_board_item: { label: 'Vision Board', badgeColor: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30', icon: Image },
  journal_entry: { label: 'Journal', badgeColor: 'text-teal-400 bg-teal-500/20 border-teal-500/30', icon: BookOpen },
  custom: { label: 'Custom', badgeColor: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30', icon: Lightbulb },
  goal: { label: 'Goal', badgeColor: 'text-green-400 bg-green-500/20 border-green-500/30', icon: BookOpen },
  schedule_block: { label: 'Schedule', badgeColor: 'text-orange-400 bg-orange-500/20 border-orange-500/30', icon: Clock },
}

const STREAMING_ICONS: Record<string, React.ReactNode> = {
  spotify: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  ),
  apple: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  ),
  amazon: (
    <svg viewBox="0 0 448 512" fill="currentColor" className="w-5 h-5">
      <path d="M257.2 162.7c-48.7 1.8-169.5 15.5-169.5 117.5 0 109.5 138.3 114 183.5 43.2 6.5 10.2 35.4 37.5 45.3 46.8l56.8-56S341 288.9 341 261.4V114.3C341 89 316.5 32 228.7 32 140.7 32 94 87 94 136.3l73.5 6.8c16.3-49.5 54.2-49.5 54.2-49.5 40.7-.1 35.5 29.8 35.5 69.1zm0 86.8c0 80-84.2 68-84.2 17.2 0-47.2 50.5-56.7 84.2-57.8v40.6zm136 163.5c-7.7 10-70 67-174.5 67S34.2 408.5 9.7 379c-6.8-7.7 1-11.4 5.8-8.5 56.2 17.7 155.2 50.7 257.5-11.5 8.6-5.2 17.2 2.1 10.2 12.9z" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  soundcloud: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.057-.048-.1-.098-.1zm-.899.828c-.06 0-.091.037-.104.094L0 14.479l.172 1.308c.013.06.045.094.104.094.057 0 .089-.035.104-.094l.197-1.308-.197-1.332c-.015-.06-.047-.094-.104-.094zm1.844-1.475c-.067 0-.12.06-.12.128l-.19 2.773.19 2.65c0 .068.053.12.12.12s.12-.052.126-.12l.215-2.65-.215-2.773c-.006-.068-.059-.128-.126-.128zm.943-.39c-.075 0-.135.065-.142.135l-.17 3.163.17 2.786c.007.075.067.135.142.135.074 0 .134-.06.142-.135l.195-2.786-.195-3.164c-.008-.074-.068-.134-.142-.134zm.964-.125c-.083 0-.15.074-.157.149l-.15 3.288.15 2.836c.007.082.074.149.157.149.082 0 .15-.067.157-.149l.172-2.836-.172-3.288c-.008-.082-.075-.149-.157-.149zm1.012.12c-.09 0-.165.082-.172.164l-.135 3.168.135 2.86c.007.09.082.165.172.165.09 0 .164-.075.172-.165l.154-2.86-.154-3.168c-.008-.09-.082-.164-.172-.164zm1.02-.17c-.098 0-.18.09-.187.18l-.12 3.338.12 2.874c.007.097.09.18.188.18.097 0 .18-.083.187-.18l.135-2.874-.135-3.337c-.008-.098-.09-.18-.188-.18zm4.307-1.05c-.046 0-.09.008-.135.022a6.093 6.093 0 00-5.643-3.773c-.596 0-1.17.093-1.697.262-.2.064-.254.128-.254.253v9.617c0 .135.105.248.239.262h7.49c1.39 0 2.519-1.12 2.519-2.51s-1.13-2.508-2.52-2.508z" />
    </svg>
  ),
}

function MusicStreamingLinks({ track }: { track: Record<string, unknown> }) {
  const links = [
    { key: 'spotify', url: track.spotify_url as string | undefined, label: 'Spotify', color: 'hover:text-[#1DB954]' },
    { key: 'apple', url: track.apple_music_url as string | undefined, label: 'Apple Music', color: 'hover:text-[#FC3C44]' },
    { key: 'amazon', url: track.amazon_music_url as string | undefined, label: 'Amazon', color: 'hover:text-[#25D1DA]' },
    { key: 'youtube', url: track.youtube_music_url as string | undefined, label: 'YouTube', color: 'hover:text-[#FF0000]' },
    { key: 'soundcloud', url: track.soundcloud_url as string | undefined, label: 'SoundCloud', color: 'hover:text-[#FF5500]' },
  ].filter(l => l.url)
  if (links.length === 0) return null
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] text-neutral-500">Stream on</span>
      {links.map(l => (
        <a
          key={l.key}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          title={l.label}
          className={`text-neutral-500 ${l.color} transition-colors`}
        >
          {STREAMING_ICONS[l.key]}
        </a>
      ))}
    </div>
  )
}

const MUSIC_SPECIAL_FILTER_LABELS: Record<string, string> = {
  published: 'Published',
  'member-library': 'Member Library',
}

function MusicCategoryDropdown({
  value,
  onChange,
  categories,
}: {
  value: string
  onChange: (v: string) => void
  categories: string[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  const sorted = [...categories].sort((a, b) => {
    const catA = VISION_CATEGORIES.find(c => c.key === a)
    const catB = VISION_CATEGORIES.find(c => c.key === b)
    return (catA?.order ?? 99) - (catB?.order ?? 99)
  })

  const selectedLabel = MUSIC_SPECIAL_FILTER_LABELS[value]
    || (value === 'all' ? 'All Songs' : VISION_CATEGORIES.find(c => c.key === value)?.label || value)

  const select = (v: string) => { onChange(v); setIsOpen(false) }
  const optionClass = (isSelected: boolean) =>
    `w-full px-4 py-2 text-left text-sm transition-colors ${isSelected ? 'bg-primary-500/20 text-primary-500 font-semibold' : 'text-white hover:bg-[#333]'}`

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center gap-1.5 bg-[#404040] border border-[#666] hover:border-neutral-500 text-white text-xs rounded-xl pl-3 pr-2 py-1.5 focus:outline-none focus:border-primary-500 transition-colors cursor-pointer"
      >
        {selectedLabel}
        <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-20 mt-1.5 min-w-[180px] py-1.5 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-64 overflow-y-auto overscroll-contain">
            <button type="button" onClick={() => select('published')} className={optionClass(value === 'published')}>
              Published
            </button>
            <button type="button" onClick={() => select('member-library')} className={optionClass(value === 'member-library')}>
              Member Library
            </button>
            <button type="button" onClick={() => select('all')} className={optionClass(value === 'all')}>
              All Songs
            </button>
            {sorted.length > 0 && (
              <>
                <div className="my-1 border-t border-[#333]" />
                <p className="px-4 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Life Categories</p>
                {sorted.map(tag => {
                  const cat = VISION_CATEGORIES.find(c => c.key === tag)
                  return (
                    <button key={tag} type="button" onClick={() => select(tag)} className={optionClass(value === tag)}>
                      {cat?.label || tag}
                    </button>
                  )
                })}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function ListenPracticeStatsRow({
  practiceStats,
  totalPlays,
  totalSets,
  totalTracks,
  statsExpanded,
  setStatsExpanded,
  freezeOpen,
  setFreezeOpen,
  freezeRef,
}: {
  practiceStats: AreaStats | null
  totalPlays: number
  totalSets: number
  totalTracks: number
  statsExpanded: boolean
  setStatsExpanded: React.Dispatch<React.SetStateAction<boolean>>
  freezeOpen: boolean
  setFreezeOpen: React.Dispatch<React.SetStateAction<boolean>>
  freezeRef: React.RefObject<HTMLElement | null>
}) {
  return (
    <div className="flex items-center justify-center gap-1 flex-wrap mt-2 text-[11px] leading-none">
      <span className="inline-flex items-center gap-1 text-white font-medium">
        {(practiceStats?.currentStreak ?? 0) >= 1 && <Flame className="w-3 h-3 text-orange-400" />}
        {practiceStats?.currentStreak ?? 0}
        <span className="text-neutral-500">{(practiceStats?.currentStreak ?? 0) === 1 ? 'day' : 'days'}</span>
      </span>
      {(practiceStats?.streakFreezeAvailable || practiceStats?.streakFreezeUsedThisWeek) && (
        <span className="relative" ref={freezeRef}>
          <button type="button" className="inline-flex items-center" onClick={() => setFreezeOpen(prev => !prev)}>
            <Shield className={`w-3 h-3 cursor-help ${practiceStats?.streakFreezeUsedThisWeek ? 'text-blue-500/40' : 'text-blue-400'}`} />
          </button>
          <div
            className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 rounded-xl bg-neutral-900 border border-blue-500/20 p-3 shadow-xl transition-all duration-200 z-[100] ${freezeOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
          >
            <p className="text-sm font-semibold text-blue-400 mb-1">
              Streak Freeze <span className="font-normal text-blue-400/70">({practiceStats?.streakFreezeUsedThisWeek ? 'Used this week' : 'Available'})</span>
            </p>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {practiceStats?.streakFreezeUsedThisWeek
                ? 'Your streak was saved this week. You get 1 free grace day per week for each habit.'
                : 'You get 1 free grace day per week. If you miss a day, your streak stays alive so one off-day doesn\'t wipe out your progress.'}
            </p>
          </div>
        </span>
      )}
      <span className="text-neutral-600 mx-0.5">&middot;</span>
      <span className="text-white font-medium">{practiceStats?.countLast7 ?? 0}<span className="text-neutral-500">/7 week</span></span>
      <span className="text-neutral-600 mx-0.5">&middot;</span>
      <span className="text-white font-medium">{practiceStats?.countLast30 ?? 0}<span className="text-neutral-500">/30 month</span></span>
      {statsExpanded && (
        <>
          <span className="text-neutral-600 mx-0.5">&middot;</span>
          <span className="text-white font-medium">{totalPlays.toLocaleString()} <span className="text-neutral-500">plays</span></span>
          <span className="text-neutral-600 mx-0.5">&middot;</span>
          <span className="text-white font-medium">{(practiceStats?.countAllTime ?? 0).toLocaleString()} <span className="text-neutral-500">total days</span></span>
          <span className="text-neutral-600 mx-0.5">&middot;</span>
          <span className="text-white font-medium">{totalSets.toLocaleString()} <span className="text-neutral-500">sets</span></span>
          <span className="text-neutral-600 mx-0.5">&middot;</span>
          <span className="text-white font-medium">{totalTracks.toLocaleString()} <span className="text-neutral-500">tracks</span></span>
        </>
      )}
      <button
        type="button"
        onClick={() => setStatsExpanded(prev => !prev)}
        className="text-neutral-500 hover:text-neutral-300 transition-colors ml-0.5"
        aria-expanded={statsExpanded}
      >
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${statsExpanded ? 'rotate-180' : ''}`} />
      </button>
    </div>
  )
}

export default function AudioListenPage() {
  const {
    visionId, visionLoading,
    audioSets, audioSetsLoading, refreshAudioSets,
    switchVision, allVisions,
    listenContentType: contentType,
    listenStoryFilter,
    storiesWithAudio: stories, storiesWithAudioLoading: storiesLoading,
  } = useAudioStudio()

  // Vision state
  const [selectedAudioSetId, setSelectedAudioSetId] = useState<string | null>(null)
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([])
  const [loadingTracks, setLoadingTracks] = useState(false)
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isEditingAudioSetName, setIsEditingAudioSetName] = useState(false)
  const [audioSetNameDraft, setAudioSetNameDraft] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [setToDelete, setSetToDelete] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Story audio state — all filtered stories load into one player playlist
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null)
  const [allStoriesPlayerTracks, setAllStoriesPlayerTracks] = useState<AudioTrack[]>([])
  const [storyAudioLoading, setStoryAudioLoading] = useState(false)
  const [storyDropdownOpen, setStoryDropdownOpen] = useState(false)
  const storyDropdownRef = useRef<HTMLDivElement>(null)
  const playTrackAction = useGlobalAudioStore(s => s.playTrack)
  const playPlaylistAction = useGlobalAudioStore(s => s.play)
  const storeTracks = useGlobalAudioStore(s => s.tracks)
  const storeIndex = useGlobalAudioStore(s => s.currentIndex)

  // Music catalog state
  const [musicTracks, setMusicTracks] = useState<any[]>([])
  const [musicLoading, setMusicLoading] = useState(false)
  const [musicCategoryFilter, setMusicCategoryFilter] = useState<string>('published')

  // Add to Playlist sheet state
  const [playlistSheetOpen, setPlaylistSheetOpen] = useState(false)
  const [playlistSheetTrack, setPlaylistSheetTrack] = useState<BaseAudioTrack | null>(null)
  const [playlistSheetSourceType, setPlaylistSheetSourceType] = useState<SourceType>('life_vision')
  const [playlistSheetSourceId, setPlaylistSheetSourceId] = useState('')

  const handleAddToPlaylist = (track: BaseAudioTrack, sourceType: SourceType) => {
    setPlaylistSheetTrack(track)
    setPlaylistSheetSourceType(sourceType)
    setPlaylistSheetSourceId(track.id)
    setPlaylistSheetOpen(true)
  }

  // Stats
  const [totalPlays, setTotalPlays] = useState(0)
  const [statsExpanded, setStatsExpanded] = useState(false)
  const [freezeOpen, setFreezeOpen] = useState(false)
  const freezeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!freezeOpen) return
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (freezeRef.current && !freezeRef.current.contains(e.target as Node)) setFreezeOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => { document.removeEventListener('mousedown', handleOutside); document.removeEventListener('touchstart', handleOutside) }
  }, [freezeOpen])

  const searchParams = useSearchParams()
  const urlAudioSetId = searchParams.get('audioSetId')
  const urlStoryId = searchParams.get('storyId')

  useEffect(() => { loadTotalPlays() }, [])

  // Track whether the deep link has already been consumed so version switches don't re-select it.
  const deepLinkConsumed = useRef(false)

  // Deep link ?audioSetId= — refresh catalog then load this set (fixes stale list right after generation).
  useEffect(() => {
    if (!urlAudioSetId || !visionId || deepLinkConsumed.current) return

    let cancelled = false
    ;(async () => {
      const supabase = createClient()
      const { data: setRow } = await supabase
        .from('audio_sets')
        .select('vision_id')
        .eq('id', urlAudioSetId)
        .maybeSingle()

      if (cancelled) return

      if (setRow?.vision_id && setRow.vision_id !== visionId) {
        const targetVision = allVisions.find(v => v.id === setRow.vision_id)
        if (targetVision) {
          switchVision(setRow.vision_id)
          return
        }
      }

      await refreshAudioSets()
      if (cancelled) return
      deepLinkConsumed.current = true
      setSelectedAudioSetId(urlAudioSetId)
      await loadAudioTracks(urlAudioSetId)
      if (cancelled) return
      localStorage.setItem(`audioSetSelection_${visionId}`, urlAudioSetId)
    })()

    return () => {
      cancelled = true
    }
  }, [urlAudioSetId, visionId])

  useEffect(() => {
    if (urlAudioSetId && !deepLinkConsumed.current) return
    if (deepLinkConsumed.current && selectedAudioSetId) return

    if (audioSetsLoading || audioSets.length === 0) return
    const saved = visionId ? localStorage.getItem(`audioSetSelection_${visionId}`) : null
    let target = saved ? audioSets.find(s => s.id === saved && s.isReady) : null
    if (!target) target = audioSets.find(s => s.isReady) || null
    if (target) { setSelectedAudioSetId(target.id); loadAudioTracks(target.id) }
  }, [audioSets, audioSetsLoading, visionId])

  useEffect(() => { setIsEditingAudioSetName(false) }, [selectedAudioSetId])

  const VOICE_NAMES: Record<string, string> = { alloy: 'Alloy', shimmer: 'Shimmer', ash: 'Ash', coral: 'Coral', echo: 'Echo', fable: 'Fable', onyx: 'Onyx', nova: 'Nova', sage: 'Sage' }

  const filteredStories = useMemo(
    () => (listenStoryFilter === 'all'
      ? stories
      : stories.filter(s => s.entity_type === listenStoryFilter)),
    [stories, listenStoryFilter],
  )

  const filteredStoryIds = useMemo(
    () => filteredStories.map(s => s.id).join(','),
    [filteredStories],
  )

  useEffect(() => {
    if (contentType !== 'stories') return
    if (storiesLoading) return

    let cancelled = false

    async function fetchStoryTracksForPlayer(story: Story): Promise<AudioTrack[]> {
      const supabase = createClient()
      const tracks: AudioTrack[] = []
      const storyTitle = story.title || 'Untitled Story'
      const meta = ENTITY_META[story.entity_type] || ENTITY_META.custom!
      const entityLabel = meta.label
      const sectionKey = story.entity_type || 'custom'

      let audioSetId = story.audio_set_id
      if (!audioSetId) {
        const { data: linkedSet } = await supabase
          .from('audio_sets')
          .select('id')
          .eq('content_type', 'story')
          .eq('content_id', story.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (linkedSet) audioSetId = linkedSet.id
      }

      if (audioSetId) {
        const { data: trackRows } = await supabase
          .from('audio_tracks')
          .select('id, audio_url, text_content')
          .eq('audio_set_id', audioSetId)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })

        const currentTracks = (trackRows || []).filter(track =>
          storyTextMatchesTrack(story.content, track.text_content),
        )

        currentTracks.forEach((track, idx) => {
          if (!track.audio_url) return
          tracks.push({
            id: `${story.id}:track:${track.id}`,
            title: currentTracks.length > 1
              ? `${storyTitle} (${idx + 1}/${currentTracks.length})`
              : storyTitle,
            artist: entityLabel,
            duration: 0,
            url: track.audio_url,
            thumbnail: '',
            sectionKey,
          })
        })
      }

      if (story.user_audio_url) {
        tracks.push({
          id: `${story.id}:user-recording`,
          title: `${storyTitle} · Personal Recording`,
          artist: 'Your voice',
          duration: 0,
          url: story.user_audio_url,
          thumbnail: '',
          sectionKey,
        })
      }

      return tracks
    }

    async function loadAllStoriesIntoPlayer() {
      if (filteredStories.length === 0) {
        setAllStoriesPlayerTracks([])
        setSelectedStoryId(null)
        setStoryAudioLoading(false)
        return
      }

      setStoryAudioLoading(true)
      setAllStoriesPlayerTracks([])

      const batches = await Promise.all(
        filteredStories.map(story => fetchStoryTracksForPlayer(story)),
      )
      if (cancelled) return

      const merged = batches.flat()
      setAllStoriesPlayerTracks(merged)
      setStoryAudioLoading(false)

      const pickDefaultStoryId = () => {
        if (urlStoryId && filteredStories.some(s => s.id === urlStoryId)) return urlStoryId
        const firstWithAudio = filteredStories.find((_, i) => (batches[i]?.length ?? 0) > 0)
        return firstWithAudio?.id ?? filteredStories[0]?.id ?? null
      }

      const defaultStoryId = pickDefaultStoryId()
      setSelectedStoryId(prev => {
        if (prev && filteredStories.some(s => s.id === prev)) return prev
        return defaultStoryId
      })
    }

    void loadAllStoriesIntoPlayer()

    return () => {
      cancelled = true
    }
  }, [contentType, storiesLoading, filteredStoryIds, urlStoryId])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (storyDropdownRef.current && !storyDropdownRef.current.contains(e.target as Node)) setStoryDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Songs state
  const [userSongs, setUserSongs] = useState<any[]>([])
  const [userSongsLoading, setUserSongsLoading] = useState(false)
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null)
  const [songTracks, setSongTracks] = useState<BaseAudioTrack[]>([])
  const [songTracksLoading, setSongTracksLoading] = useState(false)
  const [songDropdownOpen, setSongDropdownOpen] = useState(false)
  const [songsLoaded, setSongsLoaded] = useState(false)
  const [songTrackFavorites, setSongTrackFavorites] = useState<Record<string, boolean>>({})
  const [songDeleteTarget, setSongDeleteTarget] = useState<BaseAudioTrack | null>(null)
  const [songDeleting, setSongDeleting] = useState(false)
  const [songArtistName, setSongArtistName] = useState('')
  const [albumArtModalOpen, setAlbumArtModalOpen] = useState(false)
  const [songTrackLibrary, setSongTrackLibrary] = useState<Record<string, boolean>>({})
  const [publishSheetOpen, setPublishSheetOpen] = useState(false)
  const [publishSheetTrack, setPublishSheetTrack] = useState<{ songId: string; trackId: string; title?: string } | null>(null)

  const selectedSong = useMemo(
    () => userSongs.find((s: Song) => s.id === selectedSongId) ?? null,
    [userSongs, selectedSongId]
  )

  const handleSongGenerationComplete = useCallback(async () => {
    await loadUserSongs()
    if (selectedSongId) await loadSongTracks(selectedSongId)
  }, [selectedSongId])

  const {
    generateMore: generateMoreSongVersions,
    isGenerating: songGenerating,
    error: songGenerateError,
  } = useSongGeneration({
    song: selectedSong,
    onComplete: handleSongGenerationComplete,
  })

  async function handleSongQuickGenerate() {
    if (!selectedSong?.lyrics) return
    await generateMoreSongVersions({
      lyrics: selectedSong.lyrics,
      style_prompt: selectedSong.style_prompt || undefined,
    })
  }

  useEffect(() => {
    if (contentType === 'songs' && !songsLoaded && !userSongsLoading) loadUserSongs()
  }, [contentType, songsLoaded, userSongsLoading])

  useEffect(() => {
    if (selectedSongId && songArtistName) loadSongTracks(selectedSongId)
  }, [selectedSongId, songArtistName])

  async function loadUserSongs() {
    setUserSongsLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: account } = await supabase
        .from('user_accounts')
        .select('first_name, last_name, full_name')
        .eq('id', user.id)
        .single()
      setSongArtistName(formatAccountDisplayName(account))
    }
    const { data } = await supabase
      .from('songs')
      .select('id, title, status, created_at, entity_type, lyrics, style_prompt, metadata, generation_count')
      .in('status', ['completed', 'generating_music'])
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) {
      setUserSongs(data)
      if (data.length > 0 && !selectedSongId) setSelectedSongId(data[0].id)
    }
    setSongsLoaded(true)
    setUserSongsLoading(false)
  }

  async function loadSongTracks(songId: string) {
    setSongTracksLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('song_tracks')
      .select('id, title, version, mp3_url, cover_url, duration_ms, genres, is_favorite, in_member_library, metadata')
      .eq('song_id', songId)
      .order('created_at')
    if (data) {
      const favs: Record<string, boolean> = {}
      const libState: Record<string, boolean> = {}
      const mapped = data.filter((t: any) => t.mp3_url).map((t: any) => {
        favs[t.id] = !!t.is_favorite
        libState[t.id] = !!t.in_member_library
        const meta = t.metadata as Record<string, unknown> | null
        const lyricsSections = meta?.lyrics_sections as any[] | undefined
        const songTitle = userSongs.find(s => s.id === songId)?.title || 'VIVA Song'
        const versionLabel = t.title || `Version ${t.version}`
        return {
          id: t.id,
          title: songTitle,
          artist: songArtistName,
          versionLabel,
          performers: songArtistName
            ? [{ name: songArtistName, snapshotHref: '/snapshot/me' }]
            : undefined,
          duration: t.duration_ms ? t.duration_ms / 1000 : 180,
          url: t.mp3_url,
          thumbnail: t.cover_url || undefined,
          syncedLyrics: lyricsSections?.length ? convertMurekaLyrics(lyricsSections) : undefined,
          plainLyrics: userSongs.find(s => s.id === songId)?.lyrics || undefined,
        }
      })
      setSongTracks(mapped)
      setSongTrackFavorites(favs)
      setSongTrackLibrary(libState)
    }
    setSongTracksLoading(false)
  }

  // Heart is a personal like only — does not add to Member Library or the public catalog.
  async function handleSongToggleFavorite(track: BaseAudioTrack) {
    if (!selectedSongId) return
    const wasFav = songTrackFavorites[track.id] ?? false
    const newFav = !wasFav
    setSongTrackFavorites(prev => ({ ...prev, [track.id]: newFav }))
    try {
      await fetch(`/api/songs/${selectedSongId}/favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track_id: track.id }),
      })
    } catch {
      setSongTrackFavorites(prev => ({ ...prev, [track.id]: wasFav }))
    }
  }

  async function handleSongDeleteTrack() {
    if (!songDeleteTarget || !selectedSongId) return
    setSongDeleting(true)
    try {
      const res = await fetch(`/api/songs/${selectedSongId}/tracks/${songDeleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) loadSongTracks(selectedSongId)
    } catch (err) {
      console.error('Delete track failed:', err)
    } finally {
      setSongDeleting(false)
      setSongDeleteTarget(null)
    }
  }

  async function handleSongAddToLibrary(track: BaseAudioTrack) {
    if (!selectedSongId) return
    const wasInLibrary = songTrackLibrary[track.id] ?? false
    setSongTrackLibrary(prev => ({ ...prev, [track.id]: !wasInLibrary }))
    try {
      await fetch(`/api/songs/${selectedSongId}/library`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track_id: track.id }),
      })
    } catch {
      setSongTrackLibrary(prev => ({ ...prev, [track.id]: wasInLibrary }))
    }
  }

  function handleSongSubmitForPublishing(track: BaseAudioTrack) {
    if (!selectedSongId) return
    const songTitle = userSongs.find(s => s.id === selectedSongId)?.title
    setPublishSheetTrack({ songId: selectedSongId, trackId: track.id, title: songTitle })
    setPublishSheetOpen(true)
  }

  useEffect(() => {
    if (contentType === 'music' && musicTracks.length === 0 && !musicLoading) loadMusicCatalog()
  }, [contentType])

  async function loadMusicCatalog() {
    setMusicLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('music_catalog')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .order('album')
      .order('track_number')
    if (data) setMusicTracks(data)
    setMusicLoading(false)
  }


  const selectedStory = stories.find(s => s.id === selectedStoryId)

  const isStoriesPlaylistActive =
    allStoriesPlayerTracks.length > 0
    && storeTracks.length === allStoriesPlayerTracks.length
    && storeTracks[0]?.id === allStoriesPlayerTracks[0]?.id

  const playingStoryId = useMemo(() => {
    if (!isStoriesPlaylistActive) return null
    const track = storeTracks[storeIndex]
    if (!track) return null
    return storyIdFromTrackId(track.id)
  }, [isStoriesPlaylistActive, storeTracks, storeIndex, allStoriesPlayerTracks])

  useEffect(() => {
    if (contentType !== 'stories' || !playingStoryId) return
    if (stories.some(s => s.id === playingStoryId)) {
      setSelectedStoryId(playingStoryId)
    }
  }, [contentType, playingStoryId, stories])

  const playingStory = stories.find(s => s.id === playingStoryId)

  const jumpToStoryInPlayer = (storyId: string) => {
    setSelectedStoryId(storyId)
    setStoryDropdownOpen(false)
    const idx = firstTrackIndexForStory(allStoriesPlayerTracks, storyId)
    if (idx < 0) return
    const storeTracks = useGlobalAudioStore.getState().tracks
    const isSamePlaylist = storeTracks.length === allStoriesPlayerTracks.length
      && allStoriesPlayerTracks.length > 0
      && storeTracks[0]?.id === allStoriesPlayerTracks[0]?.id
    if (isSamePlaylist) {
      playTrackAction(idx)
    } else {
      playPlaylistAction(allStoriesPlayerTracks, idx, 'My Stories', 'stories', 'story')
    }
  }

  async function loadTotalPlays() {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) return
    const { data: playsData } = await supabase.rpc('get_user_total_audio_plays', { p_user_id: user.id })
    setTotalPlays(playsData ?? 0)
  }

  async function loadAudioTracks(audioSetId: string) {
    setLoadingTracks(true)
    const supabase = createClient()
    const { data: audioSet } = await supabase.from('audio_sets').select('variant, metadata').eq('id', audioSetId).single()
    const isCombinedOnly = (audioSet?.metadata as any)?.output_format === 'combined'

    let tracksQuery = supabase
      .from('audio_tracks').select('*').eq('audio_set_id', audioSetId).eq('status', 'completed')
      .not('audio_url', 'is', null)
    if (isCombinedOnly) {
      tracksQuery = tracksQuery.eq('section_key', 'full')
    }
    const { data: tracks } = await tracksQuery.order('section_key')

    const sectionMap = new Map<string, string>([
      ['forward', 'Forward'], ['fun', 'Fun'], ['health', 'Health'], ['travel', 'Travel'],
      ['love', 'Love'], ['family', 'Family'], ['social', 'Social'], ['home', 'Home'],
      ['work', 'Work'], ['money', 'Money'], ['stuff', 'Stuff'], ['giving', 'Giving'],
      ['spirituality', 'Spirituality'], ['conclusion', 'Conclusion'], ['full', 'Full Life Vision'],
    ])
    const canonicalOrder = ['forward', 'fun', 'health', 'travel', 'love', 'family', 'social', 'home', 'work', 'money', 'stuff', 'giving', 'spirituality', 'conclusion']
    const formatted: AudioTrack[] = (tracks || [])
      .map(t => {
        const useDirectAudio = audioSet?.variant === 'standard' || audioSet?.variant === 'personal'
        const url = !useDirectAudio && t.mixed_audio_url && t.mix_status === 'completed' ? t.mixed_audio_url : t.audio_url
        const dur = typeof t.duration_seconds === 'number' && isFinite(t.duration_seconds) && t.duration_seconds > 0 ? t.duration_seconds : 0
        return { id: t.id, title: sectionMap.get(t.section_key) || t.section_key, artist: '', duration: dur, url: url || '', thumbnail: '', sectionKey: t.section_key }
      })
      .filter(t => t.url.length > 0)
      .sort((a, b) => {
        const ia = canonicalOrder.indexOf(a.sectionKey), ib = canonicalOrder.indexOf(b.sectionKey)
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
      })
    setAudioTracks(formatted)
    setLoadingTracks(false)
  }

  const handleSelectSet = async (setId: string) => {
    setSelectedAudioSetId(setId)
    await loadAudioTracks(setId)
    if (visionId) localStorage.setItem(`audioSetSelection_${visionId}`, setId)
  }

  const handleDelete = (setId: string, setName: string) => { setSetToDelete({ id: setId, name: setName }); setShowDeleteDialog(true) }

  const confirmDelete = async () => {
    if (!setToDelete) return
    setDeleting(setToDelete.id); setShowDeleteDialog(false)
    const supabase = createClient()
    const { error } = await supabase.from('audio_sets').delete().eq('id', setToDelete.id)
    if (!error) { await refreshAudioSets(); if (selectedAudioSetId === setToDelete.id) { setSelectedAudioSetId(null); setAudioTracks([]) } }
    setDeleting(null); setSetToDelete(null)
  }

  const getVariantIcon = (set: AudioSetItem) => {
    const cls = 'w-5 h-5'
    if (set.variant === 'personal') return <Mic className={cls} />
    let vv = 100, bv = 0
    if (set.mixRatio) { const m = set.mixRatio.match(/(\d+)%\s*\/\s*(\d+)%/); if (m) { vv = parseInt(m[1]); bv = parseInt(m[2]) } }
    if (bv === 0 || set.variant === 'standard') return <Headphones className={cls} />
    if (vv <= 30) return <Moon className={cls} />
    if (vv >= 40 && vv <= 60) return <Sparkles className={cls} />
    return <Zap className={cls} />
  }
  const getVariantColor = (set: AudioSetItem) => {
    if (set.variant === 'personal') return 'bg-secondary-500/20 text-secondary-500'
    let vv = 100, bv = 0
    if (set.mixRatio) { const m = set.mixRatio.match(/(\d+)%\s*\/\s*(\d+)%/); if (m) { vv = parseInt(m[1]); bv = parseInt(m[2]) } }
    if (bv === 0 || set.variant === 'standard') return 'bg-primary-500/20 text-primary-500'
    if (vv <= 30) return 'bg-blue-500/20 text-blue-400'
    if (vv >= 40 && vv <= 60) return 'bg-purple-500/20 text-purple-400'
    return 'bg-yellow-500/20 text-yellow-400'
  }
  const getSetDisplayName = (set: AudioSetItem) => {
    if (set.name && !set.name.includes('Version') && !set.name.includes(':')) return set.name
    if (set.variant === 'personal') return 'Personal Recording'
    let vv = 100, bv = 0
    if (set.mixRatio) { const m = set.mixRatio.match(/(\d+)%\s*\/\s*(\d+)%/); if (m) { vv = parseInt(m[1]); bv = parseInt(m[2]) } }
    if (bv === 0 || set.variant === 'standard') return `Voice Only · ${getVoiceDisplayName(set.voice_id)}`
    if (vv <= 30) return 'Sleep'
    if (vv >= 40 && vv <= 60) return 'Meditation'
    return 'Power'
  }
  const getVoiceDisplayName = (voiceId: string) => {
    const map: Record<string, string> = { alloy: 'Alloy', shimmer: 'Shimmer', ash: 'Ash', coral: 'Coral', echo: 'Echo', fable: 'Fable', onyx: 'Onyx', nova: 'Nova', sage: 'Sage' }
    return map[voiceId] || voiceId
  }

  /** Split "Voice + mix" style names for a compact two-line app picker. */
  const getAudioSetPickerLines = (label: string) => {
    const s = label.trim()
    const parts = s.split(/\s+\+\s+/)
    if (parts.length >= 2) {
      return { primary: parts[0]!.trim(), secondary: parts.slice(1).join(' + ').trim() }
    }
    return { primary: s }
  }

  const { stats: practiceStats } = useAreaStats('vision-audio')
  const totalSets = audioSets.length
  const totalTracks = audioSets.reduce((sum, s) => sum + s.track_count, 0)
  const selectedSet = audioSets.find(s => s.id === selectedAudioSetId)

  const { musicTagCategories, musicPlayerTracks } = useMemo(() => {
    if (contentType !== 'music') {
      return {
        musicTagCategories: [] as string[],
        musicPlayerTracks: [] as AudioTrack[],
      }
    }

    // Member Library = member-created tracks from the music catalog (one version per song)
    if (musicCategoryFilter === 'member-library') {
      const memberTracks = dedupeMemberCatalogTracks(
        musicTracks.filter((t: (typeof musicTracks)[number]) =>
          Array.isArray(t.tags) && t.tags.includes('member-created'),
        ),
      )
      const libraryPlayerTracks: AudioTrack[] = memberTracks
        .filter((t: any) => t.preview_url)
        .map((t: any) => ({
          id: t.id,
          title: t.title,
          artist: musicCatalogArtistFallback(t.id, t.album, { description: t.description, tags: t.tags }),
          performers: musicCatalogPerformerLinks(t.id, { description: t.description, tags: t.tags }),
          albumLabel: (t.album || '').trim() || undefined,
          duration: typeof t.duration_seconds === 'number' && isFinite(t.duration_seconds) ? t.duration_seconds : 0,
          url: t.preview_url,
          thumbnail: t.artwork_url || '',
          sectionKey: 'music',
          syncedLyrics: t.synced_lyrics || undefined,
          plainLyrics: t.plain_lyrics || undefined,
          publishStatus: Array.isArray(t.tags) && t.tags.includes('published') ? 'published' as const : undefined,
        }))
      return {
        musicTagCategories: [] as string[],
        musicPlayerTracks: libraryPlayerTracks,
      }
    }

    if (musicTracks.length === 0) {
      return {
        musicTagCategories: [] as string[],
        musicPlayerTracks: [] as AudioTrack[],
      }
    }

    const filtered: typeof musicTracks = musicCategoryFilter === 'all'
      ? musicTracks
      : musicCategoryFilter === 'published'
        ? musicTracks.filter((t: (typeof musicTracks)[number]) => {
            const tags = (t.tags || []) as string[]
            return !tags.includes('member-created') || tags.includes('published')
          })
        : musicTracks.filter((t: (typeof musicTracks)[number]) => (t.tags || []).includes(musicCategoryFilter))
    const isHolidayTrack = (t: (typeof musicTracks)[number]) => t.genre === 'Holiday'
    const sortByTitle = (a: (typeof musicTracks)[number], b: (typeof musicTracks)[number]) =>
      (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' })

    const holidayTracks = filtered.filter(isHolidayTrack).sort(sortByTitle)
    const nonHolidayTracks = filtered.filter((t: (typeof musicTracks)[number]) => !isHolidayTrack(t))
    const featured = nonHolidayTracks
      .filter((t: (typeof musicTracks)[number]) => t.is_featured)
      .sort(sortByTitle)
    const mainCatalog = nonHolidayTracks
      .filter((t: (typeof musicTracks)[number]) => !t.is_featured)
      .sort(sortByTitle)

    const ordered: typeof musicTracks = [...featured, ...mainCatalog, ...holidayTracks]
    const allTaggedCategories = Array.from(
      new Set(musicTracks.flatMap((t: (typeof musicTracks)[number]) => (t.tags || []) as string[]))
    ).filter(tag => (LIFE_CATEGORY_KEYS as readonly string[]).includes(tag))
    const tracksForPlayer: AudioTrack[] = ordered
      .filter((t: (typeof musicTracks)[number]) => t.preview_url)
      .map(t => ({
        id: t.id,
        title: t.title,
        artist: musicCatalogArtistFallback(t.id, t.album, { description: t.description, tags: t.tags }),
        performers: musicCatalogPerformerLinks(t.id, { description: t.description, tags: t.tags }),
        albumLabel: (t.album || '').trim() || undefined,
        duration: typeof t.duration_seconds === 'number' && isFinite(t.duration_seconds) ? t.duration_seconds : 0,
        url: t.preview_url,
        thumbnail: t.artwork_url || '',
        sectionKey: 'music',
        syncedLyrics: t.synced_lyrics || undefined,
        plainLyrics: t.plain_lyrics || undefined,
      }))
    return {
      musicTagCategories: allTaggedCategories,
      musicPlayerTracks: tracksForPlayer,
    }
  }, [contentType, musicTracks, musicCategoryFilter])

  const globalStoreIndex = useGlobalAudioStore(s => s.currentIndex)
  const globalStoreTrackIds = useGlobalAudioStore(s => s.tracks)
  const activeMusicCatalogId =
    contentType === 'music' && globalStoreTrackIds.length > 0
      ? globalStoreTrackIds[globalStoreIndex]?.id
      : null
  const activeMusicCatalogRow = activeMusicCatalogId
    ? musicTracks.find(m => m.id === activeMusicCatalogId)
    : null

  const saveAudioSetName = async () => {
    if (!selectedSet) return
    const name = audioSetNameDraft.trim()
    if (!name) {
      setIsEditingAudioSetName(false)
      return
    }
    if (name === (selectedSet.name || '').trim()) {
      setIsEditingAudioSetName(false)
      return
    }
    const supabase = createClient()
    const { error } = await supabase.from('audio_sets').update({ name }).eq('id', selectedSet.id)
    if (!error) await refreshAudioSets()
    setIsEditingAudioSetName(false)
  }

  if (visionLoading) {
    return <Container size="xl" className="py-8"><div className="flex min-h-[40vh] items-center justify-center"><Spinner size="lg" /></div></Container>
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <h1 className="sr-only">
          {contentType === 'playlists'
            ? 'My Playlists'
            : contentType === 'stories'
              ? 'Listen to Stories'
              : contentType === 'songs'
                ? 'My Songs'
                : contentType === 'music'
                  ? 'Listen to Music'
                  : 'Listen to Your Vision'}
        </h1>

        {/* ── Life Vision Player ── */}
        {contentType === 'life-vision' && (audioSets.length > 0 ? (
          <>
            {selectedAudioSetId && selectedSet ? (
              <div className="max-w-2xl mx-auto w-full">
                {loadingTracks ? (
                  <div className="rounded-2xl bg-embedded-panel border border-neutral-800 flex items-center justify-center py-12"><Spinner size="lg" /></div>
                ) : audioTracks.length > 0 ? (
                  <EmbeddedPlayer
                    tracks={audioTracks}
                    mapActivityType="vision_audio"
                    setName={getSetDisplayName(selectedSet)}
                    setIconKey="life_vision"
                    contentCategory="life_vision"
                    voiceId={selectedSet.voice_id}
                    mixDetails={(() => {
                      const md = selectedSet.metadata as any
                      const voiceVol = md?.voice_volume as number | undefined
                      const bgVol = md?.bg_volume as number | undefined
                      const freqVol = (md?.frequency_volume ?? md?.binaural_volume) as number | undefined
                      return {
                        voiceName: selectedSet.variant === 'personal' ? 'Personal' : getVoiceDisplayName(selectedSet.voice_id),
                        voiceVolume: voiceVol,
                        backgroundName: selectedSet.backgroundTrack,
                        bgVolume: bgVol,
                        binauralName: selectedSet.frequencyTrack,
                        binauralVolume: freqVol,
                      } as MixDetails
                    })()}
                    headerContent={
                      <div>
                        <div className="bg-[#0c0c0c] px-3 pt-3 pb-2.5 md:px-4 border-b border-neutral-800/50">
                          <h3 className="text-center text-lg font-semibold text-white">Play My Vision</h3>

                          <ListenPracticeStatsRow
                            practiceStats={practiceStats}
                            totalPlays={totalPlays}
                            totalSets={totalSets}
                            totalTracks={totalTracks}
                            statsExpanded={statsExpanded}
                            setStatsExpanded={setStatsExpanded}
                            freezeOpen={freezeOpen}
                            setFreezeOpen={setFreezeOpen}
                            freezeRef={freezeRef}
                          />
                        </div>

                        <div className="bg-embedded-panel px-3 py-2.5 md:px-4">
                        <div className="relative">
                          {isEditingAudioSetName ? (
                            <input
                              type="text"
                              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                              value={audioSetNameDraft}
                              onChange={e => setAudioSetNameDraft(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') { e.preventDefault(); void saveAudioSetName() }
                                if (e.key === 'Escape') { e.preventDefault(); setAudioSetNameDraft(getSetDisplayName(selectedSet)); setIsEditingAudioSetName(false) }
                              }}
                              onBlur={() => { void saveAudioSetName() }}
                              autoFocus
                              aria-label="Audio set name"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                              className="flex w-full min-h-11 items-center justify-between gap-2 rounded-[10px] border border-white/10 bg-white/[0.04] px-2.5 py-2 text-left text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] transition-[background-color,border-color] active:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:ring-offset-0 sm:px-3"
                            >
                              <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
                                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] sm:h-9 sm:w-9 sm:rounded-lg ${getVariantColor(selectedSet)}`}>
                                  {getVariantIcon(selectedSet)}
                                </div>
                                {(() => {
                                  const label = getSetDisplayName(selectedSet)
                                  const { primary, secondary } = getAudioSetPickerLines(label)
                                  return (
                                    <div className="min-w-0 flex-1 text-left">
                                      {secondary ? (
                                        <>
                                          <p className="line-clamp-1 text-[13px] font-medium leading-tight text-white/95 sm:text-sm">{primary}</p>
                                          <p className="mt-0.5 line-clamp-1 text-[11px] leading-snug text-neutral-500 sm:text-xs">{secondary}</p>
                                        </>
                                      ) : (
                                        <p className="line-clamp-2 text-[13px] font-medium leading-snug text-white/95 sm:text-sm sm:leading-tight">{primary}</p>
                                      )}
                                    </div>
                                  )
                                })()}
                              </div>
                              <ChevronDown className={`h-3.5 w-3.5 shrink-0 self-center text-neutral-500 sm:h-4 sm:w-4 ${isDropdownOpen ? 'rotate-180' : ''} transition-transform duration-200`} aria-hidden />
                            </button>
                          )}

                          {isDropdownOpen && !isEditingAudioSetName && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                              <div className="absolute left-0 right-0 z-20 mt-2 max-h-64 overflow-hidden rounded-xl border border-neutral-700/80 bg-[#1A1A1A] shadow-2xl">
                                <div className="max-h-[min(50vh,16rem)] overflow-y-auto overscroll-contain py-1">
                                  {[...audioSets].sort((a, b) => {
                                    if (a.id === selectedAudioSetId) return -1
                                    if (b.id === selectedAudioSetId) return 1
                                    return 0
                                  }).map(set => {
                                    const isSelected = selectedAudioSetId === set.id
                                    return (
                                      <div
                                        key={set.id}
                                        onClick={() => { if (set.isReady) { handleSelectSet(set.id); setIsDropdownOpen(false) } }}
                                        className={[
                                          'group/row flex w-full items-center gap-2.5 px-3 py-1.5 text-left transition-colors',
                                          isSelected ? 'bg-[#39FF14]/10' : 'hover:bg-neutral-800',
                                          set.isReady ? 'cursor-pointer' : 'cursor-not-allowed opacity-45',
                                        ].join(' ')}
                                      >
                                        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded ${getVariantColor(set)}`}>
                                          {getVariantIcon(set)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="truncate text-sm text-white">{getSetDisplayName(set)}</p>
                                          <p className="text-xs text-neutral-500 leading-tight">
                                            {set.track_count} {set.track_count === 1 ? 'track' : 'tracks'}
                                            {' · '}{new Date(set.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                          </p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2">
                                          {isSelected && <CheckCircle className="h-4 w-4 text-[#39FF14] flex-shrink-0" />}
                                          <button
                                            type="button"
                                            onClick={e => { e.stopPropagation(); handleDelete(set.id, set.name); setIsDropdownOpen(false) }}
                                            className="text-neutral-600 transition-colors hover:text-[#FF0040]"
                                            aria-label="Delete audio set"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={e => { e.stopPropagation(); setIsDropdownOpen(false); setIsEditingAudioSetName(true); setAudioSetNameDraft(getSetDisplayName(set)); if (set.id !== selectedAudioSetId) handleSelectSet(set.id) }}
                                            className="text-neutral-600 transition-colors hover:text-white"
                                            aria-label="Rename audio set"
                                          >
                                            <Edit2 className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        </div>
                      </div>
                    }
                    onAddToPlaylist={(track) => handleAddToPlaylist(track, 'life_vision')}
                  />
                ) : (
                  <Card variant="glass" className="p-8 text-center">
                    <Music className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                    <p className="text-neutral-400">No audio tracks available for this set</p>
                  </Card>
                )}
              </div>
            ) : (
              <div className="max-w-2xl mx-auto w-full rounded-2xl bg-embedded-panel border border-neutral-800 p-6 text-center">
                <Headphones className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                <p className="text-neutral-400 text-sm">Select an audio set to play</p>
              </div>
            )}
          </>
        ) : !audioSetsLoading ? (
          <Card variant="elevated" className="p-8 md:p-12 text-center">
            <Headphones className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Vision Audio Yet</h3>
            <p className="text-neutral-400 mb-6">Create your first audio set to bring your vision to life through sound.</p>
            <Button variant="primary" asChild>
              <Link href="/audio/create"><Plus className="w-4 h-4 mr-2" />Create Vision Audio</Link>
            </Button>
          </Card>
        ) : null)}

        {/* ── Stories ── */}
        {contentType === 'stories' && (
          <section>
            {storiesLoading ? (
              <div className="flex items-center justify-center py-8"><Spinner size="md" /></div>
            ) : filteredStories.length === 0 ? (
              <Card variant="glass" className="p-6 text-center">
                <BookOpen className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
                <p className="text-neutral-400 mb-4">
                  {stories.length === 0 ? 'No stories with audio yet. Create one to immerse in your vision.' : 'No stories match this filter.'}
                </p>
                {stories.length === 0 && (
                  <Button variant="primary" size="sm" asChild>
                    <Link href="/story/new"><Plus className="w-4 h-4 mr-2" />Create Story</Link>
                  </Button>
                )}
              </Card>
            ) : (
              <div className="max-w-2xl mx-auto w-full">
                {storyAudioLoading ? (
                  <div className="rounded-2xl bg-embedded-panel border border-neutral-800 flex items-center justify-center py-12"><Spinner size="lg" /></div>
                ) : allStoriesPlayerTracks.length === 0 ? (
                  <div className="text-center py-6 rounded-2xl border border-neutral-800">
                    <Volume2 className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                    <p className="text-sm text-neutral-400">No audio available for these stories</p>
                    <Button variant="primary" size="sm" className="mt-3" asChild>
                      <Link href="/audio/create">Create Audio</Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    <EmbeddedPlayer
                      tracks={allStoriesPlayerTracks}
                      mapActivityType="story_audio"
                      setName="My Stories"
                      setIconKey="stories"
                      contentCategory="story"
                      trackCount={allStoriesPlayerTracks.length}
                      nowPlayingAccessory={
                        playingStory ? (
                          <Link
                            href={`/story/${playingStory.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary-400 transition-colors hover:text-primary-300"
                          >
                            <Library className="w-3.5 h-3.5" />
                            View Story
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : undefined
                      }
                      headerContent={
                        <div>
                          <div className="bg-[#0c0c0c] px-3 pt-3 pb-2.5 md:px-4 border-b border-neutral-800/50">
                            <h3 className="text-center text-lg font-semibold text-white">Play My Stories</h3>
                            <p className="text-center text-xs text-neutral-500 mt-1">
                              {filteredStories.length} {filteredStories.length === 1 ? 'story' : 'stories'}
                              {' · '}{allStoriesPlayerTracks.length} {allStoriesPlayerTracks.length === 1 ? 'track' : 'tracks'}
                            </p>

                            <ListenPracticeStatsRow
                              practiceStats={practiceStats}
                              totalPlays={totalPlays}
                              totalSets={totalSets}
                              totalTracks={totalTracks}
                              statsExpanded={statsExpanded}
                              setStatsExpanded={setStatsExpanded}
                              freezeOpen={freezeOpen}
                              setFreezeOpen={setFreezeOpen}
                              freezeRef={freezeRef}
                            />
                          </div>

                          {selectedStory && (
                          <div className="bg-embedded-panel px-3 py-2.5 md:px-4">
                            <div className="relative w-full" ref={storyDropdownRef}>
                              <button
                                type="button"
                                onClick={() => setStoryDropdownOpen(prev => !prev)}
                                className="flex w-full min-h-11 items-center justify-between gap-2 rounded-[10px] border border-white/10 bg-white/[0.04] px-2.5 py-2 text-left text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] transition-[background-color,border-color] active:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-primary-500/25 sm:px-3"
                              >
                                <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0">
                                  {(() => {
                                    const meta = ENTITY_META[selectedStory.entity_type] || ENTITY_META.custom!
                                    return (
                                      <div className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg ${meta.badgeColor.split(' ').slice(0, 2).join(' ')}`}>
                                        <meta.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                      </div>
                                    )
                                  })()}
                                  <div className="min-w-0 flex-1 text-left">
                                    <p className="line-clamp-2 text-[13px] font-medium leading-snug text-white/95 sm:text-sm">{selectedStory.title || 'Untitled Story'}</p>
                                    {(() => {
                                      const meta = ENTITY_META[selectedStory.entity_type] || ENTITY_META.custom!
                                      return (
                                        <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-neutral-500 sm:text-xs">
                                          <meta.icon className="w-3 h-3" />
                                          {meta.label}
                                        </span>
                                      )
                                    })()}
                                  </div>
                                </div>
                                <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-neutral-500 sm:h-4 sm:w-4 ${storyDropdownOpen ? 'rotate-180' : ''} transition-transform duration-200`} />
                              </button>
                              {storyDropdownOpen && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setStoryDropdownOpen(false)} />
                                  <div className="absolute z-20 left-0 right-0 mt-2 max-h-64 overflow-y-auto overscroll-contain rounded-xl border border-neutral-700/80 bg-embedded-panel py-1 shadow-2xl">
                                    {filteredStories.map(story => {
                                      const isSelected = story.id === selectedStoryId
                                      const meta = ENTITY_META[story.entity_type] || ENTITY_META.custom!
                                      const cats = (story.metadata?.selected_categories || []) as string[]
                                      const storyTrackCount = allStoriesPlayerTracks.filter(t => t.id.startsWith(`${story.id}:`)).length
                                      return (
                                        <div
                                          key={story.id}
                                          onClick={() => { if (storyTrackCount > 0) jumpToStoryInPlayer(story.id) }}
                                          className={[
                                            'px-3 py-2.5 text-left transition-colors',
                                            isSelected ? 'bg-primary-500/10' : 'hover:bg-neutral-800/80',
                                            storyTrackCount > 0 ? 'cursor-pointer' : '',
                                          ].join(' ')}
                                        >
                                          <div className="flex items-center gap-2.5">
                                            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded ${meta.badgeColor.split(' ').slice(0, 2).join(' ')}`}>
                                              <meta.icon className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <div className="flex items-start gap-2">
                                                <p className="min-w-0 flex-1 truncate text-sm text-white">
                                                  {story.title || 'Untitled Story'}
                                                </p>
                                                {storyTrackCount === 0 && (
                                                  <Link
                                                    href={`/audio/generate?source=story&sourceId=${story.id}`}
                                                    onClick={e => {
                                                      e.stopPropagation()
                                                      setStoryDropdownOpen(false)
                                                    }}
                                                    className="hidden shrink-0 items-center gap-1 rounded-full border border-primary-500/30 bg-primary-500/10 px-2 py-0.5 text-[10px] font-medium text-primary-400 transition-colors hover:border-primary-500/50 hover:bg-primary-500/15 hover:text-primary-300 md:inline-flex"
                                                  >
                                                    <AlertTriangle className="h-3 w-3 shrink-0 text-[#FFFF00]" aria-hidden />
                                                    <span className="text-neutral-400">No audio yet</span>
                                                    <span className="text-primary-500/50" aria-hidden>·</span>
                                                    <span>Create Audio</span>
                                                  </Link>
                                                )}
                                              </div>
                                              {storyTrackCount > 0 ? (
                                                <p className="text-[11px] text-neutral-500 mt-0.5">
                                                  {storyTrackCount} {storyTrackCount === 1 ? 'track' : 'tracks'} in playlist
                                                </p>
                                              ) : (
                                                <Link
                                                  href={`/audio/generate?source=story&sourceId=${story.id}`}
                                                  onClick={e => {
                                                    e.stopPropagation()
                                                    setStoryDropdownOpen(false)
                                                  }}
                                                  className="mt-1.5 inline-flex max-w-full items-center gap-1 rounded-full border border-primary-500/30 bg-primary-500/10 px-2 py-0.5 text-[10px] font-medium text-primary-400 transition-colors hover:border-primary-500/50 hover:bg-primary-500/15 hover:text-primary-300 md:hidden"
                                                >
                                                  <AlertTriangle className="h-3 w-3 shrink-0 text-[#FFFF00]" aria-hidden />
                                                  <span className="text-neutral-400">No audio yet</span>
                                                  <span className="text-primary-500/50" aria-hidden>·</span>
                                                  <span>Create Audio</span>
                                                </Link>
                                              )}
                                              <div className="mt-0.5 flex flex-wrap items-center gap-1">
                                                {cats.map(key => {
                                                  const cat = VISION_CATEGORIES.find(c => c.key === key)
                                                  if (!cat) return null
                                                  return (
                                                    <span key={key} className="inline-flex text-[10px] px-1.5 py-0.5 rounded-full border border-neutral-600/50 text-neutral-300 bg-neutral-800/50">
                                                      {cat.label}
                                                    </span>
                                                  )
                                                })}
                                              </div>
                                              <p className="text-xs text-neutral-500 mt-0.5">
                                                {story.word_count ? `${story.word_count} words` : ''}
                                                {story.word_count ? ' \u00b7 ' : ''}
                                                {new Date(story.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                              </p>
                                            </div>
                                            {storyTrackCount > 0 && isSelected && (
                                              <CheckCircle className="h-4 w-4 shrink-0 text-primary-500" />
                                            )}
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          )}
                        </div>
                      }
                      onAddToPlaylist={(track) => handleAddToPlaylist(track, 'story')}
                    />
                  </>
                )}
              </div>
            )}
          </section>
        )}

        {/* ── Songs ── */}
        {contentType === 'songs' && (
          <section>
            {userSongsLoading ? (
              <div className="flex items-center justify-center py-12"><Spinner size="lg" /></div>
            ) : userSongs.length === 0 ? (
              <Card variant="glass" className="p-6 text-center">
                <Music2 className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
                <p className="text-neutral-400 mb-4">No songs yet. Create one with the Songwriter.</p>
                <Button variant="primary" size="sm" asChild>
                  <Link href="/audio/songwriter"><Plus className="w-4 h-4 mr-2" />Create Song</Link>
                </Button>
              </Card>
            ) : (
              <div className="w-full lg:grid lg:grid-cols-[minmax(0,20rem)_minmax(0,42rem)_minmax(0,20rem)] lg:gap-6 lg:justify-center">
                <div className="hidden lg:block" />
                <div className="max-w-2xl mx-auto w-full lg:mx-0 lg:max-w-none">
                {songTracksLoading ? (
                  <div className="rounded-2xl bg-embedded-panel border border-neutral-800 flex items-center justify-center py-12"><Spinner size="lg" /></div>
                ) : selectedSongId && songTracks.length > 0 ? (
                  <>
                  <EmbeddedPlayer
                    tracks={songTracks}
                    mapActivityType="song_listen"
                    setName={userSongs.find(s => s.id === selectedSongId)?.title || 'Song'}
                    setIconKey="music"
                    contentCategory="music"
                    trackCount={songTracks.length}
                    trackFavorites={songTrackFavorites}
                    enableArtworkLightbox
                    onToggleFavorite={(track) => handleSongToggleFavorite(track)}
                    trackLibraryState={songTrackLibrary}
                    onAddToLibrary={(track) => handleSongAddToLibrary(track)}
                    onSubmitForPublishing={(track) => handleSongSubmitForPublishing(track)}
                    onRemoveTrack={(track) => setSongDeleteTarget(track)}
                    headerContent={
                      <div>
                        <div className="bg-[#0c0c0c] px-3 pt-3 pb-2.5 md:px-4 border-b border-neutral-800/50">
                          <h3 className="text-center text-lg font-semibold text-white">Play My Songs</h3>
                          <p className="text-center text-xs text-neutral-500 mt-1">
                            {userSongs.length} {userSongs.length === 1 ? 'song' : 'songs'}
                          </p>
                        </div>
                        <div className="bg-embedded-panel px-3 py-2.5 md:px-4">
                          <div className="relative w-full">
                            <button
                              type="button"
                              onClick={() => setSongDropdownOpen(prev => !prev)}
                              className="flex w-full min-h-11 items-center justify-between gap-2 rounded-[10px] border border-white/10 bg-white/[0.04] px-2.5 py-2 text-left text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] transition-[background-color,border-color] active:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-primary-500/25 sm:px-3"
                            >
                              <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0">
                                <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-[#39FF14]/10">
                                  <Music2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#39FF14]" />
                                </div>
                                <div className="min-w-0 flex-1 text-left">
                                  <p className="line-clamp-2 text-[13px] font-medium leading-snug text-white/95 sm:text-sm">
                                    {userSongs.find(s => s.id === selectedSongId)?.title || 'Untitled Song'}
                                  </p>
                                  <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-neutral-500 sm:text-xs">
                                    {songTracks.length} version{songTracks.length !== 1 ? 's' : ''}
                                    {' · '}{new Date(userSongs.find(s => s.id === selectedSongId)?.created_at || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                              </div>
                              <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-neutral-500 sm:h-4 sm:w-4 ${songDropdownOpen ? 'rotate-180' : ''} transition-transform duration-200`} />
                            </button>
                            {songDropdownOpen && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setSongDropdownOpen(false)} />
                                <div className="absolute z-20 left-0 right-0 mt-2 max-h-64 overflow-y-auto overscroll-contain rounded-xl border border-neutral-700/80 bg-embedded-panel py-1 shadow-2xl">
                                  {userSongs.map(song => {
                                    const isSelected = song.id === selectedSongId
                                    const meta = ENTITY_META[song.entity_type] || ENTITY_META.custom!
                                    return (
                                      <div
                                        key={song.id}
                                        onClick={() => { setSelectedSongId(song.id); setSongDropdownOpen(false) }}
                                        className={`px-3 py-2.5 text-left transition-colors cursor-pointer ${isSelected ? 'bg-primary-500/10' : 'hover:bg-neutral-800/80'}`}
                                      >
                                        <div className="flex items-center gap-2.5">
                                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#39FF14]/10">
                                            <Music2 className="w-3 h-3 text-[#39FF14]" />
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <p className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-neutral-200'}`}>
                                              {song.title || 'Untitled Song'}
                                            </p>
                                            <p className="text-[11px] text-neutral-500">
                                              <span className="inline-flex items-center gap-1">
                                                <meta.icon className="w-3 h-3" />
                                                {meta.label}
                                              </span>
                                              {' · '}{new Date(song.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                          </div>
                                          {isSelected && <CheckCircle className="w-4 h-4 text-primary-400 shrink-0" />}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </>
                            )}
                          </div>
                          <div className="mt-3 flex flex-col items-center gap-2">
                            <Link
                              href={`/audio/songwriter/${selectedSongId}`}
                              className="inline-flex items-center gap-1.5 text-sm text-neutral-400 transition-colors hover:text-white"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              Create More Versions
                            </Link>
                            {selectedSong?.lyrics && (
                              <button
                                type="button"
                                onClick={() => setAlbumArtModalOpen(true)}
                                className="inline-flex items-center gap-1.5 text-sm text-neutral-400 transition-colors hover:text-white"
                              >
                                <Image className="h-3.5 w-3.5" />
                                {songTracks.some(t => t.thumbnail) ? 'Change Album Art' : 'Add Album Art'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    }
                  />
                  {/* Mobile: synced lyrics below player */}
                  {(() => {
                    const activeTrack = songTracks.find((_, i) => {
                      const isSongPlaylistActive = storeTracks.length === songTracks.length && songTracks.length > 0 && storeTracks[0]?.id === songTracks[0]?.id
                      return isSongPlaylistActive ? i === storeIndex : i === 0
                    })
                    const selectedSong = userSongs.find(s => s.id === selectedSongId)
                    const syncedLyrics = activeTrack?.syncedLyrics
                    const plainLyrics = selectedSong?.lyrics as string | undefined
                    if (!syncedLyrics && !plainLyrics) return null
                    return (
                      <div className="lg:hidden mt-4">
                        {syncedLyrics ? (
                          <SyncedLyricsDisplay syncedLyrics={syncedLyrics as SyncedLyrics} plainText={plainLyrics} />
                        ) : plainLyrics ? (
                          <PlainLyricsDisplay lyrics={plainLyrics} />
                        ) : null}
                      </div>
                    )
                  })()}
                  </>
                ) : (
                  <Card variant="glass" className="p-6 text-center">
                    <Music2 className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                    <p className="text-sm text-neutral-400">Select a song to play</p>
                  </Card>
                )}
                </div>
                {/* Desktop: synced lyrics to the right */}
                <div className="hidden lg:block sticky top-4 self-start">
                  {(() => {
                    const activeTrack = songTracks.find((_, i) => {
                      const isSongPlaylistActive = storeTracks.length === songTracks.length && songTracks.length > 0 && storeTracks[0]?.id === songTracks[0]?.id
                      return isSongPlaylistActive ? i === storeIndex : i === 0
                    })
                    const selectedSong = userSongs.find(s => s.id === selectedSongId)
                    const syncedLyrics = activeTrack?.syncedLyrics
                    const plainLyrics = selectedSong?.lyrics as string | undefined
                    if (!syncedLyrics && !plainLyrics) return null
                    return syncedLyrics ? (
                      <SyncedLyricsDisplay syncedLyrics={syncedLyrics as SyncedLyrics} plainText={plainLyrics} />
                    ) : plainLyrics ? (
                      <PlainLyricsDisplay lyrics={plainLyrics} />
                    ) : null
                  })()}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Music Catalog ── */}
        {contentType === 'music' && (
          <section>
            {musicLoading ? (
              <div className="flex items-center justify-center py-12"><Spinner size="lg" /></div>
            ) : musicPlayerTracks.length === 0 ? (
              <div className="max-w-2xl mx-auto w-full">
                <div className="rounded-2xl border border-neutral-800 bg-embedded-panel overflow-hidden">
                  <div className="bg-black/40 px-3 pt-3 pb-2.5 md:px-4 border-b border-neutral-800/50">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-white">Vibration Fit Music</h3>
                      <MusicCategoryDropdown
                        value={musicCategoryFilter}
                        onChange={setMusicCategoryFilter}
                        categories={musicTagCategories}
                      />
                    </div>
                  </div>
                  <div className="p-6 text-center">
                    <Music2 className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
                    {musicCategoryFilter === 'member-library' ? (
                      <>
                        <p className="text-sm text-neutral-400">Your member library is empty.</p>
                        <p className="text-xs text-neutral-500 mt-1">Add tracks from My Songs using the 3-dot menu.</p>
                      </>
                    ) : musicCategoryFilter === 'published' ? (
                      <>
                        <p className="text-sm text-neutral-400">No published songs yet.</p>
                        <p className="text-xs text-neutral-500 mt-1">Songs submitted and approved for publishing will appear here.</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-neutral-400">No music available for this filter.</p>
                        <p className="text-xs text-neutral-500 mt-1">Try another category.</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full lg:grid lg:grid-cols-[minmax(0,20rem)_minmax(0,42rem)_minmax(0,20rem)] lg:gap-6 lg:justify-center">
                {/* Left spacer on desktop grid */}
                <div className="hidden lg:block" />
                {/* Centered player */}
                <div className="max-w-2xl mx-auto w-full lg:mx-0 lg:max-w-none">
                  <EmbeddedPlayer
                    tracks={musicPlayerTracks}
                    mapActivityType="music_listen"
                    setName="Vibration Fit Music"
                    setIconKey="music"
                    contentCategory="music"
                    trackCount={musicPlayerTracks.length}
                    enableArtworkLightbox
                    onAddToPlaylist={(track) => handleAddToPlaylist(track, 'music')}
                    headerContent={
                    <div>
                      <div className="bg-black/40 px-3 pt-3 pb-2.5 md:px-4 border-b border-neutral-800/50">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-lg font-semibold text-white">Vibration Fit Music</h3>
                          <MusicCategoryDropdown
                            value={musicCategoryFilter}
                            onChange={setMusicCategoryFilter}
                            categories={musicTagCategories}
                          />
                        </div>
                        {(() => {
                          const streamingTrack = musicTracks.find((t: any) =>
                            t.spotify_url || t.apple_music_url || t.amazon_music_url || t.youtube_music_url || t.soundcloud_url
                          )
                          if (!streamingTrack) return null
                          return (
                            <div className="flex items-center justify-center gap-1.5 flex-wrap mt-2.5">
                              <MusicStreamingLinks track={streamingTrack} />
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                    }
                  />
                  {/* Mobile: lyrics below player */}
                  {activeMusicCatalogRow && (activeMusicCatalogRow.synced_lyrics || activeMusicCatalogRow.plain_lyrics) && (
                    <div className="lg:hidden mt-4">
                      {activeMusicCatalogRow.synced_lyrics ? (
                        <SyncedLyricsDisplay
                          syncedLyrics={activeMusicCatalogRow.synced_lyrics}
                          plainText={activeMusicCatalogRow.plain_lyrics || undefined}
                        />
                      ) : activeMusicCatalogRow.plain_lyrics ? (
                        <PlainLyricsDisplay
                          lyrics={activeMusicCatalogRow.plain_lyrics}
                        />
                      ) : null}
                    </div>
                  )}
                </div>
                {/* Desktop: lyrics to the right */}
                <div className="hidden lg:block sticky top-4 self-start">
                  {activeMusicCatalogRow && (activeMusicCatalogRow.synced_lyrics || activeMusicCatalogRow.plain_lyrics) ? (
                    activeMusicCatalogRow.synced_lyrics ? (
                      <SyncedLyricsDisplay
                        syncedLyrics={activeMusicCatalogRow.synced_lyrics}
                        plainText={activeMusicCatalogRow.plain_lyrics || undefined}
                      />
                    ) : activeMusicCatalogRow.plain_lyrics ? (
                      <PlainLyricsDisplay
                        lyrics={activeMusicCatalogRow.plain_lyrics}
                      />
                    ) : null
                  ) : null}
                </div>
              </div>
            )}
          </section>
        )}

        {/* -- Playlists -- */}
        {contentType === 'playlists' && (
          <section>
            <PlaylistsView />
          </section>
        )}

      </Stack>

      <AddToPlaylistSheet
        isOpen={playlistSheetOpen}
        onClose={() => setPlaylistSheetOpen(false)}
        track={playlistSheetTrack}
        sourceType={playlistSheetSourceType}
        sourceId={playlistSheetSourceId}
      />

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => { setShowDeleteDialog(false); setSetToDelete(null) }}
        onConfirm={confirmDelete}
        itemName={setToDelete?.name || ''}
        itemType="Audio Set"
        isLoading={deleting === setToDelete?.id}
        loadingText="Deleting audio set..."
      />

      <DeleteConfirmationDialog
        isOpen={!!songDeleteTarget}
        onClose={() => setSongDeleteTarget(null)}
        onConfirm={handleSongDeleteTrack}
        title="Delete Track"
        message="Are you sure you want to delete this track version? This action cannot be undone."
        itemName={songDeleteTarget?.versionLabel || undefined}
        isDeleting={songDeleting}
      />

      {selectedSongId && selectedSong?.lyrics && (
        <AlbumArtModal
          isOpen={albumArtModalOpen}
          onClose={() => setAlbumArtModalOpen(false)}
          songId={selectedSongId}
          songTitle={selectedSong.title || 'Untitled Song'}
          lyrics={selectedSong.lyrics}
          currentCoverUrl={songTracks.find(t => t.thumbnail)?.thumbnail || null}
          onArtGenerated={(imageUrl) => {
            setSongTracks(prev => prev.map(t => ({ ...t, thumbnail: imageUrl })))
          }}
        />
      )}

      {publishSheetTrack && (
        <SubmitForPublishingSheet
          isOpen={publishSheetOpen}
          onClose={() => { setPublishSheetOpen(false); setPublishSheetTrack(null) }}
          songId={publishSheetTrack.songId}
          trackId={publishSheetTrack.trackId}
          trackTitle={publishSheetTrack.title}
        />
      )}

    </Container>
  )
}
