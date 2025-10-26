"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Container, Stack, Badge, Spinner } from '@/lib/design-system/components'
import { PlaylistPlayer, type AudioTrack } from '@/lib/design-system'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Play } from 'lucide-react'
import Link from 'next/link'
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

    // Load vision to get section info
    const { data: vision } = await supabase
      .from('vision_versions')
      .select('*')
      .eq('id', visionId)
      .single()

    if (!vision) {
      console.error('Vision not found')
      setLoading(false)
      return
    }

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
      const title = vision[key] ? key.charAt(0).toUpperCase() + key.slice(1) : key
      sectionMap.set(key, title)
    })

    // Format tracks for PlaylistPlayer
    const formattedTracks: AudioTrack[] = tracks
      .map(track => ({
        id: track.id,
        title: sectionMap.get(track.section_key) || track.section_key,
        artist: 'VibrationFit AI',
        duration: track.duration_seconds || 180,
        url: track.audio_url,
        thumbnail: ''
      }))
      .filter(track => track.url && track.url.length > 0)

    setAudioTracks(formattedTracks)
    setLoading(false)
  }

  return (
    <Container size="lg">
      <Stack gap="lg">
        {/* Header */}
        <div className="flex items-center gap-4 mb-2">
          <Button 
            variant="ghost" 
            size="sm"
            asChild
          >
            <Link href={`/life-vision/${visionId}/audio-sets`}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <h1 className="text-2xl md:text-4xl font-bold text-white">
            {audioSet?.name || 'Audio Player'}
          </h1>
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
