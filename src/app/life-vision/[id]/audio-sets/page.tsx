"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Container, Stack, Badge, Spinner } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { Headphones, Play, Plus, ArrowLeft, Moon, Zap, Sparkles, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface AudioSet {
  id: string
  name: string
  description: string
  variant: string
  voice_id: string
  is_active: boolean
  created_at: string
  track_count: number
}

export default function AudioSetsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [visionId, setVisionId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [audioSets, setAudioSets] = useState<AudioSet[]>([])
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const p = await params
      setVisionId(p.id)
    })()
  }, [params])

  useEffect(() => {
    if (!visionId) return
    loadAudioSets()
  }, [visionId])

  const loadAudioSets = async () => {
    const supabase = createClient()
    
    const { data: sets, error } = await supabase
      .from('audio_sets')
      .select(`
        *,
        audio_tracks(count)
      `)
      .eq('vision_id', visionId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading audio sets:', error)
      setLoading(false)
      return
    }

    const formatted = sets?.map(set => ({
      id: set.id,
      name: set.name,
      description: set.description,
      variant: set.variant,
      voice_id: set.voice_id,
      is_active: set.is_active,
      created_at: set.created_at,
      track_count: set.audio_tracks?.[0]?.count || 0
    })) || []

    setAudioSets(formatted)
    setLoading(false)
  }

  const handleDelete = async (setId: string, setName: string) => {
    if (!confirm(`Are you sure you want to delete "${setName}"? This will delete all audio tracks in this version. This action cannot be undone.`)) {
      return
    }

    setDeleting(setId)
    const supabase = createClient()

    try {
      // Delete the audio_set (CASCADE will handle audio_tracks deletion)
      const { error } = await supabase
        .from('audio_sets')
        .delete()
        .eq('id', setId)

      if (error) {
        console.error('Error deleting audio set:', error)
        alert('Failed to delete audio version. Please try again.')
      } else {
        // Remove from local state
        setAudioSets(audioSets.filter(s => s.id !== setId))
      }
    } catch (error) {
      console.error('Error deleting audio set:', error)
      alert('Failed to delete audio version. Please try again.')
    } finally {
      setDeleting(null)
    }
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
            <Link href={`/life-vision/${visionId}`}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <h1 className="text-2xl md:text-4xl font-bold text-white">Audio Versions</h1>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner variant="primary" size="lg" />
          </div>
        ) : (
          <Stack gap="md">
            {/* Create New Version Button */}
            <Card variant="elevated" className="bg-gradient-to-br from-[#199D67]/20 via-[#14B8A6]/10 to-[#8B5CF6]/20 border-[#39FF14]/30">
              <Stack gap="md">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white">Create New Audio Version</h2>
                    <p className="text-sm md:text-base text-neutral-300 mt-1">
                      Generate new audio with different voice, variant, or background tracks
                    </p>
                  </div>
                  <Button 
                    variant="primary"
                    asChild
                  >
                    <Link href={`/life-vision/${visionId}/audio`}>
                      <Plus className="w-4 h-4 mr-2" />
                      New Version
                    </Link>
                  </Button>
                </div>
              </Stack>
            </Card>

            {/* Audio Sets List */}
            {audioSets.length === 0 ? (
              <Card variant="outlined" className="p-8 text-center">
                <Stack gap="md" align="center">
                  <Headphones className="w-12 h-12 md:w-16 md:h-16 text-neutral-600" />
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold text-white mb-2">No Audio Versions Yet</h3>
                    <p className="text-sm md:text-base text-neutral-400 mb-4">
                      Create your first audio version to start listening to your vision
                    </p>
                  </div>
                  <Button 
                    variant="primary"
                    asChild
                  >
                    <Link href={`/life-vision/${visionId}/audio`}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Audio Version
                    </Link>
                  </Button>
                </Stack>
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
                            <p className="text-sm text-neutral-400">{set.description}</p>
                          </div>
                        </div>
                        <Badge variant={set.is_active ? 'success' : 'neutral'}>
                          {set.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex gap-4 text-neutral-400">
                          <span>Variant: <span className="text-white capitalize">{set.variant}</span></span>
                          <span>•</span>
                          <span>Voice: <span className="text-white">{set.voice_id}</span></span>
                        </div>
                        <div className="text-neutral-400">
                          {set.track_count} tracks
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button 
                          variant="primary" 
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/life-vision/${visionId}/audio-sets/${set.id}`)
                          }}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Play Audio
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm"
                          disabled={deleting === set.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(set.id, set.name)
                          }}
                        >
                          {deleting === set.id ? (
                            <Spinner variant="danger" size="sm" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </Stack>
                  </Card>
                ))}
              </div>
            )}
          </Stack>
        )}
      </Stack>
    </Container>
  )
}
