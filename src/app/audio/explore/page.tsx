'use client'

import React, { useEffect, useState } from 'react'
import { Container, Stack, Card, Spinner } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { Compass, Music, Waves, TreePine, Cloud, Sparkles, Play, Pause } from 'lucide-react'

interface BackgroundTrack {
  id: string
  name: string
  display_name: string
  category: string
  file_url: string
  description?: string
}

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  nature: { label: 'Nature', icon: TreePine, color: 'text-green-400 bg-green-500/15' },
  ambient: { label: 'Ambient', icon: Cloud, color: 'text-blue-400 bg-blue-500/15' },
  music: { label: 'Music', icon: Music, color: 'text-purple-400 bg-purple-500/15' },
  frequency: { label: 'Frequency', icon: Waves, color: 'text-cyan-400 bg-cyan-500/15' },
}

export default function ExplorePage() {
  const [tracks, setTracks] = useState<BackgroundTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    loadTracks()
    return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = '' } }
  }, [])

  async function loadTracks() {
    const supabase = createClient()
    const { data } = await supabase
      .from('audio_background_tracks')
      .select('id, name, display_name, category, file_url, description')
      .eq('is_active', true)
      .not('category', 'in', '(solfeggio,solfeggio_binaural,binaural)')
      .order('category')
      .order('sort_order')
    if (data) setTracks(data)
    setLoading(false)
  }

  function handlePreview(track: BackgroundTrack) {
    if (!audioRef.current) audioRef.current = new Audio()
    if (playingId === track.id) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setPlayingId(null)
      return
    }
    audioRef.current.src = track.file_url
    audioRef.current.currentTime = 0
    audioRef.current.play().catch(() => {})
    setPlayingId(track.id)
    audioRef.current.onended = () => setPlayingId(null)
    setTimeout(() => {
      if (audioRef.current && playingId === track.id) {
        audioRef.current.pause()
        setPlayingId(null)
      }
    }, 30000)
  }

  const categories = [...new Set(tracks.map(t => t.category))]

  return (
    <Container size="xl" className="py-6">
      <Stack gap="lg">
        <div className="text-center">
          <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <Compass className="w-6 h-6 text-neutral-400" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Explore Sounds</h2>
          <p className="text-sm text-neutral-400 max-w-md mx-auto">
            Preview the background tracks and frequencies available for mixing with your vision audio.
            Full music playlists and community tracks are coming soon.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12"><Spinner size="lg" /></div>
        ) : (
          categories.map(cat => {
            const meta = CATEGORY_META[cat] || { label: cat, icon: Sparkles, color: 'text-neutral-400 bg-neutral-800' }
            const CatIcon = meta.icon
            const catTracks = tracks.filter(t => t.category === cat)

            return (
              <section key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${meta.color}`}>
                    <CatIcon className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-semibold text-white">{meta.label}</h3>
                  <span className="text-xs text-neutral-500">{catTracks.length} tracks</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {catTracks.map(track => {
                    const isPlaying = playingId === track.id
                    return (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => handlePreview(track)}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                          isPlaying ? 'border-[#39FF14]/40 bg-[#39FF14]/5' : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isPlaying ? 'bg-[#39FF14]/20' : 'bg-neutral-800'
                        }`}>
                          {isPlaying ? <Pause className="w-4 h-4 text-[#39FF14]" /> : <Play className="w-4 h-4 text-neutral-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{track.display_name}</p>
                          {track.description && <p className="text-[11px] text-neutral-500 truncate">{track.description}</p>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })
        )}

        {/* Coming soon */}
        <Card variant="glass" className="p-6 text-center">
          <Sparkles className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
          <p className="text-sm text-neutral-400">Curated playlists, community tracks, and more coming soon.</p>
        </Card>
      </Stack>
    </Container>
  )
}
