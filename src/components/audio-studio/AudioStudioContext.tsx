'use client'

import React, { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { keys } from '@/lib/query/keys'
import type { AudioTrack } from '@/lib/design-system/components/media/types'
import type { Story } from '@/lib/stories/types'

type AudioSourceType = 'life_vision' | 'story' | null

interface VisionData {
  id: string
  household_id?: string | null
  version_number: number
  is_active: boolean
  is_draft: boolean
  created_at: string
  title?: string
  /** false when the vision belongs to another household member (shared with you) */
  is_mine?: boolean
  /** true for "Life We Choose" household visions */
  is_household?: boolean
  [key: string]: any
}

interface AudioSetItem {
  id: string
  name: string
  description: string
  variant: string
  voice_id: string
  is_active: boolean
  created_at: string
  track_count: number
  isReady: boolean
  isMixing: boolean
  mixRatio?: string
  backgroundTrack?: string
  frequencyTrack?: string
  frequencyType?: 'pure' | 'solfeggio_binaural' | 'binaural'
  metadata?: any
}

interface QueueBatch {
  id: string
  vision_id: string
  status: string
  tracks_completed: number
  tracks_failed: number
  total_tracks_expected: number
  voice_id: string
  variant_ids: string[]
  created_at: string
  metadata?: Record<string, any>
  content_type?: string
  content_id?: string
}

interface PlayerState {
  tracks: AudioTrack[]
  currentIndex: number
  isPlaying: boolean
  setName?: string
  setIcon?: React.ReactNode
}

interface ActivationChecklist {
  hasMainVisionAudio: boolean
  hasFocusStoryWithAudio: boolean
  hasPersonalRecording: boolean
}

interface AudioStudioContextValue {
  visionId: string | null
  vision: VisionData | null
  allVisions: VisionData[]
  visionLoading: boolean
  switchVision: (id: string) => void
  checklist: ActivationChecklist
  audioSets: AudioSetItem[]
  audioSetsLoading: boolean
  refreshAudioSets: () => Promise<void>
  activeBatches: QueueBatch[]
  activeBatchCount: number
  refreshBatches: () => Promise<void>
  activePill: string
  setActivePill: (value: string) => void
  listenContentType: string
  setListenContentType: (value: string) => void
  listenStoryFilter: string
  setListenStoryFilter: (value: string) => void
  storiesWithAudio: Story[]
  storiesWithAudioLoading: boolean
  player: PlayerState
  playTracks: (tracks: AudioTrack[], startIndex?: number, setName?: string) => void
  pausePlayer: () => void
  resumePlayer: () => void
  stopPlayer: () => void
  seekTo: (time: number) => void
  skipNext: () => void
  skipPrev: () => void
  audioRef: React.RefObject<HTMLAudioElement | null>
  currentTime: number
  duration: number
  sourceType: AudioSourceType
  sourceId: string | null
  setSource: (type: AudioSourceType, id: string | null) => void
  allStories: Story[]
  allStoriesLoading: boolean
  allBatches: QueueBatch[]
  allBatchesLoading: boolean
  refreshAllBatches: () => Promise<void>
}

const LISTEN_PATH_MAP: Record<string, string> = {
  '/audio': 'life-vision',
  '/audio/stories': 'stories',
  '/audio/songs': 'songs',
  '/audio/music': 'music',
  '/audio/playlists': 'playlists',
}

const AudioStudioContext = createContext<AudioStudioContextValue | null>(null)

export function useAudioStudio() {
  const ctx = useContext(AudioStudioContext)
  if (!ctx) throw new Error('useAudioStudio must be used within AudioStudioProvider')
  return ctx
}

// Child keys under registry prefixes so table-level realtime invalidation
// refetches them automatically.
const publishedVisionsKey = [...keys.visions, 'published'] as const
const storyAudioChecklistKey = [...keys.stories, 'audio-checklist'] as const
const storiesWithAudioKey = [...keys.stories, 'with-audio'] as const
const completedStoriesKey = [...keys.stories, 'completed-mine'] as const
const visionAudioSetsKey = (visionId: string) => [...keys.audioSets, 'life-vision', visionId] as const
const visionBatchesKey = (visionId: string) => [...keys.audioBatches, 'vision', visionId] as const
const allBatchesKey = [...keys.audioBatches, 'all'] as const

const BATCH_POLL_FALLBACK_MS = 15_000

function hasPendingBatches(batches: QueueBatch[] | undefined): boolean {
  return (batches ?? []).some(b => ['pending', 'processing'].includes(b.status))
}

async function fetchPublishedVisions(): Promise<VisionData[]> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return []

  // No user_id filter: RLS returns own visions plus household-shared ones
  // ("Life We Choose" joint visions and any personal visions a household
  // member shares, explicitly or via share-all).
  const { data: versions } = await supabase
    .from('vision_versions')
    .select('*')
    .eq('is_draft', false)
    .order('created_at', { ascending: false })

  if (!versions || versions.length === 0) return []

  // Version numbers count within each document group: personal visions
  // ("Life I Choose") and household visions ("Life We Choose") each start at 1.
  const groupCounts: Record<string, number> = {}
  for (const v of versions) {
    const groupKey = v.household_id ? `hh:${v.household_id}` : `me:${v.user_id}`
    groupCounts[groupKey] = (groupCounts[groupKey] || 0) + 1
  }
  const groupSeen: Record<string, number> = {}
  return versions.map((v) => {
    const groupKey = v.household_id ? `hh:${v.household_id}` : `me:${v.user_id}`
    groupSeen[groupKey] = (groupSeen[groupKey] || 0) + 1
    return {
      ...v,
      version_number: groupCounts[groupKey] - groupSeen[groupKey] + 1,
      is_mine: v.user_id === user.id,
      is_household: !!v.household_id,
    }
  })
}

async function fetchHasFocusStoryWithAudio(): Promise<boolean> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return false

  const { count } = await supabase
    .from('stories')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .not('audio_set_id', 'is', null)
    .eq('status', 'completed')

  return (count || 0) > 0
}

async function fetchAudioSets(visionId: string): Promise<AudioSetItem[]> {
  const supabase = createClient()

  const { data: sets } = await supabase
    .from('audio_sets')
    .select('*, audio_tracks(count)')
    .eq('vision_id', visionId)
    .eq('content_type', 'life_vision')
    .order('created_at', { ascending: false })

  if (!sets) return []

  return Promise.all(sets.map(async (set: any) => {
    const { data: tracks } = await supabase
      .from('audio_tracks')
      .select('mix_status, status')
      .eq('audio_set_id', set.id)
      .limit(1)

    const hasCompletedVoice = tracks?.some((t: any) => t.status === 'completed')
    const hasCompletedMixing = tracks?.some((t: any) => t.mix_status === 'completed')
    const isMixing = tracks?.some((t: any) => t.mix_status === 'mixing' || t.mix_status === 'pending')

    let mixRatio: string | undefined
    let backgroundTrack: string | undefined
    let frequencyTrack: string | undefined
    let frequencyType: AudioSetItem['frequencyType']

    if (set.metadata) {
      const md = set.metadata as any
      const voiceVol = md.voice_volume
      const bgVol = md.bg_volume
      const freqVol = md.frequency_volume ?? md.binaural_volume

      if (voiceVol !== undefined && bgVol !== undefined) {
        mixRatio = freqVol && freqVol > 0
          ? `${voiceVol}% / ${bgVol}% / ${freqVol}%`
          : `${voiceVol}% / ${bgVol}%`
      }
      backgroundTrack = md.background_track_name
      frequencyTrack = md.frequency_track_name ?? md.binaural_track_name
      frequencyType = md.frequency_type
    }

    return {
      id: set.id,
      name: set.name,
      description: set.description || '',
      variant: set.variant,
      voice_id: set.voice_id,
      is_active: set.is_active,
      created_at: set.created_at,
      track_count: set.audio_tracks?.[0]?.count || 0,
      isReady: !!(hasCompletedVoice && (set.variant === 'standard' || set.variant === 'personal' || hasCompletedMixing)),
      isMixing: !!isMixing,
      mixRatio,
      backgroundTrack,
      frequencyTrack,
      frequencyType,
      metadata: set.metadata,
    } as AudioSetItem
  }))
}

async function fetchVisionBatches(visionId: string): Promise<QueueBatch[]> {
  const supabase = createClient()
  const { data: batches } = await supabase
    .from('audio_generation_batches')
    .select('*')
    .eq('vision_id', visionId)
    .order('created_at', { ascending: false })
    .limit(20)
  return batches ?? []
}

async function fetchAllBatches(): Promise<QueueBatch[]> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return []

  const { data: batches } = await supabase
    .from('audio_generation_batches')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)
  return batches ?? []
}

async function fetchStoriesWithAudio(): Promise<Story[]> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return []

  // Get stories with direct audio links. No user_id filter: RLS also returns
  // household-shared stories, whose audio follows the story.
  const { data: directStories } = await supabase
    .from('stories').select('*').eq('status', 'completed')
    .or('audio_set_id.not.is.null,user_audio_url.not.is.null')
    .order('updated_at', { ascending: false })

  // Also find stories referenced by audio_sets via content_id (RLS-visible)
  const { data: audioSetStoryIds } = await supabase
    .from('audio_sets')
    .select('content_id')
    .eq('content_type', 'story')
    .not('content_id', 'is', null)

  const directIds = new Set((directStories || []).map(s => s.id))
  const extraIds = (audioSetStoryIds || [])
    .map(r => r.content_id)
    .filter((id): id is string => !!id && !directIds.has(id))

  let allStories = (directStories || []) as Story[]

  if (extraIds.length > 0) {
    const { data: extraStories } = await supabase
      .from('stories').select('*').in('id', extraIds).eq('status', 'completed')
      .order('updated_at', { ascending: false })
    if (extraStories) allStories = [...allStories, ...(extraStories as Story[])]
  }

  return allStories
}

async function fetchCompletedStories(): Promise<Story[]> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return []

  const { data } = await supabase
    .from('stories')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('updated_at', { ascending: false })
  return (data ?? []) as Story[]
}

export function AudioStudioProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()

  // UI state
  const [selectedVisionId, setSelectedVisionId] = useState<string | null>(null)
  const [activePill, setActivePill] = useState('life-vision')
  const [listenContentType, setListenContentType] = useState('life-vision')
  const [listenStoryFilter, setListenStoryFilter] = useState('all')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [sourceType, setSourceType] = useState<AudioSourceType>(null)
  const [sourceId, setSourceId] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const pathname = usePathname()

  const listenContentTypeFromPath = useMemo(() => {
    const clean = pathname.replace(/\/$/, '') || '/audio'
    return LISTEN_PATH_MAP[clean] ?? null
  }, [pathname])

  useEffect(() => {
    if (listenContentTypeFromPath) {
      setListenContentType(listenContentTypeFromPath)
    }
  }, [listenContentTypeFromPath])

  const [player, setPlayer] = useState<PlayerState>({
    tracks: [],
    currentIndex: 0,
    isPlaying: false,
  })

  const audioRef = useRef<HTMLAudioElement | null>(null)

  // --- Entity data (query-backed, realtime-invalidated) ---

  const { data: allVisions = [], isLoading: visionLoading } = useQuery({
    queryKey: publishedVisionsKey,
    queryFn: fetchPublishedVisions,
  })

  // Selected vision falls back to the best default: active personal vision,
  // then any personal vision, then the newest visible one.
  const vision = useMemo(() => {
    const explicit = selectedVisionId ? allVisions.find(v => v.id === selectedVisionId) : null
    if (explicit) return explicit
    return (
      allVisions.find(v => v.is_active && v.is_mine && !v.is_household) ||
      allVisions.find(v => v.is_mine && !v.is_household) ||
      allVisions[0] ||
      null
    )
  }, [allVisions, selectedVisionId])
  const visionId = vision?.id ?? null

  const switchVision = useCallback((id: string) => {
    setSelectedVisionId(id)
  }, [])

  const { data: hasFocusStoryWithAudio = false } = useQuery({
    queryKey: storyAudioChecklistKey,
    queryFn: fetchHasFocusStoryWithAudio,
  })

  // isPending (not isLoading) so this stays true until the first load,
  // matching the previous behavior while the vision itself is still loading.
  const { data: audioSets = [], isPending: audioSetsLoading } = useQuery({
    queryKey: visionAudioSetsKey(visionId ?? 'none'),
    queryFn: () => fetchAudioSets(visionId!),
    enabled: !!visionId,
  })

  const checklist = useMemo<ActivationChecklist>(() => ({
    hasMainVisionAudio: audioSets.some(s => s.isReady && s.variant !== 'personal'),
    hasFocusStoryWithAudio,
    hasPersonalRecording: audioSets.some(s => s.isReady && s.variant === 'personal'),
  }), [audioSets, hasFocusStoryWithAudio])

  // Batch status changes arrive via realtime invalidation; the slow poll is a
  // fallback in case the websocket drops while a batch is generating.
  const { data: activeBatches = [] } = useQuery({
    queryKey: visionBatchesKey(visionId ?? 'none'),
    queryFn: () => fetchVisionBatches(visionId!),
    enabled: !!visionId,
    refetchInterval: query => (hasPendingBatches(query.state.data) ? BATCH_POLL_FALLBACK_MS : false),
  })

  const { data: allBatches = [], isLoading: allBatchesLoading } = useQuery({
    queryKey: allBatchesKey,
    queryFn: fetchAllBatches,
    refetchInterval: query => (hasPendingBatches(query.state.data) ? BATCH_POLL_FALLBACK_MS : false),
  })

  const { data: storiesWithAudio = [], isLoading: storiesWithAudioLoading } = useQuery({
    queryKey: storiesWithAudioKey,
    queryFn: fetchStoriesWithAudio,
  })

  const { data: allStories = [], isLoading: allStoriesLoading } = useQuery({
    queryKey: completedStoriesKey,
    queryFn: fetchCompletedStories,
  })

  const refreshAudioSets = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: keys.audioSets })
  }, [queryClient])

  const refreshBatches = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: keys.audioBatches })
  }, [queryClient])

  const refreshAllBatches = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: allBatchesKey })
  }, [queryClient])

  // --- Player (ephemeral state, untouched by the cache) ---

  // Wire up audio element events
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
    }
    const audio = audioRef.current

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onDurationChange = () => setDuration(audio.duration)
    const onEnded = () => {
      if (player.currentIndex < player.tracks.length - 1) {
        const nextIndex = player.currentIndex + 1
        setPlayer(prev => ({ ...prev, currentIndex: nextIndex }))
        audio.src = player.tracks[nextIndex].url
        audio.play().catch(() => {})
      } else {
        setPlayer(prev => ({ ...prev, isPlaying: false }))
      }
    }
    const onPlay = () => setPlayer(prev => ({ ...prev, isPlaying: true }))
    const onPause = () => setPlayer(prev => ({ ...prev, isPlaying: false }))

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
    }
  }, [player.currentIndex, player.tracks])

  // Read source params from URL on mount
  useEffect(() => {
    const urlSource = searchParams.get('source') as AudioSourceType
    const urlSourceId = searchParams.get('sourceId')
    if (urlSource && urlSourceId) {
      setSourceType(urlSource)
      setSourceId(urlSourceId)
    }
  }, [searchParams])

  const setSource = useCallback((type: AudioSourceType, id: string | null) => {
    setSourceType(type)
    setSourceId(id)
  }, [])

  const playTracks = useCallback((tracks: AudioTrack[], startIndex = 0, setName?: string) => {
    if (!audioRef.current || tracks.length === 0) return

    setPlayer({
      tracks,
      currentIndex: startIndex,
      isPlaying: true,
      setName,
    })

    const audio = audioRef.current
    audio.src = tracks[startIndex].url
    audio.play().catch(() => {})
  }, [])

  const pausePlayer = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const resumePlayer = useCallback(() => {
    audioRef.current?.play().catch(() => {})
  }, [])

  const stopPlayer = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    setPlayer({ tracks: [], currentIndex: 0, isPlaying: false })
    setCurrentTime(0)
    setDuration(0)
  }, [])

  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }, [])

  const skipNext = useCallback(() => {
    if (player.currentIndex < player.tracks.length - 1) {
      const nextIndex = player.currentIndex + 1
      setPlayer(prev => ({ ...prev, currentIndex: nextIndex }))
      if (audioRef.current) {
        audioRef.current.src = player.tracks[nextIndex].url
        audioRef.current.play().catch(() => {})
      }
    }
  }, [player.currentIndex, player.tracks])

  const skipPrev = useCallback(() => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0
      return
    }
    if (player.currentIndex > 0) {
      const prevIndex = player.currentIndex - 1
      setPlayer(prev => ({ ...prev, currentIndex: prevIndex }))
      if (audioRef.current) {
        audioRef.current.src = player.tracks[prevIndex].url
        audioRef.current.play().catch(() => {})
      }
    }
  }, [player.currentIndex, player.tracks])

  const activeBatchCount = activeBatches.filter(b => ['pending', 'processing'].includes(b.status)).length

  return (
    <AudioStudioContext.Provider
      value={{
        visionId,
        vision,
        allVisions,
        visionLoading,
        switchVision,
        checklist,
        audioSets,
        audioSetsLoading,
        refreshAudioSets,
        activeBatches,
        activeBatchCount,
        refreshBatches,
        activePill,
        setActivePill,
        listenContentType,
        setListenContentType,
        listenStoryFilter,
        setListenStoryFilter,
        storiesWithAudio,
        storiesWithAudioLoading,
        player,
        playTracks,
        pausePlayer,
        resumePlayer,
        stopPlayer,
        seekTo,
        skipNext,
        skipPrev,
        audioRef,
        currentTime,
        duration,
        sourceType,
        sourceId,
        setSource,
        allStories,
        allStoriesLoading,
        allBatches,
        allBatchesLoading,
        refreshAllBatches,
      }}
    >
      {children}
    </AudioStudioContext.Provider>
  )
}

export type { VisionData, AudioSetItem, QueueBatch, PlayerState, ActivationChecklist, AudioSourceType }
