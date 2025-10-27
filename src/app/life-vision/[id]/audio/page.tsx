"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Container, Stack, Badge } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { Headphones, Play, Clock, CheckCircle, Music, Moon, Zap, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function VisionAudioPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [visionId, setVisionId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [audioSets, setAudioSets] = useState<Array<{
    id: string
    name: string
    description: string
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
        description,
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
        description: set.description || '',
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

  const getVariantIcon = (variant: string) => {
    switch (variant) {
      case 'sleep':
        return <Moon className="w-5 h-5" />
      case 'energy':
        return <Zap className="w-5 h-5" />
      case 'meditation':
        return <Sparkles className="w-5 h-5" />
      default:
        return <Headphones className="w-5 h-5" />
    }
  }

  const getVariantColor = (variant: string) => {
    switch (variant) {
      case 'sleep':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'energy':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'meditation':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      default:
        return 'bg-[#39FF14]/20 text-[#39FF14] border-[#39FF14]/30'
    }
  }

  const totalSets = audioSets.length
  const readySets = audioSets.filter(s => s.isReady).length
  const mixingSets = audioSets.filter(s => s.isMixing).length
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
        <Card variant="elevated" className="bg-gradient-to-br from-[#199D67]/20 via-[#14B8A6]/10 to-[#8B5CF6]/20 border-[#39FF14]/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold text-lg">Want to create more audio versions?</p>
              <p className="text-sm text-neutral-300">Generate sleep, meditation, or energy mixes</p>
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
                  variant="elevated"
                  hover
                  className="cursor-pointer"
                  onClick={() => router.push(`/life-vision/${visionId}/audio-sets/${set.id}`)}
                >
                  <Stack gap="md">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getVariantColor(set.variant)}`}>
                          {getVariantIcon(set.variant)}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{set.name}</h3>
                          {set.description && (
                            <p className="text-sm text-neutral-400">{set.description}</p>
                          )}
                        </div>
                      </div>
                      {set.isReady ? (
                        <Badge variant="success">Ready</Badge>
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

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex gap-4 text-neutral-400">
                        <span>Variant: <span className="text-white capitalize">{set.variant}</span></span>
                        {set.voiceId && (
                          <>
                            <span>•</span>
                            <span>Voice: <span className="text-white capitalize">{set.voiceId}</span></span>
                          </>
                        )}
                      </div>
                      <div className="text-neutral-400">
                        {set.trackCount} tracks
                      </div>
                    </div>

                    <Button 
                      variant="primary" 
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/life-vision/${visionId}/audio-sets/${set.id}`)
                      }}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Play Audio
                    </Button>
                  </Stack>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Stack>
    </Container>
  )
}


