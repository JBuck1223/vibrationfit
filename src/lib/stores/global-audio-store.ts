import { create } from 'zustand'
import type { AudioTrack } from '@/lib/design-system/components/media/types'

interface GlobalAudioState {
  tracks: AudioTrack[]
  currentIndex: number
  isPlaying: boolean
  currentTime: number
  duration: number
  setName: string
  setIconKey: string
  repeatMode: 'off' | 'all' | 'one'
  isShuffled: boolean
  shuffleOrder: number[]
  isDrawerOpen: boolean

  play: (tracks: AudioTrack[], startIndex?: number, setName?: string, setIconKey?: string) => void
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

  openDrawer: () => void
  closeDrawer: () => void
}

let _audio: HTMLAudioElement | null = null
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
      useGlobalAudioStore.setState({ currentIndex: nextIndex, currentTime: 0 })
      audio.src = s.tracks[nextIndex].url
      audio.play().catch(() => {})
    } else if (repeatMode === 'all' && s.tracks.length > 0) {
      useGlobalAudioStore.setState({ currentIndex: 0, currentTime: 0 })
      audio.src = s.tracks[0].url
      audio.play().catch(() => {})
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
  currentTime: 0,
  duration: 0,
  setName: '',
  setIconKey: '',
  repeatMode: 'off',
  isShuffled: false,
  shuffleOrder: [],
  isDrawerOpen: false,

  play: (tracks, startIndex = 0, setName, setIconKey) => {
    if (tracks.length === 0) return
    const audio = getAudio()
    set({
      tracks,
      currentIndex: startIndex,
      isPlaying: true,
      currentTime: 0,
      duration: 0,
      setName: setName ?? '',
      setIconKey: setIconKey ?? '',
      isShuffled: false,
      shuffleOrder: [],
    })
    audio.src = tracks[startIndex].url
    audio.play().catch(() => {})
  },

  playTrack: (index) => {
    const s = get()
    if (index < 0 || index >= s.tracks.length) return
    const audio = getAudio()
    set({ currentIndex: index, currentTime: 0 })
    audio.src = s.tracks[index].url
    audio.play().catch(() => {})
  },

  stop: () => {
    const audio = getAudio()
    audio.pause()
    audio.removeAttribute('src')
    set({
      tracks: [],
      currentIndex: 0,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      setName: '',
      setIconKey: '',
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
    set({ currentIndex: nextIndex, currentTime: 0 })
    audio.src = s.tracks[nextIndex].url
    audio.play().catch(() => {})
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
    set({ currentIndex: prevIndex, currentTime: 0 })
    audio.src = s.tracks[prevIndex].url
    audio.play().catch(() => {})
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

  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
}))
