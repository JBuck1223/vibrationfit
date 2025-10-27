"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Container, Stack, Badge } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { Headphones, Play, Clock, CheckCircle, Music } from 'lucide-react'
import Link from 'next/link'

export default function VisionAudioPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [visionId, setVisionId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [audioSets, setAudioSets] = useState<Array<{
    id: string
    name: string
    variant: string
    voiceId?: string
    trackCount: number
    isReady: boolean
    isMixing: boolean
    createdAt: string
  }>>([])
  const [vision, setVision] = useState<any>(null)

  useEffect(() => {
    ;(async () => {
      const p = await params
      setVisionId(p.id)
    })()
  }, [params])

  useEffect(() => {
    if (!visionId) return
    loadData()
  }, [visionId])

  async function loadData() {
    const supabase = createClient()

    // Load vision
    const { data: v } = await supabase
      .from('vision_versions')
      .select('*')
      .eq('id', visionId)
      .single()
    setVision(v)

    // Load audio sets
    const { data: sets } = await supabase
      .from('audio_sets')
      .select(`
        id,
        name,
        variant,
        voice_id,
        created_at,
        audio_tracks(count)
      `)
      .eq('vision_id', visionId)
      .order('created_at', { ascending: false })

    // Check mix status for each set
    const setsWithStatus = await Promise.all((sets || []).map(async (set: any) => {
      const { data: tracks } = await supabase
        .from('audio_tracks')
        .select('mix_status, status')
        .eq('audio_set_id', set.id)
        .limit(1)

      const hasCompletedVoice = tracks?.some((t: any) => t.status === 'completed')
      const hasCompletedMixing = tracks?.some((t: any) => t.mix_status === 'completed')
      const isMixing = tracks?.some((t: any) => t.mix_status === 'mixing' || t.mix_status === 'pending')

      return {
        id: set.id,
        name: set.name,
        variant: set.variant,
        voiceId: set.voice_id,
        trackCount: set.audio_tracks?.[0]?.count || 0,
        isReady: !!(hasCompletedVoice && (set.variant === 'standard' || hasCompletedMixing)),
        isMixing: !!isMixing,
        createdAt: set.created_at
      }
    }))

    setAudioSets(setsWithStatus)
    setLoading(false)
  }

  const totalSets = audioSets.length
  const readySets = audioSets.filter(s => s.isReady).length
  const mixingSets = audioSets.filter(s => s.isMixing).length
  const uniqueVariants = [...new Set(audioSets.map(s => s.variant))].length
  const totalTracks = audioSets.reduce((sum, s) => sum + s.trackCount, 0)

  if (loading) {
    return (
      <Container size="lg">
        <div className="flex items-center justify-center py-20">
          <Clock className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      </Container>
    )
  }

  return (
    <Container size="lg">
      <Stack gap="lg">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">Life Vision Audio</h1>
          {vision && (
            <p className="text-neutral-400">
              Version {vision.version_number} • {new Date(vision.created_at).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card variant="glass" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center">
                <Music className="w-6 h-6 text-primary-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalSets}</p>
                <p className="text-xs text-neutral-400">Audio Sets</p>
              </div>
            </div>
          </Card>

          <Card variant="glass" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{readySets}</p>
                <p className="text-xs text-neutral-400">Ready</p>
              </div>
            </div>
          </Card>

          <Card variant="glass" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{mixingSets}</p>
                <p className="text-xs text-neutral-400">Processing</p>
              </div>
            </div>
          </Card>

          <Card variant="glass" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                <Headphones className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalTracks}</p>
                <p className="text-xs text-neutral-400">Total Tracks</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Generate Button */}
        <Card variant="glass" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Want to create more audio versions?</p>
              <p className="text-sm text-neutral-400">Generate sleep, meditation, or energy mixes</p>
            </div>
            <Button variant="primary" asChild>
              <Link href={`/life-vision/${visionId}/audio-generate`}>
                Generate Audio
              </Link>
            </Button>
          </div>
        </Card>

        {/* Audio Sets Grid */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Your Audio Sets</h2>
          {audioSets.length === 0 ? (
            <Card variant="glass" className="p-8 text-center">
              <Music className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
              <p className="text-neutral-400 mb-4">No audio sets yet</p>
              <Button variant="primary" asChild>
                <Link href={`/life-vision/${visionId}/audio-generate`}>
                  Generate Your First Audio Set
                </Link>
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {audioSets.map((set) => (
                <Card
                  key={set.id}
                  variant="default"
                  hover
                  onClick={() => router.push(`/life-vision/${visionId}/audio-sets/${set.id}`)}
                  className="cursor-pointer"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{set.name}</h3>
                        <p className="text-sm text-neutral-400 capitalize">{set.variant}</p>
                      </div>
                      {set.isReady ? (
                        <Badge variant="success">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Ready
                        </Badge>
                      ) : set.isMixing ? (
                        <Badge variant="info">
                          <Clock className="w-3 h-3 mr-1" />
                          Mixing
                        </Badge>
                      ) : (
                        <Badge variant="warning">
                          <Clock className="w-3 h-3 mr-1" />
                          Processing
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm text-neutral-400 mb-3">
                      <span>{set.trackCount} tracks</span>
                      {set.voiceId && <span className="capitalize">{set.voiceId}</span>}
                    </div>

                    <Button variant="ghost" size="sm" className="w-full">
                      <Play className="w-4 h-4 mr-2" />
                      Play Audio
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Stack>
    </Container>
  )
}


