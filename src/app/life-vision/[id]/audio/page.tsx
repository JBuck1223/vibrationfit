"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Container, Stack, Badge } from '@/lib/design-system/components'
import { PlaylistPlayer, type AudioTrack } from '@/lib/design-system'
import { createClient } from '@/lib/supabase/client'
import { Headphones, Play, Clock, CheckCircle, Music, Moon, Zap, Sparkles, ArrowRight, Volume2, Target, Mic, Plus, Eye } from 'lucide-react'
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
  const [visionCount, setVisionCount] = useState(0)
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([])
  const [selectedAudioSetId, setSelectedAudioSetId] = useState<string | null>(null)
  const [showAudioSetDropdown, setShowAudioSetDropdown] = useState(false)

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
    
    // Calculate correct version number using RPC function
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

    // Get total vision count for this user
    if (v) {
      const { count } = await supabase
        .from('vision_versions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', v.user_id)
      
      setVisionCount(count || 0)
    }

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
    
    // Auto-select first ready audio set for playlist
    const firstReadySet = setsWithStatus.find(s => s.isReady)
    if (firstReadySet && !selectedAudioSetId) {
      setSelectedAudioSetId(firstReadySet.id)
      await loadAudioTracks(firstReadySet.id)
    }
    
    setLoading(false)
  }

  async function loadAudioTracks(audioSetId: string) {
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
      return
    }

    // Build section map for titles
    const sectionMap = new Map<string, string>()
    sectionMap.set('meta_intro', 'Forward')
    sectionMap.set('fun', 'Fun')
    sectionMap.set('health', 'Health')
    sectionMap.set('travel', 'Travel')
    sectionMap.set('love', 'Love')
    sectionMap.set('romance', 'Love')  // Legacy mapping
    sectionMap.set('family', 'Family')
    sectionMap.set('social', 'Social')
    sectionMap.set('home', 'Home')
    sectionMap.set('work', 'Work')
    sectionMap.set('business', 'Work')  // Legacy mapping
    sectionMap.set('money', 'Money')
    sectionMap.set('stuff', 'Stuff')
    sectionMap.set('possessions', 'Stuff')  // Legacy mapping
    sectionMap.set('giving', 'Giving')
    sectionMap.set('spirituality', 'Spirituality')
    sectionMap.set('meta_outro', 'Conclusion')

    // Map legacy section keys to current ones for sorting
    const sectionKeyNormalizer = new Map<string, string>()
    sectionKeyNormalizer.set('romance', 'love')
    sectionKeyNormalizer.set('business', 'work')
    sectionKeyNormalizer.set('possessions', 'stuff')

    // Build canonical order for sorting
    const canonicalOrder = [
      'meta_intro',
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
      'meta_outro'
    ]
    
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
          artist: '',
          duration: track.duration_seconds || 0,
          url: url || '',
          thumbnail: '',
          sectionKey: track.section_key
        }
      })
      .filter(track => track.url && track.url.length > 0)
      .sort((a: any, b: any) => {
        // Normalize legacy section keys before sorting
        const normalizedA = sectionKeyNormalizer.get(a.sectionKey) || a.sectionKey
        const normalizedB = sectionKeyNormalizer.get(b.sectionKey) || b.sectionKey
        
        const indexA = canonicalOrder.indexOf(normalizedA)
        const indexB = canonicalOrder.indexOf(normalizedB)
        // If not found, put at end
        if (indexA === -1) return 1
        if (indexB === -1) return -1
        return indexA - indexB
      })

    setAudioTracks(formattedTracks)
  }

  // Load tracks when selected audio set changes
  useEffect(() => {
    if (selectedAudioSetId) {
      loadAudioTracks(selectedAudioSetId)
    }
  }, [selectedAudioSetId])

  const getVariantIcon = (variant: string) => {
    switch (variant) {
      case 'sleep':
        return <Moon className="w-5 h-5" />
      case 'energy':
        return <Zap className="w-5 h-5" />
      case 'meditation':
        return <Sparkles className="w-5 h-5" />
      default:
        return <Mic className="w-5 h-5" />
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
          description: '10% voice, 90% background'
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
        {/* Centered Hero Title */}
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
              
              {/* Version Badge at Bottom */}
              {vision && (
                <div className="flex justify-center mb-4">
                  <div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-neutral-900/60 border border-neutral-700/50 backdrop-blur-sm">
                    <span className="w-7 h-7 flex items-center justify-center bg-[#39FF14] text-black rounded-full text-xs font-semibold">
                      V{vision.version_number}
                    </span>
                    <div className="flex items-center px-3 py-2 md:px-5 bg-neutral-800/50 border border-neutral-700 rounded-lg text-xs md:text-sm">
                      {new Date(vision.created_at).toLocaleDateString()}
                    </div>
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs md:text-sm font-semibold border bg-green-500/20 text-green-400 border-green-500/30 !bg-[#39FF14] !text-black !border-[#39FF14]">
                      <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1" />
                      Active
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-row flex-wrap md:flex-nowrap gap-2 md:gap-4 max-w-2xl mx-auto">
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
        <div className="grid grid-cols-2 gap-4">
          <Card variant="glass" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-accent-500/20 rounded-full flex items-center justify-center">
                <Headphones className="w-6 h-6 text-accent-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalSets}</p>
                <p className="text-xs text-neutral-400">Audio Sets</p>
              </div>
            </div>
          </Card>

          <Card variant="glass" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#06B6D4]/20 rounded-full flex items-center justify-center">
                <Volume2 className="w-6 h-6 text-[#06B6D4]" />
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

        {/* Audio Playlist Player */}
        {audioSets.length > 0 && readySets > 0 && (
          <Card variant="elevated">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <h3 className="text-2xl md:text-3xl font-semibold text-white flex items-center gap-3">
                <span className="w-7 h-7 flex items-center justify-center bg-[#39FF14] text-black rounded-full text-xs font-semibold">
                  V{vision?.version_number || 1}
                </span>
                Audio Playlist
              </h3>
              {audioSets.filter(s => s.isReady).length > 0 && (
                <div className="relative w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAudioSetDropdown(!showAudioSetDropdown)}
                    className="w-full sm:w-auto"
                  >
                    Select Audio Set ({audioSets.filter(s => s.isReady).length})
                  </Button>
                  {showAudioSetDropdown && (
                    <div className="absolute right-0 mt-2 w-full sm:w-96 bg-black/95 backdrop-blur-lg border-2 border-neutral-700 rounded-lg shadow-xl z-10 p-3 max-h-[60vh] overflow-y-auto">
                      {audioSets.filter(s => s.isReady).map((set) => (
                        <Card
                          key={set.id}
                          variant="elevated"
                          hover
                          className={`cursor-pointer mb-3 last:mb-0 ${
                            set.id === selectedAudioSetId 
                              ? 'border-primary-500 bg-primary-500/10' 
                              : ''
                          }`}
                          onClick={() => {
                            setSelectedAudioSetId(set.id)
                            setShowAudioSetDropdown(false)
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${getVariantColor(set.variant)}`}>
                              {getVariantIcon(set.variant)}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-white">{getVariantDisplayInfo(set.variant).title}</div>
                              <div className="text-sm text-neutral-400">{getVariantDisplayInfo(set.variant).description}</div>
                            </div>
                            {set.id === selectedAudioSetId && (
                              <Badge variant="success" className="text-xs">Playing</Badge>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Audio Set Info */}
            {selectedAudioSetId && audioSets.find(s => s.id === selectedAudioSetId) && (
              <Card variant="elevated" className="p-4 mb-6">
                {(() => {
                  const selectedSet = audioSets.find(s => s.id === selectedAudioSetId)!
                  return (
                    <>
                      {/* Mobile: Icon + Title + Badge in one row, Description below */}
                      <div className="md:hidden">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${getVariantColor(selectedSet.variant)}`}>
                              {getVariantIcon(selectedSet.variant)}
                            </div>
                            <h2 className="text-lg font-semibold text-white">{selectedSet.name}</h2>
                          </div>
                          <Badge variant="success" className="text-xs">Playing</Badge>
                        </div>
                        {selectedSet.description && (
                          <p className="text-sm text-neutral-400 mb-3">{selectedSet.description}</p>
                        )}
                      </div>

                      {/* Desktop: Original layout */}
                      <div className="hidden md:flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getVariantColor(selectedSet.variant)}`}>
                            {getVariantIcon(selectedSet.variant)}
                          </div>
                          <div>
                            <h2 className="text-lg font-semibold text-white">{selectedSet.name}</h2>
                            {selectedSet.description && (
                              <p className="text-sm text-neutral-400">{selectedSet.description}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant="success" className="text-xs">Playing</Badge>
                      </div>
                      
                      {/* Audio Set Info Row */}
                      <div className="flex flex-wrap gap-3 text-sm text-neutral-400">
                        <span>Created: <span className="text-white">{new Date(selectedSet.createdAt).toLocaleDateString()}</span></span>
                        <span>•</span>
                        {selectedSet.voiceId && (
                          <>
                            <span>Voice: <span className="text-white capitalize">{selectedSet.voiceId}</span></span>
                            <span>•</span>
                          </>
                        )}
                        <span><span className="text-white">{audioTracks.length}</span> tracks</span>
                      </div>
                    </>
                  )
                })()}
              </Card>
            )}

            {/* Playlist Player */}
            {audioTracks.length > 0 ? (
              <div className="rounded-2xl p-4 md:p-6 lg:p-8 bg-[#1F1F1F] border-2 border-[#333] shadow-xl">
                <PlaylistPlayer tracks={audioTracks} />
              </div>
            ) : (
              <Card variant="glass" className="p-8 text-center">
                <Music className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                <p className="text-neutral-400 mb-4">No audio tracks available for this set</p>
              </Card>
            )}
          </Card>
        )}
      </Stack>
    </Container>
  )
}


