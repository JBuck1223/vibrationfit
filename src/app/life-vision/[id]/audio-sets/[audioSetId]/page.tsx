"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Container, Stack, Badge, Spinner } from '@/lib/design-system/components'
import { PlaylistPlayer, type AudioTrack } from '@/lib/design-system'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Circle, History, Play } from 'lucide-react'
import { Icon } from '@/lib/design-system'
import { getVisionCategoryKeys } from '@/lib/design-system'

export default function AudioSetPlayerPage({ 
  params 
}: { 
  params: Promise<{ id: string; audioSetId: string }> 
}) {
  const router = useRouter()
  const [visionId, setVisionId] = useState<string>('')
  const [audioSetId, setAudioSetId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([])
  const [audioSet, setAudioSet] = useState<any>(null)
  const [vision, setVision] = useState<any>(null)
  const [allAudioSets, setAllAudioSets] = useState<any[]>([])
  const [showAllDropdown, setShowAllDropdown] = useState(false)

  useEffect(() => {
    ;(async () => {
      const p = await params
      setVisionId(p.id)
      setAudioSetId(p.audioSetId)
    })()
  }, [params])

  useEffect(() => {
    if (!visionId || !audioSetId) return
    loadAudioSet()
  }, [visionId, audioSetId])

  const loadAudioSet = async () => {
    const supabase = createClient()

    // Load vision
    const { data: v } = await supabase
      .from('vision_versions')
      .select('*')
      .eq('id', visionId)
      .single()
    setVision(v)

    // Load all audio sets for this vision
    const { data: allSets } = await supabase
      .from('audio_sets')
      .select('*')
      .eq('vision_id', visionId)
      .order('created_at', { ascending: false })
    setAllAudioSets(allSets || [])

    // Load audio set metadata
    const { data: set, error: setError } = await supabase
      .from('audio_sets')
      .select('*')
      .eq('id', audioSetId)
      .single()

    if (setError || !set) {
      console.error('Error loading audio set:', setError)
      setLoading(false)
      return
    }
    setAudioSet(set)

    // Load audio tracks for this set
    const { data: tracks, error: tracksError } = await supabase
      .from('audio_tracks')
      .select('*')
      .eq('audio_set_id', audioSetId)
      .eq('status', 'completed')
      .not('audio_url', 'is', null)
      .order('section_key')

    if (tracksError) {
      console.error('Error loading tracks:', tracksError)
      setLoading(false)
      return
    }

    // Build section map for titles
    const sectionMap = new Map<string, string>()
    sectionMap.set('meta_intro', 'Forward')
    sectionMap.set('meta_outro', 'Conclusion')
    const categories = getVisionCategoryKeys()
    categories.forEach(key => {
      const title = v[key] ? key.charAt(0).toUpperCase() + key.slice(1) : key
      sectionMap.set(key, title)
    })

    // Format tracks for PlaylistPlayer
    const formattedTracks: AudioTrack[] = tracks
      .map(track => {
        // Use mixed_audio_url if completed, otherwise use voice-only audio_url
        const url = track.mixed_audio_url && track.mix_status === 'completed' 
          ? track.mixed_audio_url 
          : track.audio_url
        
        return {
          id: track.id,
          title: sectionMap.get(track.section_key) || track.section_key,
          artist: 'VibrationFit AI',
          duration: track.duration_seconds || 180,
          url: url || '',
          thumbnail: ''
        }
      })
      .filter(track => track.url && track.url.length > 0)

    setAudioTracks(formattedTracks)
    setLoading(false)
  }

  return (
    <Container size="lg">
      <Stack gap="lg">
        {/* Vision Version Info */}
        {vision && (
          <Card variant="glass" className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                V{vision.version_number}
              </span>
              {vision.status === 'complete' ? (
                <Badge variant="success">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="warning">
                  <Circle className="w-4 h-4 mr-1" />
                  Draft
                </Badge>
              )}
              <div className="text-sm text-neutral-400">
                {new Date(vision.created_at).toLocaleDateString()}
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white">The Life I Choose</h2>
          </Card>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-4xl font-bold text-white">
            {audioSet?.name || 'Audio Player'}
          </h1>
          {allAudioSets.length > 1 && (
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowAllDropdown(!showAllDropdown)}
              >
                See All ({allAudioSets.length})
              </Button>
              {showAllDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-neutral-900 border-2 border-neutral-700 rounded-lg shadow-xl z-10 max-h-96 overflow-y-auto">
                  {allAudioSets.map((set) => (
                    <button
                      key={set.id}
                      onClick={() => {
                        router.push(`/life-vision/${visionId}/audio-sets/${set.id}`)
                        setShowAllDropdown(false)
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-neutral-800 transition-colors border-b border-neutral-800 ${
                        set.id === audioSetId ? 'bg-primary-500/20' : ''
                      }`}
                    >
                      <div className="font-medium text-white">{set.name}</div>
                      <div className="text-sm text-neutral-400 capitalize mt-1">
                        {set.variant} • {set.voice_id}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Audio Set Info */}
        {audioSet && (
          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">{audioSet.name}</h2>
                <p className="text-sm text-neutral-400">{audioSet.description}</p>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="flex gap-4 text-sm text-neutral-400 mt-2">
              <span>Variant: <span className="text-white capitalize">{audioSet.variant}</span></span>
              <span>•</span>
              <span>Voice: <span className="text-white">{audioSet.voice_id}</span></span>
              <span>•</span>
              <span>{audioTracks.length} tracks</span>
            </div>
          </Card>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner variant="primary" size="lg" />
          </div>
        ) : (
          <>
            {/* Playlist Player */}
            {audioTracks.length > 0 ? (
              <Card variant="elevated" className="p-4 md:p-6">
                <PlaylistPlayer tracks={audioTracks} />
              </Card>
            ) : (
              <Card variant="outlined" className="p-8 text-center">
                <Stack gap="md" align="center">
                  <Play className="w-12 h-12 md:w-16 md:h-16 text-neutral-600" />
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold text-white mb-2">No Audio Tracks</h3>
                    <p className="text-sm md:text-base text-neutral-400">
                      This audio version has no completed tracks yet.
                    </p>
                  </div>
                </Stack>
              </Card>
            )}
          </>
        )}
      </Stack>
    </Container>
  )
}
