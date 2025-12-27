"use client"
import React, { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button, Card, Spinner, Badge, Container, Stack, VersionBadge, StatusBadge, PageHero } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { Headphones, CheckCircle, Play, CalendarDays, Sparkles, Music, X, AlertCircle, Wand2, Eye, Music2, ListMusic, TestTube } from 'lucide-react'
import Link from 'next/link'
import { getVisionCategoryKeys } from '@/lib/design-system'

interface Voice {
  id: string
  name: string
  previewUrl?: string
}

interface ExistingVoiceSet {
  id: string
  voice_id: string
  voice_name: string
  created_at: string
  track_count: number
}

interface BackgroundTrack {
  id: string
  name: string
  display_name: string
  category: string
  file_url: string
  description?: string
  frequency_hz?: number
  brainwave_hz?: number
}

interface MixRatio {
  id: string
  name: string
  voice_volume: number
  bg_volume: number
  description?: string
  icon?: string
}

interface SectionOption {
  key: string
  displayName: string
  text: string
}

// Helper function to calculate adjusted volumes when binaural is added
function calculateAdjustedVolumes(voiceVol: number, bgVol: number, binauralVol: number) {
  if (binauralVol === 0) {
    return { voice: voiceVol, bg: bgVol, binaural: 0 }
  }
  
  const remaining = 100 - binauralVol
  const total = voiceVol + bgVol
  
  return {
    voice: Math.round((voiceVol / total) * remaining),
    bg: Math.round((bgVol / total) * remaining),
    binaural: binauralVol
  }
}

// Helper function to handle audio preview
function handlePreview(
  e: React.MouseEvent, 
  trackUrl: string, 
  trackId: string, 
  currentPreviewingTrack: string | null, 
  setPreviewingTrack: (id: string | null) => void, 
  audioRef: React.RefObject<HTMLAudioElement | null>
) {
  e.preventDefault()
  e.stopPropagation()
  
  if (currentPreviewingTrack === trackId) {
    // Stop preview
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setPreviewingTrack(null)
  } else {
    // Start preview
    if (audioRef.current) {
      audioRef.current.src = trackUrl
      audioRef.current.play().catch(err => console.error('Audio play error:', err))
    }
    setPreviewingTrack(trackId)
  }
}

export default function SingleTrackGeneratorPage() {
  const params = useParams()
  const visionId = params?.id as string
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [vision, setVision] = useState<any>(null)
  
  // Section selection
  const [sections, setSections] = useState<SectionOption[]>([])
  const [selectedSection, setSelectedSection] = useState<string>('')
  
  // Voice selection
  const voices: Voice[] = [
    { id: 'alloy', name: 'Fresh and Modern (Male)' },
    { id: 'echo', name: 'Warm and Inviting (Male)' },
    { id: 'fable', name: 'Smooth and Expressive (Male)' },
    { id: 'onyx', name: 'Deep and Authoritative (Male)' },
    { id: 'nova', name: 'Fresh and Modern (Female)' },
    { id: 'shimmer', name: 'Warm and Inviting (Female)' }
  ]
  const [existingVoiceSets, setExistingVoiceSets] = useState<ExistingVoiceSet[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string>('')
  
  // Audio track selection
  const [backgroundTracks, setBackgroundTracks] = useState<BackgroundTrack[]>([])
  const [selectedBackgroundTrack, setSelectedBackgroundTrack] = useState<string>('')
  
  // Mix ratio selection
  const [mixRatios, setMixRatios] = useState<MixRatio[]>([])
  const [selectedMixRatio, setSelectedMixRatio] = useState<string>('')
  
  // Binaural enhancement
  const [binauralTracks, setBinauralTracks] = useState<BackgroundTrack[]>([])
  const [selectedBinauralTrack, setSelectedBinauralTrack] = useState<string>('')
  const [binauralVolume, setBinauralVolume] = useState(0)
  const [binauralFilter, setBinauralFilter] = useState<string>('all')
  
  // Audio preview
  const [previewingBgTrack, setPreviewingBgTrack] = useState<string | null>(null)
  const [previewingBinauralTrack, setPreviewingBinauralTrack] = useState<string | null>(null)
  const bgAudioRef = useRef<HTMLAudioElement | null>(null)
  const binauralAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      bgAudioRef.current = new Audio()
      binauralAudioRef.current = new Audio()
      
      // Cleanup
      return () => {
        if (bgAudioRef.current) {
          bgAudioRef.current.pause()
          bgAudioRef.current.src = ''
        }
        if (binauralAudioRef.current) {
          binauralAudioRef.current.pause()
          binauralAudioRef.current.src = ''
        }
      }
    }
  }, [])

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      
      // Load vision
      const { data: visionData } = await supabase
        .from('vision_versions')
        .select('*')
        .eq('id', visionId)
        .single()
      
      if (visionData) {
        setVision(visionData)
        
        // Build sections list
        const categoryKeys = getVisionCategoryKeys().filter(k => k !== 'forward' && k !== 'conclusion')
        const sectionsList: SectionOption[] = [
          { key: 'forward', displayName: 'Forward', text: visionData.forward || '' },
          ...categoryKeys.map(key => ({ 
            key, 
            displayName: key.charAt(0).toUpperCase() + key.slice(1),
            text: visionData[key] || '' 
          })),
          { key: 'conclusion', displayName: 'Conclusion', text: visionData.conclusion || '' }
        ].filter(s => s.text.trim().length > 0)
        
        setSections(sectionsList)
        if (sectionsList.length > 0) {
          setSelectedSection(sectionsList[0].key)
        }
      }
      
      // Load existing voice sets
      const { data: voiceSetsData } = await supabase
        .from('audio_sets')
        .select('id, voice_id, name, created_at')
        .eq('vision_id', visionId)
        .eq('variant', 'standard')
        .order('created_at', { ascending: false })
      
      if (voiceSetsData) {
        // Group by voice_id and count tracks
        const voiceSetMap = new Map<string, ExistingVoiceSet>()
        
        for (const set of voiceSetsData) {
          const { count } = await supabase
            .from('audio_tracks')
            .select('*', { count: 'exact', head: true })
            .eq('audio_set_id', set.id)
            .eq('status', 'completed')
          
          const existing = voiceSetMap.get(set.voice_id)
          if (!existing || new Date(set.created_at) > new Date(existing.created_at)) {
            voiceSetMap.set(set.voice_id, {
              id: set.id,
              voice_id: set.voice_id,
              voice_name: set.name,
              created_at: set.created_at,
              track_count: count || 0
            })
          }
        }
        
        const voiceSets = Array.from(voiceSetMap.values())
        setExistingVoiceSets(voiceSets)
        
        // Auto-select first voice if available
        if (voiceSets.length > 0) {
          setSelectedVoice(voiceSets[0].voice_id)
        }
      }
      
      // Load background tracks
      const { data: bgTracks } = await supabase
        .from('audio_background_tracks')
        .select('*')
        .in('category', ['nature', 'music', 'noise'])
        .eq('is_active', true)
        .order('sort_order')
      
      if (bgTracks) {
        setBackgroundTracks(bgTracks)
      }
      
      // Load binaural tracks
      const { data: binTracks } = await supabase
        .from('audio_background_tracks')
        .select('*')
        .in('category', ['binaural', 'solfeggio'])
        .eq('is_active', true)
        .order('sort_order')
      
      if (binTracks) {
        setBinauralTracks(binTracks)
      }
      
      // Load mix ratios
      const { data: ratios } = await supabase
        .from('audio_mix_ratios')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      
      if (ratios) {
        setMixRatios(ratios)
      }
      
      setLoading(false)
    }
    
    loadData()
  }, [visionId])

  async function handleGenerateSingleTrack() {
    if (!selectedSection) {
      alert('Please select a section to generate')
      return
    }
    if (!selectedVoice) {
      alert('Please select a voice')
      return
    }
    if (!selectedBackgroundTrack) {
      alert('Please select a background track')
      return
    }
    if (!selectedMixRatio) {
      alert('Please select a mix ratio')
      return
    }
    
    // Verify that voice-only tracks exist for this voice
    const selectedVoiceSet = existingVoiceSets.find(set => set.voice_id === selectedVoice)
    if (!selectedVoiceSet || selectedVoiceSet.track_count === 0) {
      alert('⚠️ No voice-only tracks found for this voice. Please generate voice-only tracks first from the main generator.')
      return
    }

    setGenerating(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('You must be logged in to generate audio')
        setGenerating(false)
        return
      }

      // Get the selected section's text
      const section = sections.find(s => s.key === selectedSection)
      if (!section) {
        alert('Section not found')
        setGenerating(false)
        return
      }

      const sectionsPayload = [{
        sectionKey: section.key,
        text: section.text
      }]

      // Get selected track and ratio details
      const selectedTrack = backgroundTracks.find(t => t.id === selectedBackgroundTrack)
      const selectedRatio = mixRatios.find(r => r.id === selectedMixRatio)
      const selectedBinaural = selectedBinauralTrack 
        ? binauralTracks.find(t => t.id === selectedBinauralTrack)
        : null

      if (!selectedTrack || !selectedRatio) {
        alert('Invalid track or ratio selection')
        setGenerating(false)
        return
      }

      // Create batch with custom mix metadata
      const { data: batch, error: batchError } = await supabase
        .from('audio_generation_batches')
        .insert({
          user_id: user.id,
          vision_id: visionId,
          variant_ids: ['custom-single-test'],
          voice_id: selectedVoice,
          sections_requested: sectionsPayload,
          total_tracks_expected: 1,
          status: 'pending',
          metadata: {
            custom_mix: true,
            single_track_test: true,
            background_track_id: selectedBackgroundTrack,
            background_track_url: selectedTrack.file_url,
            mix_ratio_id: selectedMixRatio,
            voice_volume: selectedRatio.voice_volume,
            bg_volume: selectedRatio.bg_volume,
            ...(selectedBinaural && {
              binaural_track_id: selectedBinauralTrack,
              binaural_track_url: selectedBinaural.file_url,
              binaural_volume: binauralVolume
            })
          }
        })
        .select()
        .single()

      if (batchError || !batch) {
        console.error('Failed to create batch:', batchError)
        alert('Failed to create generation batch. Please try again.')
        setGenerating(false)
        return
      }

      // Prepare request payload
      const generatePayload: any = {
        visionId,
        sections: sectionsPayload,
        voice: selectedVoice,
        batchId: batch.id,
        backgroundTrackUrl: selectedTrack.file_url,
        voiceVolume: selectedRatio.voice_volume,
        bgVolume: selectedRatio.bg_volume
      }
      
      // Add optional binaural enhancement
      if (selectedBinaural) {
        generatePayload.binauralTrackUrl = selectedBinaural.file_url
        generatePayload.binauralVolume = binauralVolume
      }
      
      fetch('/api/audio/generate-custom-mix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generatePayload)
      }).then(res => {
        if (!res.ok) {
          console.error('Generation API error:', res.status)
        }
      }).catch(err => {
        console.error('Generation API error:', err)
      })

      // Redirect to queue page immediately
      router.push(`/life-vision/${visionId}/audio/queue/${batch.id}`)
    } catch (error) {
      console.error('Generation error:', error)
      alert('An error occurred during generation. Please try again.')
      setGenerating(false)
    }
  }

  const getFilteredBinauralTracks = () => {
    if (binauralFilter === 'all') return binauralTracks.filter(t => t.name)
    if (binauralFilter === 'pure') return binauralTracks.filter(t => t.name && !t.brainwave_hz && t.frequency_hz)
    
    // Filter by brainwave range
    const ranges: Record<string, [number, number]> = {
      'delta': [0.5, 4],
      'theta': [4, 8],
      'alpha': [8, 14],
      'beta': [14, 30]
    }
    
    const [min, max] = ranges[binauralFilter] || [0, 999]
    return binauralTracks.filter(t => {
      if (!t.name) return false
      if (!t.brainwave_hz) return false
      return t.brainwave_hz >= min && t.brainwave_hz < max
    })
  }

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  // Calculate final mix preview
  const selectedTrack = backgroundTracks.find(t => t.id === selectedBackgroundTrack)
  const selectedRatio = mixRatios.find(r => r.id === selectedMixRatio)
  const selectedBinaural = selectedBinauralTrack 
    ? binauralTracks.find(t => t.id === selectedBinauralTrack)
    : null

  const finalMix = selectedRatio && binauralVolume > 0
    ? calculateAdjustedVolumes(selectedRatio.voice_volume, selectedRatio.bg_volume, binauralVolume)
    : null

  const canGenerate = selectedSection && selectedVoice && selectedBackgroundTrack && selectedMixRatio

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Hero Header */}
        <PageHero
          eyebrow="SINGLE TRACK TESTING"
          title="Test Audio Generation"
          subtitle="Generate a single track to test your mix settings"
        >
          {vision && (
            <>
              <div className="flex justify-center">
                <div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-neutral-900/60 border border-neutral-700/50 backdrop-blur-sm">
                  <VersionBadge 
                    versionNumber={vision.version_number} 
                    status={vision.is_active ? 'active' : (vision.is_draft ? 'draft' : 'complete')}
                    isHouseholdVision={!!vision.household_id}
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

              {/* Navigation Buttons */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto">
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href={`/life-vision/${visionId}/audio/generate`} className="flex items-center justify-center gap-2">
                    <Music className="w-4 h-4" />
                    <span>Full Generator</span>
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href={`/life-vision/${visionId}/audio/sets`} className="flex items-center justify-center gap-2">
                    <ListMusic className="w-4 h-4" />
                    <span>Audio Sets</span>
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href={`/life-vision/${visionId}/audio/queue`} className="flex items-center justify-center gap-2">
                    <Headphones className="w-4 h-4" />
                    <span>Queue</span>
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href={`/life-vision/${visionId}`} className="flex items-center justify-center gap-2">
                    <Eye className="w-4 h-4" />
                    <span>View Vision</span>
                  </Link>
                </Button>
              </div>
            </>
          )}
        </PageHero>

        {/* Main Generation Card */}
        <Card variant="glass" className="p-6">
          {/* Step 1: Select Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#39FF14]/20 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-[#39FF14]">1</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Select Section</h2>
                <p className="text-sm text-neutral-400">Choose which part of your vision to generate</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {sections.map((section) => (
                <Card
                  key={section.key}
                  variant="default"
                  hover
                  className={`p-4 cursor-pointer transition-all ${
                    selectedSection === section.key
                      ? 'border-primary-500 bg-primary-500/10'
                      : ''
                  }`}
                  onClick={() => setSelectedSection(section.key)}
                >
                  <p className="text-white font-medium text-center">{section.displayName}</p>
                  <p className="text-xs text-neutral-400 text-center mt-1">
                    {section.text.length} chars
                  </p>
                </Card>
              ))}
            </div>
          </div>

          {/* Step 2: Select Voice */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#39FF14]/20 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-[#39FF14]">2</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Select Voice</h2>
                <p className="text-sm text-neutral-400">Choose from your existing voice recordings</p>
              </div>
            </div>
            
            {existingVoiceSets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {existingVoiceSets.map((set) => (
                  <Card 
                    key={set.id} 
                    variant="default" 
                    hover
                    className={`p-4 cursor-pointer transition-all ${
                      selectedVoice === set.voice_id
                        ? 'border-primary-500 bg-primary-500/10'
                        : ''
                    }`}
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setSelectedVoice(set.voice_id)
                    }}
                  >
                    <div>
                      <p className="text-white font-medium">{voices.find(v => v.id === set.voice_id)?.name || set.voice_id}</p>
                      <p className="text-xs text-neutral-400">{set.track_count} tracks • {new Date(set.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card variant="elevated" className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
                <p className="text-neutral-300 mb-2">No voice recordings yet</p>
                <p className="text-sm text-neutral-400 mb-4">Generate voice-only tracks from the main generator first</p>
                <Button variant="primary" asChild>
                  <Link href={`/life-vision/${visionId}/audio/generate`}>
                    <Music className="w-4 h-4 mr-2" />
                    Go to Full Generator
                  </Link>
                </Button>
              </Card>
            )}
          </div>

          {/* Step 3: Select Background Track */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#39FF14]/20 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-[#39FF14]">3</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Select Background Track</h2>
                <p className="text-sm text-neutral-400">Choose a background audio layer</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {backgroundTracks.map((track) => (
                <Card
                  key={track.id}
                  variant="default"
                  hover
                  className={`p-4 cursor-pointer transition-all ${
                    selectedBackgroundTrack === track.id
                      ? 'border-primary-500 bg-primary-500/10'
                      : ''
                  }`}
                  onClick={() => {
                    if (selectedBackgroundTrack === track.id) {
                      setSelectedBackgroundTrack('')
                    } else {
                      setSelectedBackgroundTrack(track.id)
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-white font-medium">{track.display_name}</p>
                      <Badge variant="neutral" className="mt-2">
                        {track.category}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handlePreview(e, track.file_url, track.id, previewingBgTrack, setPreviewingBgTrack, bgAudioRef)}
                      className="shrink-0"
                    >
                      {previewingBgTrack === track.id ? <X className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Step 4: Select Mix Ratio */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#39FF14]/20 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-[#39FF14]">4</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Select Mix Ratio</h2>
                <p className="text-sm text-neutral-400">Choose how to blend voice and background</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {mixRatios.map((ratio) => (
                <Card
                  key={ratio.id}
                  variant="default"
                  hover
                  className={`p-4 cursor-pointer transition-all ${
                    selectedMixRatio === ratio.id
                      ? 'border-primary-500 bg-primary-500/10'
                      : ''
                  }`}
                  onClick={() => {
                    if (selectedMixRatio === ratio.id) {
                      setSelectedMixRatio('')
                    } else {
                      setSelectedMixRatio(ratio.id)
                    }
                  }}
                >
                  <p className="text-white font-medium text-center">{ratio.name}</p>
                  <p className="text-sm text-neutral-400 text-center mt-1">
                    {Math.round(ratio.voice_volume)}% voice, {Math.round(ratio.bg_volume)}% background
                  </p>
                </Card>
              ))}
            </div>
          </div>

          {/* Step 5: Binaural Enhancement (Optional) */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-purple-400">5</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Binaural Enhancement (Optional)</h2>
                <p className="text-sm text-neutral-400">Add a binaural or Solfeggio frequency layer</p>
              </div>
            </div>
            
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { id: 'all', label: 'All' },
                { id: 'pure', label: 'Pure Solfeggio' },
                { id: 'delta', label: 'Delta (0.5-4 Hz)' },
                { id: 'theta', label: 'Theta (4-8 Hz)' },
                { id: 'alpha', label: 'Alpha (8-14 Hz)' },
                { id: 'beta', label: 'Beta (14-30 Hz)' }
              ].map(filter => (
                <Button
                  key={filter.id}
                  variant={binauralFilter === filter.id ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setBinauralFilter(filter.id)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              {getFilteredBinauralTracks().map((track) => (
                <Card
                  key={track.id}
                  variant="default"
                  hover
                  className={`p-4 cursor-pointer transition-all ${
                    selectedBinauralTrack === track.id
                      ? 'border-purple-500 bg-purple-500/10'
                      : ''
                  }`}
                  onClick={() => {
                    if (selectedBinauralTrack === track.id) {
                      setSelectedBinauralTrack('')
                      setBinauralVolume(0)
                    } else {
                      setSelectedBinauralTrack(track.id)
                      if (binauralVolume === 0) {
                        setBinauralVolume(15)
                      }
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">{track.display_name}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {track.frequency_hz && (
                          <Badge variant="info">
                            {track.frequency_hz} Hz
                          </Badge>
                        )}
                        {track.brainwave_hz && (
                          <Badge variant="info">
                            {track.brainwave_hz} Hz Beat
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handlePreview(e, track.file_url, track.id, previewingBinauralTrack, setPreviewingBinauralTrack, binauralAudioRef)}
                      className="shrink-0"
                    >
                      {previewingBinauralTrack === track.id ? <X className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            
            {/* Binaural Volume Slider */}
            {selectedBinauralTrack && (
              <div className="mt-4">
                <label className="text-sm text-neutral-300 block mb-2">
                  Binaural Volume: {binauralVolume}%
                  <span className="text-neutral-500 ml-2">(Voice & background adjust automatically)</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={binauralVolume}
                  onChange={(e) => setBinauralVolume(parseInt(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>
            )}
          </div>

          {/* Final Mix Preview */}
          {canGenerate && (
            <Card variant="elevated" className="p-6 bg-gradient-to-br from-primary-500/10 to-purple-500/10 border-primary-500/30 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Music2 className="w-5 h-5" />
                Final Mix Preview
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-300">Section:</span>
                  <span className="text-white font-medium">
                    {sections.find(s => s.key === selectedSection)?.displayName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-300">Voice:</span>
                  <span className="text-white font-medium">
                    {voices.find(v => v.id === selectedVoice)?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-300">Background:</span>
                  <span className="text-white font-medium">{selectedTrack?.display_name}</span>
                </div>
                {selectedBinaural && binauralVolume > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-300">Binaural:</span>
                    <span className="text-white font-medium">{selectedBinaural.display_name}</span>
                  </div>
                )}
                
                <div className="border-t border-neutral-700 pt-3 mt-3">
                  <p className="text-sm text-neutral-400 mb-2">Mix Ratios:</p>
                  {finalMix ? (
                    <div className="flex gap-3 text-sm">
                      <span className="text-white">{finalMix.voice}% Voice</span>
                      <span className="text-white">{finalMix.bg}% Background</span>
                      <span className="text-purple-400">{finalMix.binaural}% Binaural</span>
                    </div>
                  ) : selectedRatio && (
                    <div className="flex gap-3 text-sm">
                      <span className="text-white">{Math.round(selectedRatio.voice_volume)}% Voice</span>
                      <span className="text-white">{Math.round(selectedRatio.bg_volume)}% Background</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Generate Button */}
          <div className="flex justify-center">
            <Button
              variant="primary"
              size="lg"
              onClick={handleGenerateSingleTrack}
              disabled={!canGenerate || generating}
              className="w-full md:w-auto"
            >
              {generating ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <TestTube className="w-5 h-5 mr-2" />
                  Generate Test Track
                </>
              )}
            </Button>
          </div>
        </Card>
      </Stack>
    </Container>
  )
}

