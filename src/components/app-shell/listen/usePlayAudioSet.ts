'use client'

import { useState } from 'react'
import { loadAudioSetTracks } from '@/components/dashboard/widgets/queries'
import { useGlobalAudioStore, type AudioContentCategory } from '@/lib/stores/global-audio-store'

/**
 * Play a whole audio set through the global player, or toggle it if it is
 * already the current set. Returns the loading id so a button can spin.
 */
export function usePlayAudioSet() {
  const play = useGlobalAudioStore((s) => s.play)
  const togglePlayPause = useGlobalAudioStore((s) => s.togglePlayPause)
  const isPlaying = useGlobalAudioStore((s) => s.isPlaying)
  const setName = useGlobalAudioStore((s) => s.setName)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const isCurrent = (id: string) => setName === `listen:${id}`

  const playSet = async (id: string, title: string, iconKey: string, category: AudioContentCategory) => {
    if (isCurrent(id)) {
      togglePlayPause()
      return
    }
    setLoadingId(id)
    try {
      const loaded = await loadAudioSetTracks(id)
      if (loaded.length === 0) return
      play(
        loaded.map((t) => ({ id: t.id, title: t.title || title, artist: '', duration: t.duration, url: t.url, thumbnail: '', sectionKey: t.sectionKey })),
        0,
        `listen:${id}`,
        iconKey,
        category,
      )
    } finally {
      setLoadingId(null)
    }
  }

  return { playSet, loadingId, isCurrent, isPlaying }
}
