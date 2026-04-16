'use client'

import React, { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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

const AudioStudioContext = createContext<AudioStudioContextValue | null>(null)

export function useAudioStudio() {
  const ctx = useContext(AudioStudioContext)
  if (!ctx) throw new Error('useAudioStudio must be used within AudioStudioProvider')
  return ctx
}

export function AudioStudioProvider({ children }: { children: React.ReactNode }) {
  const [visionId, setVisionId] = useState<string | null>(null)
  const [vision, setVision] = useState<VisionData | null>(null)
  const [allVisions, setAllVisions] = useState<VisionData[]>([])
  const [visionLoading, setVisionLoading] = useState(true)
  const [audioSets, setAudioSets] = useState<AudioSetItem[]>([])
  const [audioSetsLoading, setAudioSetsLoading] = useState(true)
  const [activeBatches, setActiveBatches] = useState<QueueBatch[]>([])
  const [checklist, setChecklist] = useState<ActivationChecklist>({
    hasMainVisionAudio: false,
    hasFocusStoryWithAudio: false,
    hasPersonalRecording: false,
  })
  const [activePill, setActivePill] = useState('life-vision')
  const [listenContentType, setListenContentType] = useState('life-vision')
  const [listenStoryFilter, setListenStoryFilter] = useState('all')
  const [storiesWithAudio, setStoriesWithAudio] = useState<Story[]>([])
  const [storiesWithAudioLoading, setStoriesWithAudioLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [sourceType, setSourceType] = useState<AudioSourceType>(null)
  const [sourceId, setSourceId] = useState<string | null>(null)
  const [allStories, setAllStories] = useState<Story[]>([])
  const [allStoriesLoading, setAllStoriesLoading] = useState(true)
  const [allBatches, setAllBatches] = useState<QueueBatch[]>([])
  const [allBatchesLoading, setAllBatchesLoading] = useState(false)

  const searchParams = useSearchParams()

  const [player, setPlayer] = useState<PlayerState>({
    tracks: [],
    currentIndex: 0,
    isPlaying: false,
  })

  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Load active vision on mount
  useEffect(() => {
    loadActiveVision()
  }, [])

  // Load audio sets + batches when vision is available
  useEffect(() => {
    if (!visionId) return
    loadAudioSets()
    loadBatches()
  }, [visionId])

  // Poll for batch updates when active batches exist
  useEffect(() => {
    const hasActive = activeBatches.some(b => ['pending', 'processing'].includes(b.status))
    if (!hasActive || !visionId) return

    const interval = setInterval(loadBatches, 5000)
    return () => clearInterval(interval)
  }, [activeBatches, visionId])

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

  async function loadActiveVision() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setVisionLoading(false)
      return
    }

    const { data: versions } = await supabase
      .from('vision_versions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_draft', false)
      .order('created_at', { ascending: false })

    if (versions && versions.length > 0) {
      const enriched: VisionData[] = []
      for (let i = 0; i < versions.length; i++) {
        const v = versions[i]
        enriched.push({
          ...v,
          version_number: versions.length - i,
        })
      }
      setAllVisions(enriched)

      const active = enriched.find(v => v.is_active) || enriched[0]
      setVision(active)
      setVisionId(active.id)
    }

    // Load activation checklist
    const { count: storyAudioCount } = await supabase
      .from('stories')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('audio_set_id', 'is', null)
      .eq('status', 'completed')

    setChecklist(prev => ({
      ...prev,
      hasFocusStoryWithAudio: (storyAudioCount || 0) > 0,
    }))

    setVisionLoading(false)
  }

  function switchVision(id: string) {
    const target = allVisions.find(v => v.id === id)
    if (!target) return
    setVision(target)
    setVisionId(target.id)
  }

  async function loadAudioSets() {
    if (!visionId) return
    setAudioSetsLoading(true)
    const supabase = createClient()

    const { data: sets } = await supabase
      .from('audio_sets')
      .select('*, audio_tracks(count)')
      .eq('vision_id', visionId)
      .eq('content_type', 'life_vision')
      .order('created_at', { ascending: false })

    if (!sets) {
      setAudioSetsLoading(false)
      return
    }

    const enriched = await Promise.all(sets.map(async (set: any) => {
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

    setAudioSets(enriched)

    const hasMain = enriched.some(s => s.isReady && s.variant !== 'personal')
    const hasPersonal = enriched.some(s => s.isReady && s.variant === 'personal')
    setChecklist(prev => ({
      ...prev,
      hasMainVisionAudio: hasMain,
      hasPersonalRecording: hasPersonal,
    }))

    setAudioSetsLoading(false)
  }

  async function loadBatches() {
    if (!visionId) return
    const supabase = createClient()

    const { data: batches } = await supabase
      .from('audio_generation_batches')
      .select('*')
      .eq('vision_id', visionId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (batches) {
      setActiveBatches(batches)
    }
  }

  async function loadStoriesWithAudio() {
    setStoriesWithAudioLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setStoriesWithAudioLoading(false); return }
    const { data } = await supabase
      .from('stories').select('*').eq('user_id', user.id).eq('status', 'completed')
      .or('audio_set_id.not.is.null,user_audio_url.not.is.null')
      .order('updated_at', { ascending: false })
    if (data) setStoriesWithAudio(data as Story[])
    setStoriesWithAudioLoading(false)
  }

  useEffect(() => { loadStoriesWithAudio() }, [])

  // Read source from URL params on mount
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

  // Load all completed stories (for source selectors)
  useEffect(() => { loadAllStories() }, [])

  async function loadAllStories() {
    setAllStoriesLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setAllStoriesLoading(false); return }
    const { data } = await supabase
      .from('stories')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('updated_at', { ascending: false })
    if (data) setAllStories(data as Story[])
    setAllStoriesLoading(false)
  }

  // Load all batches across all sources (for unified queue)
  async function loadAllBatches() {
    setAllBatchesLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setAllBatchesLoading(false); return }
    const { data: batches } = await supabase
      .from('audio_generation_batches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (batches) setAllBatches(batches)
    setAllBatchesLoading(false)
  }

  const refreshAllBatches = useCallback(async () => {
    await loadAllBatches()
  }, [])

  // Poll for all-batch updates when active batches exist
  useEffect(() => {
    const hasActive = allBatches.some(b => ['pending', 'processing'].includes(b.status))
    if (!hasActive) return
    const interval = setInterval(loadAllBatches, 5000)
    return () => clearInterval(interval)
  }, [allBatches])

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
        refreshAudioSets: loadAudioSets,
        activeBatches,
        activeBatchCount,
        refreshBatches: loadBatches,
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
