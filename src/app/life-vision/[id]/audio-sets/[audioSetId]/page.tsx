"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Container, Stack, Badge, Spinner, VersionBadge, StatusBadge } from '@/lib/design-system/components'
import { PlaylistPlayer, type AudioTrack } from '@/lib/design-system'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Circle, History, Play, Moon, Zap, Sparkles, Headphones, Eye, Music } from 'lucide-react'
import { Icon } from '@/lib/design-system'
import { getVisionCategoryKeys } from '@/lib/design-system'
import { assessmentToVisionKey } from '@/lib/design-system/vision-categories'

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

    // Build section map for titles - use proper capitalized labels
    const sectionMap = new Map<string, string>()
    sectionMap.set('meta_intro', 'Forward')
    sectionMap.set('fun', 'Fun')
    sectionMap.set('health', 'Health')
    sectionMap.set('travel', 'Travel')
    sectionMap.set('love', 'Love')
    sectionMap.set(assessmentToVisionKey('romance'), 'Love')  // Legacy mapping
    sectionMap.set('family', 'Family')
    sectionMap.set('social', 'Social')
    sectionMap.set('home', 'Home')
    sectionMap.set('work', 'Work')
    sectionMap.set(assessmentToVisionKey('business'), 'Work')  // Legacy mapping
    sectionMap.set('money', 'Money')
    sectionMap.set('stuff', 'Stuff')
    sectionMap.set(assessmentToVisionKey('possessions'), 'Stuff')  // Legacy mapping
    sectionMap.set('giving', 'Giving')
    sectionMap.set('spirituality', 'Spirituality')
    sectionMap.set('meta_outro', 'Conclusion')

    // Map legacy section keys to current ones for sorting
    const sectionKeyNormalizer = new Map<string, string>()
    sectionKeyNormalizer.set('romance', assessmentToVisionKey('romance'))
    sectionKeyNormalizer.set('business', assessmentToVisionKey('business'))
    sectionKeyNormalizer.set('possessions', assessmentToVisionKey('possessions'))

    // Build canonical order for sorting - always use this exact order
    const canonicalOrder = [
      'meta_intro',    // Forward
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
      'meta_outro'     // Conclusion
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
      .sort((a, b) => {
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

  // Determine display status based on is_active and is_draft
  const getDisplayStatus = () => {
    if (!vision) return 'complete'
    const isActive = vision.is_active === true
    const isDraft = vision.is_draft === true
    
    if (isActive && !isDraft) return 'active'
    else if (!isActive && isDraft) return 'draft'
    else return 'complete'
  }

  return (
    <Container size="lg">
      <Stack gap="lg">

        {/* Header */}
        <div className="mb-4">
          {/* Gradient Border Wrapper */}
          <div className="relative p-[2px] rounded-2xl bg-gradient-to-br from-[#39FF14]/30 via-[#14B8A6]/20 to-[#BF00FF]/30">
            {/* Inner Card with Gradient Background */}
            <div className="relative p-4 md:p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-[#39FF14]/10 via-[#14B8A6]/5 to-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              
              <div className="relative z-10">
                
                {/* Title Section */}
                <div className="text-center mb-4">
                  <h1 className="text-xl md:text-4xl lg:text-5xl font-bold leading-tight text-white">
                    Life Vision Audio Sets
                  </h1>
                </div>
                
                {/* Version Info & Status Badges */}
                {vision && (
                  <div className="text-center mb-6">
                    <div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-neutral-900/60 border border-neutral-700/50 backdrop-blur-sm">
                      
                      {/* Version Circle Badge - Color matches status */}
                      <VersionBadge 
                        versionNumber={vision.version_number || 1} 
                        status={getDisplayStatus()} 
                      />
                      
                      {/* Status Badge - Active gets solid, others get subtle */}
                      <StatusBadge 
                        status={getDisplayStatus()} 
                        subtle={getDisplayStatus() !== 'active'}
                        className="uppercase tracking-[0.25em]"
                      />
                      
                      {/* Created Date */}
                      <span className="text-neutral-300 text-xs md:text-sm">
                        Created: {new Date(vision.created_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                      </span>
                      
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
                    onClick={() => router.push(`/life-vision/${visionId}/audio`)}
                    variant="outline"
                    size="sm"
                    className="flex-1 flex items-center justify-center gap-1 md:gap-2 hover:-translate-y-0.5 transition-all duration-300 text-xs md:text-sm"
                  >
                    <Music className="w-4 h-4 shrink-0" />
                    <span>All Audio Sets</span>
                  </Button>
                  
                </div>
                
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-2xl md:text-4xl font-bold text-white">
            {audioSet?.name || 'Audio Player'}
          </h2>
          {allAudioSets.length > 1 && (
            <div className="relative w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllDropdown(!showAllDropdown)}
                className="w-full sm:w-auto"
              >
                See All ({allAudioSets.length})
              </Button>
              {showAllDropdown && (
                <div className="absolute right-0 mt-2 w-full sm:w-96 bg-black/95 backdrop-blur-lg border-2 border-neutral-700 rounded-lg shadow-xl z-10 p-3 max-h-[60vh] overflow-y-auto">
                  {allAudioSets.map((set) => (
                    <Card
                      key={set.id}
                      variant="elevated"
                      hover
                      className={`cursor-pointer mb-3 last:mb-0 ${
                        set.id === audioSetId 
                          ? 'border-primary-500 bg-primary-500/10' 
                          : ''
                      }`}
                      onClick={() => {
                        router.push(`/life-vision/${visionId}/audio-sets/${set.id}`)
                        setShowAllDropdown(false)
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
                        {set.id === audioSetId && (
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

        {/* Audio Set Info */}
        {audioSet && vision && (
          <Card variant="elevated" className="p-4">
            {/* Mobile: Icon + Title + Badge in one row, Description below */}
            <div className="md:hidden">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getVariantColor(audioSet.variant)}`}>
                    {getVariantIcon(audioSet.variant)}
                  </div>
                  <h2 className="text-lg font-semibold text-white">{audioSet.name}</h2>
                </div>
                <StatusBadge 
                  status={!vision.is_draft ? (vision.is_active ? 'active' : 'complete') : 'draft'}
                  subtle={!vision.is_active}
                  showIcon={true}
                  className="uppercase tracking-[0.25em]"
                />
              </div>
              {audioSet.description && (
                <p className="text-sm text-neutral-400 mb-3">{audioSet.description}</p>
              )}
            </div>

            {/* Desktop: Original layout */}
            <div className="hidden md:flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getVariantColor(audioSet.variant)}`}>
                  {getVariantIcon(audioSet.variant)}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{audioSet.name}</h2>
                  <p className="text-sm text-neutral-400">{audioSet.description}</p>
                </div>
              </div>
              <StatusBadge 
                status={!vision.is_draft ? (vision.is_active ? 'active' : 'complete') : 'draft'}
                subtle={!vision.is_active}
                showIcon={true}
                className="uppercase tracking-[0.25em]"
              />
            </div>
            
            {/* Audio Set Info Row */}
            <div className="flex flex-wrap gap-3 text-sm text-neutral-400">
              <span>Created: <span className="text-white">{new Date(audioSet.created_at).toLocaleDateString()}</span></span>
              <span>•</span>
              <span>Voice: <span className="text-white capitalize">{audioSet.voice_id}</span></span>
              <span>•</span>
              <span><span className="text-white">{audioTracks.length}</span> tracks</span>
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
