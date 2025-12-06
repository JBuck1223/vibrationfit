"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Container, Stack, Badge, Spinner, VersionBadge, StatusBadge, TrackingMilestoneCard } from '@/lib/design-system/components'
import { PlaylistPlayer, type AudioTrack } from '@/lib/design-system'
import { createClient } from '@/lib/supabase/client'
import { assessmentToVisionKey } from '@/lib/design-system/vision-categories'
import { Play, Clock, CalendarDays, Moon, Zap, Sparkles, Headphones, Plus, ArrowRight, Trash2, Eye, Music } from 'lucide-react'
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
  isReady: boolean
  isMixing: boolean
}

export default function AudioSetsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [visionId, setVisionId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [audioSets, setAudioSets] = useState<AudioSet[]>([])
  const [vision, setVision] = useState<any>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [selectedAudioSetId, setSelectedAudioSetId] = useState<string | null>(null)
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([])
  const [loadingTracks, setLoadingTracks] = useState(false)

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
    
    // Calculate correct version number
    if (v) {
      try {
        const { data: calculatedVersionNumber } = await supabase
          .rpc('get_vision_version_number', { p_vision_id: v.id })
        
        v.version_number = calculatedVersionNumber || v.version_number || 1
      } catch (error) {
        console.warn('Could not calculate version number, using stored:', error)
      }
    }
    
    setVision(v)

    // Load audio sets
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
        voice_id: set.voice_id,
        is_active: set.is_active,
        created_at: set.created_at,
        track_count: set.audio_tracks?.[0]?.count || 0,
        isReady: !!(hasCompletedVoice && (set.variant === 'standard' || hasCompletedMixing)),
        isMixing: !!isMixing,
      }
    }))

    setAudioSets(setsWithStatus)
    
    // Auto-select first ready audio set
    const firstReadySet = setsWithStatus.find(s => s.isReady)
    if (firstReadySet) {
      setSelectedAudioSetId(firstReadySet.id)
      await loadAudioTracks(firstReadySet.id)
    }
    
    setLoading(false)
  }

  async function loadAudioTracks(audioSetId: string) {
    setLoadingTracks(true)
    const supabase = createClient()

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
      setLoadingTracks(false)
      return
    }

    // Build section map for titles
    const sectionMap = new Map<string, string>()
    sectionMap.set('forward', 'Forward')
    sectionMap.set('fun', 'Fun')
    sectionMap.set('health', 'Health')
    sectionMap.set('travel', 'Travel')
    sectionMap.set('love', 'Love')
    sectionMap.set(assessmentToVisionKey('romance'), 'Love')
    sectionMap.set('family', 'Family')
    sectionMap.set('social', 'Social')
    sectionMap.set('home', 'Home')
    sectionMap.set('work', 'Work')
    sectionMap.set(assessmentToVisionKey('business'), 'Work')
    sectionMap.set('money', 'Money')
    sectionMap.set('stuff', 'Stuff')
    sectionMap.set(assessmentToVisionKey('possessions'), 'Stuff')
    sectionMap.set('giving', 'Giving')
    sectionMap.set('spirituality', 'Spirituality')
    sectionMap.set('conclusion', 'Conclusion')

    const canonicalOrder = [
      'forward',
      'fun',
      'health',
      'travel',
      'love',
      'family',
      'social',
      'home',
      'work',
      'money',
      'stuff',
      'giving',
      'spirituality',
      'conclusion'
    ]
    
    const formattedTracks: AudioTrack[] = tracks
      .map(track => {
        const url = track.mixed_audio_url && track.mix_status === 'completed' 
          ? track.mixed_audio_url 
          : track.audio_url
        
        return {
          id: track.id,
          title: sectionMap.get(track.section_key) || track.section_key,
          artist: '',
          duration: track.duration_seconds || 0,
          url: url || '',
          thumbnail: '',
          sectionKey: track.section_key
        }
      })
      .filter(track => track.url && track.url.length > 0)
      .sort((a: any, b: any) => {
        const indexA = canonicalOrder.indexOf(a.sectionKey)
        const indexB = canonicalOrder.indexOf(b.sectionKey)
        if (indexA === -1) return 1
        if (indexB === -1) return -1
        return indexA - indexB
      })

    setAudioTracks(formattedTracks)
    setLoadingTracks(false)
  }

  const handleDelete = async (setId: string, setName: string) => {
    if (!confirm(`Are you sure you want to delete "${setName}"? This will delete all audio tracks in this version. This action cannot be undone.`)) {
      return
    }

    setDeleting(setId)
    const supabase = createClient()

    try {
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
        
        // If deleted set was selected, clear selection
        if (selectedAudioSetId === setId) {
          setSelectedAudioSetId(null)
          setAudioTracks([])
          // Auto-select next available set
          const remainingSets = audioSets.filter(s => s.id !== setId && s.isReady)
          if (remainingSets.length > 0) {
            setSelectedAudioSetId(remainingSets[0].id)
            await loadAudioTracks(remainingSets[0].id)
          }
        }
      }
    } catch (error) {
      console.error('Error deleting audio set:', error)
      alert('Failed to delete audio version. Please try again.')
    } finally {
      setDeleting(null)
    }
  }

  const handleSelectSet = async (setId: string) => {
    setSelectedAudioSetId(setId)
    await loadAudioTracks(setId)
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

  const getVariantDisplayInfo = (variant: string) => {
    switch (variant) {
      case 'sleep':
        return {
          title: 'Sleep (Ocean Waves)',
          description: '30% voice, 70% background'
        }
      case 'energy':
        return {
          title: 'Energy',
          description: '80% voice, 20% background'
        }
      case 'meditation':
        return {
          title: 'Meditation',
          description: '50% voice, 50% background'
        }
      default:
        return {
          title: 'Voice Only',
          description: 'Pure voice narration'
        }
    }
  }

  const totalSets = audioSets.length
  const readySets = audioSets.filter(s => s.isReady).length
  const totalTracks = audioSets.reduce((sum, s) => sum + s.track_count, 0)

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Hero Header */}
        <div className="relative p-[2px] rounded-2xl bg-gradient-to-br from-[#39FF14]/30 via-[#14B8A6]/20 to-[#BF00FF]/30">
          <div className="relative p-4 md:p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-[#39FF14]/10 via-[#14B8A6]/5 to-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="relative z-10">
              {/* Eyebrow */}
              <div className="text-center mb-4">
                <div className="text-[10px] md:text-xs uppercase tracking-[0.35em] text-primary-500/80 font-semibold">
                  THE LIFE I CHOOSE
                </div>
              </div>
              
              {/* Title Section */}
              <div className="text-center mb-4">
                <h1 className="text-2xl md:text-5xl font-bold leading-tight text-white">
                  Life Vision Audio Sets
                </h1>
              </div>
              
              {/* Version Badge */}
              {vision && (
                <div className="flex justify-center mb-4">
                  <div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-neutral-900/60 border border-neutral-700/50 backdrop-blur-sm">
                    <VersionBadge 
                      versionNumber={vision.version_number} 
                      status={vision.is_active ? 'active' : (vision.is_draft ? 'draft' : 'complete')} 
                    />
                    <StatusBadge 
                      status={vision.is_active ? 'active' : (vision.is_draft ? 'draft' : 'complete')} 
                      subtle={!vision.is_active} 
                      className="uppercase tracking-[0.25em]" 
                    />
                    <div className="flex items-center gap-1.5 text-neutral-300 text-xs md:text-sm">
                      <CalendarDays className="w-4 h-4 text-neutral-500" />
                      <span className="font-medium">Created:</span>
                      <span>{new Date(vision.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-row flex-wrap lg:flex-nowrap gap-2 md:gap-4 max-w-2xl mx-auto">
                <Button
                  onClick={() => router.push(`/life-vision/${visionId}`)}
                  variant="outline"
                  size="sm"
                  className="flex-1 flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
                >
                  <Eye className="w-4 h-4 shrink-0" />
                  <span>View Vision</span>
                </Button>
                
                <Button
                  onClick={() => router.push(`/life-vision/audio`)}
                  variant="outline"
                  size="sm"
                  className="flex-1 flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
                >
                  <Headphones className="w-4 h-4 shrink-0" />
                  <span>All Vision Audios</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4 md:gap-6">
          <TrackingMilestoneCard
            label="Audio Sets"
            value={totalSets}
            theme="accent"
          />
          <TrackingMilestoneCard
            label="Total Tracks"
            value={totalTracks}
            theme="secondary"
          />
        </div>

        {/* Generate More Button */}
        <Card variant="elevated" className="bg-gradient-to-br from-[#199D67]/20 via-[#14B8A6]/10 to-[#8B5CF6]/20 border-[#39FF14]/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/life-vision/${visionId}/audio-generate`}>
                <div className="w-12 h-12 bg-[#39FF14]/20 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-[#39FF14]/30 transition-all duration-200">
                  <Plus className="w-6 h-6 text-[#39FF14]" />
                </div>
              </Link>
              <div>
                <p className="text-white font-semibold text-lg">Want more sets?</p>
                <p className="text-sm text-neutral-300">Create in audio studio</p>
              </div>
            </div>
            <Button variant="primary" asChild>
              <Link href={`/life-vision/${visionId}/audio-generate`}>
                Audio Studio
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </Card>

        {/* Audio Sets Grid */}
        {audioSets.length === 0 ? (
          <Card variant="elevated" className="p-8 md:p-12 text-center">
            <Music className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Audio Sets Yet</h3>
            <p className="text-neutral-400 mb-6">Create your first audio set to bring your vision to life through sound.</p>
            <Button variant="primary" asChild>
              <Link href={`/life-vision/${visionId}/audio-generate`}>
                <Plus className="w-4 h-4 mr-2" />
                Create Audio Set
              </Link>
            </Button>
          </Card>
        ) : (
          <>
            {/* Audio Sets Selection */}
            <div>
              <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Select Audio Set</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {audioSets.map((set) => (
                  <Card
                    key={set.id}
                    variant="elevated"
                    hover
                    className={`cursor-pointer transition-all ${
                      selectedAudioSetId === set.id 
                        ? 'border-primary-500 bg-primary-500/10 -translate-y-1' 
                        : ''
                    }`}
                    onClick={() => {
                      if (set.isReady) {
                        handleSelectSet(set.id)
                      }
                    }}
                  >
                    <Stack gap="md">
                      {/* Header with icon and delete */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getVariantColor(set.variant)}`}>
                            {getVariantIcon(set.variant)}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-base md:text-lg font-semibold text-white">{set.name}</h3>
                            <p className="text-xs md:text-sm text-neutral-400">{set.description}</p>
                          </div>
                        </div>
                        <Button 
                          variant="danger" 
                          size="sm"
                          disabled={deleting === set.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(set.id, set.name)
                          }}
                          className="flex-shrink-0"
                        >
                          {deleting === set.id ? (
                            <Spinner size="sm" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>

                      {/* Status and Info */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                        <span>{set.track_count} tracks</span>
                        <span>•</span>
                        <span>{new Date(set.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        {set.isReady ? (
                          <Badge variant="success" className="text-xs">Ready</Badge>
                        ) : set.isMixing ? (
                          <Badge variant="info" className="text-xs">
                            <Spinner size="sm" className="w-3 h-3 mr-1" />
                            Mixing
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="text-xs">Processing</Badge>
                        )}
                      </div>

                      {/* Selected Indicator */}
                      {selectedAudioSetId === set.id && (
                        <div className="pt-2 border-t border-primary-500/30">
                          <div className="flex items-center gap-2 text-primary-500 text-sm font-medium">
                            <Play className="w-4 h-4" />
                            <span>Now Playing</span>
                          </div>
                        </div>
                      )}
                    </Stack>
                  </Card>
                ))}
              </div>
            </div>

            {/* Audio Player */}
            {selectedAudioSetId && (
              <Card variant="elevated">
                {/* Selected Set Header */}
                <div className="mb-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getVariantColor(audioSets.find(s => s.id === selectedAudioSetId)?.variant || '')}`}>
                        {getVariantIcon(audioSets.find(s => s.id === selectedAudioSetId)?.variant || '')}
                      </div>
                      <div>
                        <h2 className="text-lg md:text-xl font-semibold text-white">
                          {audioSets.find(s => s.id === selectedAudioSetId)?.name}
                        </h2>
                        <p className="text-sm text-neutral-400">
                          {audioSets.find(s => s.id === selectedAudioSetId)?.description}
                        </p>
                      </div>
                    </div>
                    <Badge variant="success" className="text-xs">Playing</Badge>
                  </div>
                  
                  {/* Set Info */}
                  <div className="flex flex-wrap gap-3 text-sm text-neutral-400">
                    <span>Voice: <span className="text-white capitalize">{audioSets.find(s => s.id === selectedAudioSetId)?.voice_id}</span></span>
                    <span>•</span>
                    <span><span className="text-white">{audioTracks.length}</span> tracks</span>
                    <span>•</span>
                    <span>Created: <span className="text-white">{new Date(audioSets.find(s => s.id === selectedAudioSetId)?.created_at || '').toLocaleDateString()}</span></span>
                  </div>
                </div>

                {/* Playlist Player */}
                {loadingTracks ? (
                  <div className="flex items-center justify-center py-12">
                    <Spinner size="lg" />
                  </div>
                ) : audioTracks.length > 0 ? (
                  <div className="rounded-2xl p-4 md:p-6 bg-[#1F1F1F] border-2 border-[#333]">
                    <PlaylistPlayer tracks={audioTracks} />
                  </div>
                ) : (
                  <Card variant="glass" className="p-8 text-center">
                    <Music className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                    <p className="text-neutral-400">No audio tracks available for this set</p>
                  </Card>
                )}
              </Card>
            )}
          </>
        )}
      </Stack>
    </Container>
  )
}
