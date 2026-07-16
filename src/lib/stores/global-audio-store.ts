import { create } from 'zustand'
import type { AudioTrack } from '@/lib/design-system/components/media/types'
import { getCachedAudio } from '@/lib/storage/audio-offline-cache'

export type AudioContentCategory = 'life_vision' | 'story' | 'music'

interface GlobalAudioState {
  tracks: AudioTrack[]
  currentIndex: number
  isPlaying: boolean
  isBuffering: boolean
  currentTime: number
  duration: number
  setName: string
  setIconKey: string
  contentCategory: AudioContentCategory
  repeatMode: 'off' | 'all' | 'one'
  isShuffled: boolean
  shuffleOrder: number[]
  isDrawerOpen: boolean

  play: (tracks: AudioTrack[], startIndex?: number, setName?: string, setIconKey?: string, contentCategory?: AudioContentCategory) => void
  playTrack: (index: number) => void
  stop: () => void
  pause: () => void
  resume: () => void
  togglePlayPause: () => void
  seekTo: (time: number) => void
  skipNext: () => void
  skipPrev: () => void

  setRepeatMode: (mode: 'off' | 'all' | 'one') => void
  toggleShuffle: () => void
  /** Replace the queue with a reordered copy of the same tracks, preserving the playing track */
  reorderQueue: (newTracks: AudioTrack[]) => void

  openDrawer: () => void
  closeDrawer: () => void
}

let _audio: HTMLAudioElement | null = null
let _preloadAudio: HTMLAudioElement | null = null
let _preloadedSrc: string | null = null
const _blobUrls = new Map<string, string>()

async function resolveTrackUrl(track: AudioTrack): Promise<string> {
  const existing = _blobUrls.get(track.id)
  if (existing) return existing
  try {
    const blob = await getCachedAudio(track.id)
    if (blob) {
      const blobUrl = URL.createObjectURL(blob)
      _blobUrls.set(track.id, blobUrl)
      return blobUrl
    }
  } catch {}
  return track.url
}

function revokeBlobUrls() {
  _blobUrls.forEach(url => URL.revokeObjectURL(url))
  _blobUrls.clear()
}

function getAudio(): HTMLAudioElement {
  if (!_audio && typeof window !== 'undefined') {
    _audio = new Audio()
    ;(globalThis as Record<string, unknown>).__vf_audio = _audio
    wireAudioEvents()
  }
  return _audio!
}

export function getGlobalAudioElement(): HTMLAudioElement | null {
  return _audio
}

function preloadNextTrack(nextTrack: AudioTrack | undefined) {
  if (!nextTrack) return
  resolveTrackUrl(nextTrack).then(url => {
    if (!url || url === _preloadedSrc) return
    if (!_preloadAudio && typeof window !== 'undefined') {
      _preloadAudio = new Audio()
      _preloadAudio.preload = 'auto'
      _preloadAudio.volume = 0
    }
    if (_preloadAudio) {
      _preloadAudio.src = url
      _preloadedSrc = url
    }
  })
}

async function loadAndPlay(audio: HTMLAudioElement, track: AudioTrack) {
  const url = await resolveTrackUrl(track)
  audio.src = url
  audio.play().catch(() => {})
  trackPlayEvent(track)
}

const CATEGORY_TO_AREA: Record<AudioContentCategory, string> = {
  life_vision: 'vision_audio',
  story: 'story_listen',
  music: 'music_listen',
}

async function trackPlayEvent(track: AudioTrack) {
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) return

    await supabase.rpc('increment_audio_play', { p_track_id: track.id })

    const category = useGlobalAudioStore.getState().contentCategory
    const area = CATEGORY_TO_AREA[category]
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('area_activations').upsert(
      { user_id: user.id, area, activation_date: today },
      { onConflict: 'user_id,area,activation_date', ignoreDuplicates: true },
    )

    if (category === 'life_vision') {
      const { autoVerifyClient } = await import('@/lib/map/auto-verify-client')
      autoVerifyClient('vision-audio')
    }
  } catch {
    // Tracking is non-critical; don't disrupt playback
  }
}

function wireAudioEvents() {
  const audio = _audio
  if (!audio) return

  audio.addEventListener('timeupdate', () => {
    useGlobalAudioStore.setState({ currentTime: audio.currentTime })
  })
  audio.addEventListener('durationchange', () => {
    useGlobalAudioStore.setState({ duration: audio.duration })
  })
  audio.addEventListener('play', () => {
    useGlobalAudioStore.setState({ isPlaying: true })
  })
  audio.addEventListener('pause', () => {
    useGlobalAudioStore.setState({ isPlaying: false })
  })
  audio.addEventListener('waiting', () => {
    useGlobalAudioStore.setState({ isBuffering: true })
  })
  audio.addEventListener('canplay', () => {
    useGlobalAudioStore.setState({ isBuffering: false })
  })
  audio.addEventListener('playing', () => {
    useGlobalAudioStore.setState({ isBuffering: false })
  })
  audio.addEventListener('ended', () => {
    const s = useGlobalAudioStore.getState()
    const { repeatMode } = s

    if (repeatMode === 'one') {
      audio.currentTime = 0
      audio.play().catch(() => {})
      return
    }

    const nextIndex = s.currentIndex + 1
    if (nextIndex < s.tracks.length) {
      useGlobalAudioStore.setState({ currentIndex: nextIndex, currentTime: 0, isBuffering: true })
      loadAndPlay(audio, s.tracks[nextIndex])
      preloadNextTrack(s.tracks[nextIndex + 1])
    } else if (repeatMode === 'all' && s.tracks.length > 0) {
      useGlobalAudioStore.setState({ currentIndex: 0, currentTime: 0, isBuffering: true })
      loadAndPlay(audio, s.tracks[0])
      preloadNextTrack(s.tracks[1])
    } else {
      useGlobalAudioStore.setState({ isPlaying: false })
    }
  })
}

function buildShuffleOrder(length: number, keepFirst?: number): number[] {
  const indices = Array.from({ length }, (_, i) => i)
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  if (keepFirst !== undefined) {
    const pos = indices.indexOf(keepFirst)
    if (pos > 0) {
      ;[indices[0], indices[pos]] = [indices[pos], indices[0]]
    }
  }
  return indices
}

export const useGlobalAudioStore = create<GlobalAudioState>((set, get) => ({
  tracks: [],
  currentIndex: 0,
  isPlaying: false,
  isBuffering: false,
  currentTime: 0,
  duration: 0,
  setName: '',
  setIconKey: '',
  contentCategory: 'life_vision',
  repeatMode: 'off',
  isShuffled: false,
  shuffleOrder: [],
  isDrawerOpen: false,

  play: (tracks, startIndex = 0, setName, setIconKey, contentCategory) => {
    if (tracks.length === 0) return
    const audio = getAudio()
    set({
      tracks,
      currentIndex: startIndex,
      isPlaying: true,
      isBuffering: true,
      currentTime: 0,
      duration: 0,
      setName: setName ?? '',
      setIconKey: setIconKey ?? '',
      contentCategory: contentCategory ?? 'life_vision',
      isShuffled: false,
      shuffleOrder: [],
    })
    loadAndPlay(audio, tracks[startIndex])
    preloadNextTrack(tracks[startIndex + 1])
  },

  playTrack: (index) => {
    const s = get()
    if (index < 0 || index >= s.tracks.length) return
    const audio = getAudio()
    set({ currentIndex: index, currentTime: 0, isBuffering: true })
    loadAndPlay(audio, s.tracks[index])
    preloadNextTrack(s.tracks[index + 1])
  },

  stop: () => {
    const audio = getAudio()
    audio.pause()
    audio.removeAttribute('src')
    if (_preloadAudio) { _preloadAudio.src = ''; _preloadedSrc = null }
    revokeBlobUrls()
    set({
      tracks: [],
      currentIndex: 0,
      isPlaying: false,
      isBuffering: false,
      currentTime: 0,
      duration: 0,
      setName: '',
      setIconKey: '',
      contentCategory: 'life_vision',
      repeatMode: 'off',
      isShuffled: false,
      shuffleOrder: [],
      isDrawerOpen: false,
    })
  },

  pause: () => getAudio().pause(),
  resume: () => getAudio().play().catch(() => {}),

  togglePlayPause: () => {
    const s = get()
    if (s.isPlaying) {
      getAudio().pause()
    } else {
      getAudio().play().catch(() => {})
    }
  },

  seekTo: (time) => { getAudio().currentTime = time },

  skipNext: () => {
    const s = get()
    if (s.tracks.length === 0) return
    let nextIndex = s.currentIndex + 1
    if (nextIndex >= s.tracks.length) {
      if (s.repeatMode === 'all') nextIndex = 0
      else return
    }
    const audio = getAudio()
    set({ currentIndex: nextIndex, currentTime: 0, isBuffering: true })
    loadAndPlay(audio, s.tracks[nextIndex])
    const followingIndex = nextIndex + 1 < s.tracks.length ? nextIndex + 1 : (s.repeatMode === 'all' ? 0 : undefined)
    if (followingIndex !== undefined) preloadNextTrack(s.tracks[followingIndex])
  },

  skipPrev: () => {
    const s = get()
    if (s.tracks.length === 0) return
    const audio = getAudio()
    if (audio.currentTime > 3) {
      audio.currentTime = 0
      return
    }
    let prevIndex = s.currentIndex - 1
    if (prevIndex < 0) {
      if (s.repeatMode === 'all') prevIndex = s.tracks.length - 1
      else return
    }
    set({ currentIndex: prevIndex, currentTime: 0, isBuffering: true })
    loadAndPlay(audio, s.tracks[prevIndex])
    preloadNextTrack(s.tracks[prevIndex + 1])
  },

  setRepeatMode: (mode) => set({ repeatMode: mode }),

  toggleShuffle: () => {
    const s = get()
    if (s.isShuffled) {
      set({ isShuffled: false, shuffleOrder: [] })
    } else {
      const order = buildShuffleOrder(s.tracks.length, s.currentIndex)
      const shuffledTracks = order.map(i => s.tracks[i])
      const newCurrentIndex = 0
      set({
        isShuffled: true,
        shuffleOrder: order,
        tracks: shuffledTracks,
        currentIndex: newCurrentIndex,
      })
    }
  },

  reorderQueue: (newTracks) => {
    const s = get()
    if (s.isShuffled) return
    if (newTracks.length !== s.tracks.length) return
    const currentIds = new Set(s.tracks.map(t => t.id))
    if (!newTracks.every(t => currentIds.has(t.id))) return

    const playingId = s.tracks[s.currentIndex]?.id
    const newIndex = playingId ? newTracks.findIndex(t => t.id === playingId) : 0
    set({
      tracks: newTracks,
      currentIndex: newIndex >= 0 ? newIndex : 0,
    })
    preloadNextTrack(newTracks[(newIndex >= 0 ? newIndex : 0) + 1])
  },

  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
}))
