"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Spinner, Badge, Container, Stack, PageHero, Toggle, Select } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { Headphones, CheckCircle, Play, Moon, Zap, Sparkles, Music, X, Wand2, Mic, Clock, Eye, Music2, ListMusic, Plus, ChevronDown, ChevronUp, AudioLines } from 'lucide-react'
import Link from 'next/link'
import { getVisionCategoryKeys, VISION_CATEGORIES } from '@/lib/design-system'
import { SectionSelector } from '@/components/SectionSelector'
import { FormatSelector, OutputFormat } from '@/components/FormatSelector'

interface Voice {
  id: string
  name: string
}

interface ExistingVoiceSet {
  id: string
  voice_id: string
  voice_name: string
  created_at: string
  track_count: number
  available_sections: string[] // Track which sections have voice-only tracks
  sample_audio_url?: string // Sample track for preview
}

interface BackgroundTrack {
  id: string
  name: string
  display_name: string
  category: string
  file_url: string
  description?: string
}

interface MixRatio {
  id: string
  name: string
  voice_volume: number
  bg_volume: number
  description?: string
  icon?: string
}

// Helper function to calculate adjusted volumes when binaural is added
function calculateAdjustedVolumes(voiceVol: number, bgVol: number, binauralVol: number) {
  if (binauralVol === 0) {
    return { voice: voiceVol, bg: bgVol, binaural: 0 }
  }
  
  // Proportionally reduce voice and bg to make room for binaural
  const remaining = 100 - binauralVol
  const total = voiceVol + bgVol
  
  return {
    voice: Math.round((voiceVol / total) * remaining),
    bg: Math.round((bgVol / total) * remaining),
    binaural: binauralVol
  }
}

export default function AudioMixPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [visionId, setVisionId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatingComboId, setGeneratingComboId] = useState<string | null>(null)
  const [voices, setVoices] = useState<Voice[]>([])
  const [existingVoiceSets, setExistingVoiceSets] = useState<ExistingVoiceSet[]>([])
  const [vision, setVision] = useState<any>(null)
  
  // Selected base voice for mixing
  const [selectedBaseVoice, setSelectedBaseVoice] = useState<string>('')
  
  // Background Track Selection
  const [backgroundTracks, setBackgroundTracks] = useState<BackgroundTrack[]>([])
  const [selectedBackgroundTrack, setSelectedBackgroundTrack] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  // Mix Ratio Selection
  const [mixRatios, setMixRatios] = useState<MixRatio[]>([])
  const [selectedMixRatio, setSelectedMixRatio] = useState<string>('')
  
  // Binaural Enhancement (Optional 3rd track)
  const [binauralTracks, setBinauralTracks] = useState<BackgroundTrack[]>([])
  const [selectedBinauralTrack, setSelectedBinauralTrack] = useState<string>('')
  const [binauralVolume, setBinauralVolume] = useState<number>(0)
  const [binauralFilter, setBinauralFilter] = useState<string>('all')
  
  // Section visibility toggles (all expanded by default)
  const [showBackgroundSection, setShowBackgroundSection] = useState(true)
  const [showMixRatioSection, setShowMixRatioSection] = useState(true)
  const [showBinauralSection, setShowBinauralSection] = useState(true)
  const [showSectionsSection, setShowSectionsSection] = useState(true)
  const [showOutputFormatSection, setShowOutputFormatSection] = useState(true)
  
  // Audio preview
  const [previewingTrack, setPreviewingTrack] = useState<string | null>(null)
  const [previewProgress, setPreviewProgress] = useState<number>(0)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  
  // Initialize audio element on mount
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.addEventListener('ended', () => {
        setPreviewingTrack(null)
        setPreviewProgress(0)
      })
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
    }
  }, [])
  
  // Handle audio preview with 30 second limit
  const handlePreview = (e: React.MouseEvent, trackUrl: string, trackId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!audioRef.current) {
      console.error('Audio ref not available')
      return
    }
    
    if (previewingTrack === trackId) {
      // Stop preview
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setPreviewingTrack(null)
      setPreviewProgress(0)
    } else {
      // Stop any currently playing preview
      if (previewingTrack) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      
      // Start preview
      audioRef.current.src = trackUrl
      audioRef.current.currentTime = 0
      
      // Set up time update listener for progress
      const updateProgress = () => {
        if (!audioRef.current) return
        
        const progress = (audioRef.current.currentTime / 30) * 100
        setPreviewProgress(Math.min(progress, 100))
        
        // Stop at 30 seconds
        if (audioRef.current.currentTime >= 30) {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
          setPreviewingTrack(null)
          setPreviewProgress(0)
          audioRef.current.removeEventListener('timeupdate', updateProgress)
        }
      }
      
      audioRef.current.addEventListener('timeupdate', updateProgress)
      
      audioRef.current.play().catch(err => {
        console.error('Audio play error:', err)
        setPreviewingTrack(null)
        setPreviewProgress(0)
      })
      
      setPreviewingTrack(trackId)
    }
  }
  
  // Recommended Combos
  const [recommendedCombos, setRecommendedCombos] = useState<any[]>([])
  const [mixMode, setMixMode] = useState<'recommended' | 'custom'>('recommended')
  
  // Section Selection for Custom Mixing
  const [mixAllSections, setMixAllSections] = useState(true)
  const [selectedMixSections, setSelectedMixSections] = useState<string[]>([])
  const [mixOutputFormat, setMixOutputFormat] = useState<OutputFormat>('both')
  
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

    // Load OpenAI voices for display names
    let voiceList: Voice[] = []
    try {
      const resp = await fetch('/api/audio/voices', { cache: 'no-store' })
      const data = await resp.json()
      voiceList = (data.voices || []).map((v: any) => ({ 
        id: v.id, 
        name: `${v.brandName || v.name} (${v.gender})`
      }))
      setVoices(voiceList)
    } catch {}

    // Load existing voice-only (standard) sets with their actual tracks
    const { data: sets } = await supabase
      .from('audio_sets')
      .select(`
        id,
        voice_id,
        created_at,
        audio_tracks(section_key, status, audio_url)
      `)
      .eq('vision_id', visionId)
      .eq('variant', 'standard')
      .order('created_at', { ascending: false })

    const voiceSets: ExistingVoiceSet[] = (sets || []).map((set: any) => {
      // Get only completed tracks with audio URLs (exclude 'full' section)
      const completedTracks = (set.audio_tracks || []).filter(
        (t: any) => t.status === 'completed' && t.audio_url && t.section_key !== 'full'
      )
      const availableSections = completedTracks.map((t: any) => t.section_key)
      
      // Get first track's URL for preview
      const sampleUrl = completedTracks.length > 0 ? completedTracks[0].audio_url : undefined
      
      return {
        id: set.id,
        voice_id: set.voice_id,
        voice_name: voiceList.find((v: Voice) => v.id === set.voice_id)?.name || set.voice_id,
        created_at: set.created_at,
        track_count: completedTracks.length,
        available_sections: availableSections,
        sample_audio_url: sampleUrl
      }
    })

    setExistingVoiceSets(voiceSets)
    
    // Auto-select first voice if available
    if (voiceSets.length > 0 && !selectedBaseVoice) {
      setSelectedBaseVoice(voiceSets[0].voice_id)
    }

    // Load background tracks (excluding frequency enhancement tracks)
    const { data: tracks } = await supabase
      .from('audio_background_tracks')
      .select('*')
      .eq('is_active', true)
      .not('category', 'in', '(solfeggio,solfeggio_binaural,binaural)')
      .order('sort_order')
    
    if (tracks) {
      setBackgroundTracks(tracks)
      if (tracks.length > 0 && !selectedBackgroundTrack) {
        setSelectedBackgroundTrack(tracks[0].id)
      }
    }
    
    // Load frequency enhancement tracks (pure solfeggio + solfeggio binaural + future non-solfeggio binaural)
    const { data: binauralData } = await supabase
      .from('audio_background_tracks')
      .select('*')
      .eq('is_active', true)
      .in('category', ['solfeggio', 'solfeggio_binaural', 'binaural'])
      .order('sort_order')
    
    if (binauralData) {
      setBinauralTracks(binauralData)
    }

    // Load mix ratios
    const { data: ratios } = await supabase
      .from('audio_mix_ratios')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
    
    if (ratios) {
      setMixRatios(ratios)
      const balanced = ratios.find(r => r.voice_volume === 50)
      if (balanced && !selectedMixRatio) {
        setSelectedMixRatio(balanced.id)
      }
    }

    // Load recommended combos
    const { data: combos } = await supabase
      .from('audio_recommended_combos')
      .select(`
        *,
        background_track:audio_background_tracks!background_track_id(*),
        mix_ratio:audio_mix_ratios!mix_ratio_id(*),
        binaural_track:audio_background_tracks!binaural_track_id(*)
      `)
      .eq('is_active', true)
      .order('sort_order')
    
    if (combos) {
      setRecommendedCombos(combos)
    }

    setLoading(false)
  }

  async function applyRecommendedCombo(combo: any) {
    if (!selectedBaseVoice) {
      alert('Please select a base voice first')
      return
    }
    
    const selectedVoiceSet = existingVoiceSets.find(set => set.voice_id === selectedBaseVoice)
    if (!selectedVoiceSet || selectedVoiceSet.track_count === 0) {
      alert('No voice-only tracks found. Please generate voice-only tracks first.')
      return
    }

    setGeneratingComboId(combo.id)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('You must be logged in to generate audio')
        setGeneratingComboId(null)
        return
      }

      const { data: vv } = await supabase
        .from('vision_versions')
        .select('*')
        .eq('id', visionId)
        .single()

      if (!vv) {
        alert('Vision not found')
        setGeneratingComboId(null)
        return
      }

      // Get only sections that have voice-only tracks available for the selected voice
      const selectedVoiceSetData = existingVoiceSets.find(set => set.voice_id === selectedBaseVoice)
      const availableSections = selectedVoiceSetData?.available_sections || []
      
      if (availableSections.length === 0) {
        alert('No voice-only tracks available for mixing. Please generate voice-only tracks first.')
        setGeneratingComboId(null)
        return
      }
      
      // Build sections only for tracks that actually exist
      const sections = availableSections
        .map(key => ({ key, text: vv[key] || '' }))
        .filter(s => s.text.trim().length > 0)

      const sectionsPayload = sections.map(s => ({
        sectionKey: s.key,
        text: s.text
      }))

      const selectedTrack = combo.background_track
      const selectedRatio = combo.mix_ratio
      const selectedBinaural = combo.binaural_track

      const { data: batch, error: batchError } = await supabase
        .from('audio_generation_batches')
        .insert({
          user_id: user.id,
          vision_id: visionId,
          variant_ids: ['custom'],
          voice_id: selectedBaseVoice,
          sections_requested: sectionsPayload,
          total_tracks_expected: sectionsPayload.length,
          status: 'pending',
          metadata: {
            custom_mix: true,
            background_track_id: combo.background_track_id,
            background_track_url: selectedTrack.file_url,
            mix_ratio_id: combo.mix_ratio_id,
            voice_volume: selectedRatio.voice_volume,
            bg_volume: selectedRatio.bg_volume,
            ...(combo.binaural_track_id && {
              binaural_track_id: combo.binaural_track_id,
              binaural_track_url: selectedBinaural.file_url,
              binaural_volume: combo.binaural_volume || 15
            })
          }
        })
        .select()
        .single()

      if (batchError || !batch) {
        console.error('Batch creation error:', batchError)
        alert('Failed to create generation batch')
        setGeneratingComboId(null)
        return
      }

      fetch(`/api/audio/generate-custom-mix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visionId,
          batchId: batch.id,
          voice: selectedBaseVoice,
          sections: sectionsPayload,
          backgroundTrackUrl: selectedTrack.file_url,
          voiceVolume: selectedRatio.voice_volume,
          bgVolume: selectedRatio.bg_volume,
          binauralTrackUrl: selectedBinaural?.file_url || null,
          binauralVolume: combo.binaural_volume || 0
        })
      }).then(res => {
        if (!res.ok) {
          console.error('Generation API error:', res.status)
        }
      }).catch(err => {
        console.error('Generation API error:', err)
      })

      router.push(`/life-vision/${visionId}/audio/queue/${batch.id}`)
      
    } catch (err) {
      console.error('Error generating custom mix:', err)
      alert('Failed to generate mix. Please try again.')
      setGeneratingComboId(null)
    }
  }

  async function handleGenerateCustomMix() {
    if (!selectedBackgroundTrack) {
      alert('Please select a background track')
      return
    }

    if (!selectedMixRatio) {
      alert('Please select a mix ratio')
      return
    }

    if (!selectedBaseVoice) {
      alert('Please select a base voice')
      return
    }
    
    const selectedVoiceSet = existingVoiceSets.find(set => set.voice_id === selectedBaseVoice)
    if (!selectedVoiceSet || selectedVoiceSet.track_count === 0) {
      alert('No voice-only tracks found for this voice. Please generate voice-only tracks first.')
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

      const { data: vv } = await supabase
        .from('vision_versions')
        .select('*')
        .eq('id', visionId)
        .single()

      if (!vv) {
        alert('Vision not found')
        setGenerating(false)
        return
      }

      // Get only sections that have voice-only tracks available for the selected voice
      const selectedVoiceSetData = existingVoiceSets.find(set => set.voice_id === selectedBaseVoice)
      const availableSections = selectedVoiceSetData?.available_sections || []
      
      if (availableSections.length === 0) {
        alert('No voice-only tracks available for mixing. Please generate voice-only tracks first.')
        setGenerating(false)
        return
      }
      
      // Build sections based on user selection, but only include sections that exist
      let sectionsToMix: { key: string; text: string }[] = []
      
      if (mixAllSections) {
        // Use all available sections (instead of all possible sections)
        sectionsToMix = availableSections.map(key => ({
          key,
          text: vv[key] || ''
        }))
      } else {
        // Filter selected sections to only include those that are actually available
        const orderedKeys = VISION_CATEGORIES.map(c => c.key) as string[]
        const validSelections = selectedMixSections.filter(key => availableSections.includes(key))
        const sortedSelectedSections = [...validSelections].sort(
          (a, b) => orderedKeys.indexOf(a) - orderedKeys.indexOf(b)
        )
        sectionsToMix = sortedSelectedSections.map(key => ({
          key,
          text: vv[key] || ''
        }))
      }
      
      const sections = sectionsToMix.filter(s => s.text.trim().length > 0)
      
      if (sections.length === 0) {
        alert('No content found for the selected sections.')
        setGenerating(false)
        return
      }

      const sectionsPayload = sections.map(s => ({
        sectionKey: s.key,
        text: s.text
      }))

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
      
      // Build descriptive set name
      let mixSetName = ''
      if (!mixAllSections && sections.length < 14) {
        if (sections.length === 1) {
          const cat = VISION_CATEGORIES.find(c => c.key === sections[0].key)
          mixSetName = `${cat?.label || sections[0].key} Focus`
        } else if (sections.length <= 3) {
          const labels = sections.map(s => {
            const cat = VISION_CATEGORIES.find(c => c.key === s.key)
            return cat?.label || s.key
          })
          mixSetName = `${labels.join(' + ')} Focus`
        } else {
          mixSetName = `Custom ${sections.length} Sections`
        }
      }
      
      // Force 'individual' format when only 1 section (no point in combined)
      const effectiveOutputFormat = sections.length === 1 ? 'individual' : mixOutputFormat

      const { data: batch, error: batchError } = await supabase
        .from('audio_generation_batches')
        .insert({
          user_id: user.id,
          vision_id: visionId,
          variant_ids: ['custom'],
          voice_id: selectedBaseVoice,
          sections_requested: sectionsPayload,
          total_tracks_expected: sectionsPayload.length,
          status: 'pending',
          metadata: {
            custom_mix: true,
            output_format: effectiveOutputFormat,
            mix_all_sections: mixAllSections,
            selected_sections: mixAllSections ? null : selectedMixSections,
            audio_set_name: mixSetName || null,
            background_track_id: selectedBackgroundTrack,
            background_track_url: selectedTrack.file_url,
            mix_ratio_id: selectedMixRatio,
            // Store ADJUSTED volumes (accounting for binaural if present)
            voice_volume: selectedBinaural && binauralVolume > 0
              ? Math.round((selectedRatio.voice_volume / (selectedRatio.voice_volume + selectedRatio.bg_volume)) * (100 - binauralVolume))
              : selectedRatio.voice_volume,
            bg_volume: selectedBinaural && binauralVolume > 0
              ? Math.round((selectedRatio.bg_volume / (selectedRatio.voice_volume + selectedRatio.bg_volume)) * (100 - binauralVolume))
              : selectedRatio.bg_volume,
            // Also store original ratio for reference
            original_voice_volume: selectedRatio.voice_volume,
            original_bg_volume: selectedRatio.bg_volume,
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

      const generatePayload: any = {
        visionId,
        sections: sectionsPayload,
        voice: selectedBaseVoice,
        batchId: batch.id,
        backgroundTrackUrl: selectedTrack.file_url,
        voiceVolume: selectedRatio.voice_volume,
        bgVolume: selectedRatio.bg_volume,
        audioSetName: mixSetName || undefined,
        outputFormat: effectiveOutputFormat
      }
      
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

      router.push(`/life-vision/${visionId}/audio/queue/${batch.id}`)
    } catch (error) {
      console.error('Generation error:', error)
      alert('An error occurred during generation. Please try again.')
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  // No voice sets - redirect to generate page
  if (existingVoiceSets.length === 0) {
    return (
      <Container size="xl">
        <Stack gap="lg">
          <PageHero
            eyebrow={vision?.household_id ? "THE LIFE WE CHOOSE" : "THE LIFE I CHOOSE"}
            title="Create Audio Mixes"
            subtitle="Mix your voice with background music and binaural beats"
          />

          <Card variant="glass" className="p-6 md:p-8 text-center">
            <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mic className="w-8 h-8 text-neutral-500" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No Voice Recordings Yet</h2>
            <p className="text-neutral-400 mb-6 max-w-md mx-auto">
              You need to generate voice-only tracks first before you can create mixes with background music.
            </p>
            <Button variant="primary" asChild>
              <Link href={`/life-vision/${visionId}/audio/generate`}>
                <Plus className="w-4 h-4 mr-2" />
                Generate Voice Tracks
              </Link>
            </Button>
          </Card>
        </Stack>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Hero Header */}
        <PageHero
          eyebrow={vision?.household_id ? "THE LIFE WE CHOOSE" : "THE LIFE I CHOOSE"}
          title="Create Audio Mixes"
          subtitle="Mix your voice with background music and binaural beats"
        >
          {/* Action Buttons */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 max-w-5xl mx-auto">
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href={`/life-vision/${visionId}/audio/generate`} className="flex items-center justify-center gap-2">
                <AudioLines className="w-4 h-4" />
                <span>Voice Only</span>
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
                <Clock className="w-4 h-4" />
                <span>Queue</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href={`/life-vision/audio`} className="flex items-center justify-center gap-2">
                <Headphones className="w-4 h-4" />
                <span>All Audios</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="w-full col-span-2 lg:col-span-1">
              <Link href={`/life-vision/${visionId}`} className="flex items-center justify-center gap-2">
                <Eye className="w-4 h-4" />
                <span>Vision</span>
              </Link>
            </Button>
          </div>
        </PageHero>


        {/* Step 1: Select Base Voice */}
        <Card variant="glass" className="p-4 md:p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 bg-[#39FF14]/20 rounded-full flex items-center justify-center mb-3">
              <span className="text-2xl font-bold text-[#39FF14]">1</span>
            </div>
            <h2 className="text-lg md:text-xl font-semibold text-white">Select Base Voice</h2>
            <p className="text-sm text-neutral-400">Choose which voice recording to mix</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {existingVoiceSets.map((set) => {
              const isPreviewing = previewingTrack === set.voice_id
              return (
                <Card 
                  key={set.id} 
                  variant="default" 
                  hover
                  className={`cursor-pointer ${
                    selectedBaseVoice === set.voice_id
                      ? 'border-primary-500 bg-primary-500/10'
                      : ''
                  }`}
                  onClick={() => setSelectedBaseVoice(set.voice_id)}
                >
                  <div className="flex items-center gap-3">
                    {selectedBaseVoice === set.voice_id && (
                      <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium">{voices.find(v => v.id === set.voice_id)?.name || set.voice_id}</p>
                      <p className="text-xs text-neutral-400">
                        {set.track_count} section{set.track_count !== 1 ? 's' : ''} available
                        {set.track_count < 14 && <span className="text-yellow-400 ml-1">(partial)</span>}
                      </p>
                    </div>
                    {set.sample_audio_url && (
                      <div className="relative flex-shrink-0 w-9 h-9">
                        {/* Circular progress indicator */}
                        {isPreviewing && (
                          <svg className="absolute inset-0 w-9 h-9 -rotate-90 pointer-events-none" viewBox="0 0 36 36" style={{ zIndex: 10 }}>
                            {/* Background track */}
                            <circle
                              cx="18"
                              cy="18"
                              r="16"
                              fill="none"
                              stroke="rgba(31,31,31,0.3)"
                              strokeWidth="2"
                            />
                            {/* Progress */}
                            <circle
                              cx="18"
                              cy="18"
                              r="16"
                              fill="none"
                              stroke="#1F1F1F"
                              strokeWidth="2"
                              strokeDasharray="100.53"
                              strokeDashoffset={100.53 - (100.53 * previewProgress / 100)}
                              className="transition-all duration-100"
                            />
                          </svg>
                        )}
                        <button
                          onClick={(e) => handlePreview(e, set.sample_audio_url!, set.voice_id)}
                          className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                            isPreviewing 
                              ? 'bg-primary-500' 
                              : 'bg-neutral-800 hover:bg-neutral-700'
                          }`}
                        >
                          {isPreviewing ? <X className="w-4 h-4 text-[#1F1F1F]" /> : <Play className="w-4 h-4 text-neutral-400" />}
                        </button>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Generate New Base Voice Button */}
          <div className="flex justify-center mt-6">
            <Button variant="outline" asChild>
              <Link href={`/life-vision/${visionId}/audio/generate`} className="flex items-center gap-2">
                Generate New Base Voice
                <AudioLines className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </Card>

        {/* Step 2: Mix Mode Toggle */}
        <Card variant="glass" className="p-4 md:p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-3">
              <span className="text-2xl font-bold text-purple-400">2</span>
            </div>
            <h2 className="text-lg md:text-xl font-semibold text-white">Create Your Mix</h2>
            <p className="text-sm text-neutral-400 mb-4">Choose how you want to create your mix</p>
            
            <Toggle
              value={mixMode}
              onChange={setMixMode}
              options={[
                { value: 'recommended', label: 'Recommended Combos' },
                { value: 'custom', label: 'Build My Own' }
              ]}
            />
          </div>

          {/* RECOMMENDED COMBOS MODE */}
          {mixMode === 'recommended' && recommendedCombos.length > 0 && (
            <>
              <div className="flex flex-col items-center text-center mb-6">
                <h3 className="text-base md:text-lg font-semibold text-white mb-2">Quick Presets</h3>
                <p className="text-sm text-neutral-400 max-w-2xl">
                  Curated mixes designed for optimal results. Click to generate.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedCombos.map((combo) => {
                  const voiceVolume = combo.mix_ratio?.voice_volume || 0
                  const bgVolume = combo.mix_ratio?.bg_volume || 0
                  
                  let presetType = 'Voice Only'
                  let presetIcon = <Headphones className="w-6 h-6" />
                  let iconBgColor = 'bg-primary-500/20'
                  let iconColor = 'text-primary-500'
                  
                  if (bgVolume === 0) {
                    presetType = 'Voice Only'
                    presetIcon = <Headphones className="w-6 h-6" />
                    iconBgColor = 'bg-primary-500/20'
                    iconColor = 'text-primary-500'
                  } else if (voiceVolume <= 30) {
                    presetType = 'Sleep'
                    presetIcon = <Moon className="w-6 h-6" />
                    iconBgColor = 'bg-blue-500/20'
                    iconColor = 'text-blue-400'
                  } else if (voiceVolume >= 40 && voiceVolume <= 60) {
                    presetType = 'Meditation'
                    presetIcon = <Sparkles className="w-6 h-6" />
                    iconBgColor = 'bg-purple-500/20'
                    iconColor = 'text-purple-400'
                  } else {
                    presetType = 'Power'
                    presetIcon = <Zap className="w-6 h-6" />
                    iconBgColor = 'bg-yellow-500/20'
                    iconColor = 'text-yellow-400'
                  }
                  
                  return (
                    <Card
                      key={combo.id}
                      variant="elevated"
                      hover
                      className="p-4 md:p-6 transition-all"
                    >
                      <div className="flex justify-center mb-3">
                        <div className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center`}>
                          <span className={iconColor}>{presetIcon}</span>
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-white text-center mb-4">
                        {presetType}
                      </h3>

                      <div className="text-left mb-2">
                        <span className="text-xs text-neutral-500 uppercase tracking-wider">Background</span>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-white font-medium">
                            {combo.background_track?.display_name || 'None'}
                          </p>
                          {combo.background_track?.file_url && (
                            <button
                              onClick={(e) => handlePreview(e, combo.background_track.file_url, `combo-bg-${combo.id}`)}
                              className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                                previewingTrack === `combo-bg-${combo.id}`
                                  ? 'bg-primary-500 text-black'
                                  : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                              }`}
                              title={previewingTrack === `combo-bg-${combo.id}` ? 'Stop preview' : 'Preview track'}
                            >
                              {previewingTrack === `combo-bg-${combo.id}` ? (
                                <X className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                        {previewingTrack === `combo-bg-${combo.id}` && (
                          <div className="mt-1.5 h-1 bg-neutral-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary-500 transition-all duration-200"
                              style={{ width: `${previewProgress}%` }}
                            />
                          </div>
                        )}
                      </div>

                      {combo.description && (
                        <p className="text-sm text-neutral-400 text-left mb-3">
                          {combo.description}
                        </p>
                      )}

                      <div className="text-left mb-4">
                        <span className="text-xs text-neutral-500 uppercase tracking-wider">Ratio</span>
                        <p className="text-sm font-semibold">
                          <span className="text-primary-400">{combo.mix_ratio?.voice_volume}% Voice</span>
                          <span className="text-neutral-500"> / </span>
                          <span className="text-secondary-400">{combo.mix_ratio?.bg_volume}% Background</span>
                          {combo.binaural_volume > 0 && (
                            <>
                              <span className="text-neutral-500"> / </span>
                              <span className="text-purple-400">{combo.binaural_volume}% Binaural</span>
                            </>
                          )}
                        </p>
                      </div>

                      {combo.binaural_track_id && (
                        <div className="text-left mb-4 pb-4 border-b border-neutral-700">
                          <div className="flex items-center gap-2 text-sm">
                            <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
                            <span className="text-neutral-400">Binaural:</span>
                            <span className="text-purple-400 font-medium">
                              {combo.binaural_track?.display_name || 'Unknown'}
                            </span>
                            {combo.binaural_track?.file_url && (
                              <button
                                onClick={(e) => handlePreview(e, combo.binaural_track.file_url, `combo-bin-${combo.id}`)}
                                className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                                  previewingTrack === `combo-bin-${combo.id}`
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                                }`}
                                title={previewingTrack === `combo-bin-${combo.id}` ? 'Stop preview' : 'Preview binaural'}
                              >
                                {previewingTrack === `combo-bin-${combo.id}` ? (
                                  <X className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </div>
                          {previewingTrack === `combo-bin-${combo.id}` && (
                            <div className="mt-1.5 h-1 bg-neutral-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-purple-500 transition-all duration-200"
                                style={{ width: `${previewProgress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full"
                        disabled={generatingComboId !== null || !selectedBaseVoice}
                        onClick={(e) => {
                          e.stopPropagation()
                          applyRecommendedCombo(combo)
                        }}
                      >
                        {generatingComboId === combo.id ? (
                          <>
                            <Spinner size="sm" className="mr-2" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4 mr-2" />
                            Generate This Mix
                          </>
                        )}
                      </Button>
                    </Card>
                  )
                })}
              </div>
            </>
          )}

          {/* CUSTOM BUILD MODE */}
          {mixMode === 'custom' && (
            <>
              {/* Background Track Selection */}
              <Card variant="glass" className="p-4 md:p-6 mb-6">
                <button 
                  onClick={() => setShowBackgroundSection(!showBackgroundSection)}
                  className={`w-full relative flex flex-col items-center justify-center ${showBackgroundSection ? 'mb-3' : ''}`}
                >
                  <h3 className="text-base font-semibold text-white">Choose Background Track</h3>
                  {!showBackgroundSection && (
                    <p className="text-xs text-neutral-400 mt-1">
                      {selectedBackgroundTrack 
                        ? backgroundTracks.find(t => t.id === selectedBackgroundTrack)?.display_name || 'Selected'
                        : 'None selected'}
                    </p>
                  )}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    {showBackgroundSection ? (
                      <ChevronUp className="w-5 h-5 text-neutral-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-neutral-400" />
                    )}
                  </div>
                </button>
                
                {showBackgroundSection && (
                <>
                <div className="flex gap-2 mb-4 flex-wrap justify-center">
                  <Button
                    variant={selectedCategory === 'all' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('all')}
                  >
                    All Tracks
                  </Button>
                  {Array.from(new Set(backgroundTracks.map(t => t.category))).map(category => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {backgroundTracks
                    .filter(track => selectedCategory === 'all' || track.category === selectedCategory)
                    .map((track) => {
                      const isSelected = selectedBackgroundTrack === track.id
                      const isPreviewing = previewingTrack === track.id
                      return (
                        <Card
                          key={track.id}
                          variant="default"
                          hover
                          className={`cursor-pointer ${
                            isSelected ? 'border-primary-500 bg-primary-500/10' : ''
                          }`}
                          onClick={() => setSelectedBackgroundTrack(isSelected ? '' : track.id)}
                        >
                          <div className="flex items-center gap-3">
                            {isSelected && (
                              <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium text-sm md:text-base">{track.display_name}</p>
                              {track.description && (
                                <p className="text-xs md:text-sm text-neutral-400 mt-1">{track.description}</p>
                              )}
                              <Badge variant="neutral" className="mt-2 text-xs">
                                {track.category}
                              </Badge>
                            </div>
                            <div className="relative flex-shrink-0 w-9 h-9">
                              {/* Circular progress indicator */}
                              {isPreviewing && (
                                <svg className="absolute inset-0 w-9 h-9 -rotate-90 pointer-events-none" viewBox="0 0 36 36" style={{ zIndex: 10 }}>
                                  {/* Background track */}
                                  <circle
                                    cx="18"
                                    cy="18"
                                    r="16"
                                    fill="none"
                                    stroke="rgba(31,31,31,0.3)"
                                    strokeWidth="2"
                                  />
                                  {/* Progress */}
                                  <circle
                                    cx="18"
                                    cy="18"
                                    r="16"
                                    fill="none"
                                    stroke="#1F1F1F"
                                    strokeWidth="2"
                                    strokeDasharray="100.53"
                                    strokeDashoffset={100.53 - (100.53 * previewProgress / 100)}
                                    className="transition-all duration-100"
                                  />
                                </svg>
                              )}
                              <button
                                onClick={(e) => handlePreview(e, track.file_url, track.id)}
                                className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                                  isPreviewing 
                                    ? 'bg-primary-500' 
                                    : 'bg-neutral-800 hover:bg-neutral-700'
                                }`}
                              >
                                {isPreviewing ? <X className="w-4 h-4 text-[#1F1F1F]" /> : <Play className="w-4 h-4 text-neutral-400" />}
                              </button>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                </div>
                </>
                )}
              </Card>

              {/* Mix Ratio Selection */}
              <Card variant="glass" className="p-4 md:p-6 mb-6 overflow-visible relative z-30">
                <button 
                  onClick={() => setShowMixRatioSection(!showMixRatioSection)}
                  className={`w-full relative flex flex-col items-center justify-center ${showMixRatioSection ? 'mb-3' : ''}`}
                >
                  <h3 className="text-base font-semibold text-white">Choose Mix Ratio</h3>
                  {!showMixRatioSection && (
                    <p className="text-xs text-neutral-400 mt-1">
                      {selectedMixRatio 
                        ? (() => {
                            const ratio = mixRatios.find(r => r.id === selectedMixRatio)
                            if (!ratio) return 'None selected'
                            return `${ratio.voice_volume}% Voice / ${ratio.bg_volume}% BG`
                          })()
                        : 'None selected'}
                    </p>
                  )}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    {showMixRatioSection ? (
                      <ChevronUp className="w-5 h-5 text-neutral-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-neutral-400" />
                    )}
                  </div>
                </button>
                
                {showMixRatioSection && (
                <>
                <p className="text-sm text-neutral-400 mb-3 text-center">
                  {selectedBinauralTrack && binauralVolume > 0
                    ? `Voice + Background ratio (Binaural at ${binauralVolume}%)`
                    : 'Voice + Background balance'}
                </p>
                <Select
                  value={selectedMixRatio}
                  onChange={(value) => setSelectedMixRatio(value)}
                  placeholder="Select a mix ratio..."
                  options={mixRatios.map((ratio) => {
                    const cleanName = ratio.name.replace(/\s*\(\d+\/\d+\)\s*$/, '')
                    const adjusted = (selectedBinauralTrack && binauralVolume > 0)
                      ? calculateAdjustedVolumes(ratio.voice_volume, ratio.bg_volume, binauralVolume)
                      : { voice: ratio.voice_volume, bg: ratio.bg_volume, binaural: 0 }
                    
                    return {
                      value: ratio.id,
                      label: `${cleanName} - ${adjusted.voice}% Voice / ${adjusted.bg}% BG${adjusted.binaural > 0 ? ` / ${adjusted.binaural}% Binaural` : ''}`
                    }
                  })}
                />
                </>
                )}
              </Card>

              {/* Optional Binaural Enhancement */}
              {binauralTracks.length > 0 && (
                <Card variant="glass" className="p-4 md:p-6 mb-6 relative z-10">
                  <button 
                    onClick={() => setShowBinauralSection(!showBinauralSection)}
                    className={`w-full relative flex flex-col items-center justify-center ${showBinauralSection ? 'mb-3' : ''}`}
                  >
                    <h3 className="text-base font-semibold text-white">Binaural Enhancement (Optional)</h3>
                    {!showBinauralSection && (
                      <p className="text-xs text-neutral-400 mt-1">
                        {selectedBinauralTrack 
                          ? binauralTracks.find(t => t.id === selectedBinauralTrack)?.display_name || 'Selected'
                          : 'None selected'}
                      </p>
                    )}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2">
                      {showBinauralSection ? (
                        <ChevronUp className="w-5 h-5 text-neutral-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-neutral-400" />
                      )}
                    </div>
                  </button>
                  
                  {showBinauralSection && (
                  <>
                  <p className="text-sm text-neutral-400 mb-4 text-center">
                    Add healing frequencies or brainwave entrainment to your mix.
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4 justify-center">
                    <Button size="sm" variant={binauralFilter === 'all' ? 'primary' : 'outline'} onClick={() => setBinauralFilter('all')}>All</Button>
                    <Button size="sm" variant={binauralFilter === 'pure' ? 'primary' : 'outline'} onClick={() => setBinauralFilter('pure')}>Pure Solfeggio</Button>
                    <Button size="sm" variant={binauralFilter === 'delta' ? 'primary' : 'outline'} onClick={() => setBinauralFilter('delta')}>Delta (Sleep)</Button>
                    <Button size="sm" variant={binauralFilter === 'theta' ? 'primary' : 'outline'} onClick={() => setBinauralFilter('theta')}>Theta (Meditation)</Button>
                    <Button size="sm" variant={binauralFilter === 'alpha' ? 'primary' : 'outline'} onClick={() => setBinauralFilter('alpha')}>Alpha (Focus)</Button>
                    <Button size="sm" variant={binauralFilter === 'beta' ? 'primary' : 'outline'} onClick={() => setBinauralFilter('beta')}>Beta (Alert)</Button>
                  </div>
                  
                  <div className="space-y-2 mb-4 max-h-80 overflow-y-auto">
                    {/* None option */}
                    <div
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                        !selectedBinauralTrack 
                          ? 'bg-primary-500/10 border border-primary-500' 
                          : 'bg-neutral-800/50 border border-transparent hover:bg-neutral-800'
                      }`}
                      onClick={() => { setSelectedBinauralTrack(''); setBinauralVolume(0) }}
                    >
                      {!selectedBinauralTrack && (
                        <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm md:text-base">None</p>
                        <p className="text-xs md:text-sm text-neutral-400">No binaural</p>
                      </div>
                    </div>
                    
                    {binauralTracks
                      .filter(track => {
                        if (!track.name) return false
                        if (binauralFilter === 'all') return true
                        if (binauralFilter === 'pure') return track.name.includes('-pure')
                        return track.name.includes(`-${binauralFilter}`)
                      })
                      .map((track) => {
                        const isSelected = selectedBinauralTrack === track.id
                        const isPreviewing = previewingTrack === track.id
                        return (
                          <div
                            key={track.id}
                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                              isSelected 
                                ? 'bg-purple-500/10 border border-purple-500' 
                                : 'bg-neutral-800/50 border border-transparent hover:bg-neutral-800'
                            }`}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedBinauralTrack('')
                                setBinauralVolume(0)
                              } else {
                                setSelectedBinauralTrack(track.id)
                                if (binauralVolume === 0) setBinauralVolume(15)
                              }
                            }}
                          >
                            {isSelected && (
                              <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium text-sm md:text-base">{track.display_name}</p>
                              {track.description && (
                                <p className="text-xs md:text-sm text-neutral-400">{track.description}</p>
                              )}
                            </div>
                            <div className="relative flex-shrink-0 w-9 h-9">
                              {/* Circular progress indicator */}
                              {isPreviewing && (
                                <svg className="absolute inset-0 w-9 h-9 -rotate-90 pointer-events-none" viewBox="0 0 36 36" style={{ zIndex: 10 }}>
                                  {/* Background track */}
                                  <circle
                                    cx="18"
                                    cy="18"
                                    r="16"
                                    fill="none"
                                    stroke="rgba(31,31,31,0.3)"
                                    strokeWidth="2"
                                  />
                                  {/* Progress */}
                                  <circle
                                    cx="18"
                                    cy="18"
                                    r="16"
                                    fill="none"
                                    stroke="#1F1F1F"
                                    strokeWidth="2"
                                    strokeDasharray="100.53"
                                    strokeDashoffset={100.53 - (100.53 * previewProgress / 100)}
                                    className="transition-all duration-100"
                                  />
                                </svg>
                              )}
                              <button
                                onClick={(e) => handlePreview(e, track.file_url, track.id)}
                                className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                                  isPreviewing 
                                    ? 'bg-purple-500' 
                                    : 'bg-neutral-800 hover:bg-neutral-700'
                                }`}
                              >
                                {isPreviewing ? <X className="w-4 h-4 text-[#1F1F1F]" /> : <Play className="w-4 h-4 text-neutral-400" />}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                  
                  {selectedBinauralTrack && (
                    <div className="bg-neutral-900/60 border border-neutral-700 rounded-xl p-4">
                      <label className="block text-sm font-medium text-white mb-2">
                        Binaural Volume: {binauralVolume}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        value={binauralVolume}
                        onChange={(e) => setBinauralVolume(parseInt(e.target.value))}
                        className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                      <div className="flex justify-between text-xs text-neutral-400 mt-1">
                        <span>Off (0%)</span>
                        <span>Subtle (10%)</span>
                        <span>Balanced (15%)</span>
                        <span>Strong (30%)</span>
                      </div>
                    </div>
                  )}
                  </>
                  )}
                </Card>
              )}

              {/* Section Selection */}
              <Card variant="glass" className="p-4 md:p-6 mb-6 relative z-10">
                <button 
                  onClick={() => setShowSectionsSection(!showSectionsSection)}
                  className={`w-full relative flex flex-col items-center justify-center ${showSectionsSection ? 'mb-3' : ''}`}
                >
                  <h3 className="text-base font-semibold text-white">Which Sections to Mix?</h3>
                  {!showSectionsSection && (
                    <p className="text-xs text-neutral-400 mt-1">
                      {mixAllSections 
                        ? 'All sections' 
                        : selectedMixSections.length > 0 
                          ? `${selectedMixSections.length} section${selectedMixSections.length > 1 ? 's' : ''} selected`
                          : 'None selected'}
                    </p>
                  )}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    {showSectionsSection ? (
                      <ChevronUp className="w-5 h-5 text-neutral-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-neutral-400" />
                    )}
                  </div>
                </button>
                
                {showSectionsSection && (
                <>
                <p className="text-sm text-neutral-400 mb-4 text-center">
                  Mix all sections or select specific ones for a focused audio set.
                </p>
                <SectionSelector
                  allSelected={mixAllSections}
                  onAllSelectedChange={setMixAllSections}
                  selectedSections={selectedMixSections}
                  onSelectedSectionsChange={setSelectedMixSections}
                  label="Mix All Sections"
                  availableSections={existingVoiceSets.find(s => s.voice_id === selectedBaseVoice)?.available_sections}
                />
                </>
                )}
              </Card>

              {/* Output Format - only show if more than 1 section available */}
              {(() => {
                const availableSectionsForVoice = existingVoiceSets.find(s => s.voice_id === selectedBaseVoice)?.available_sections || []
                const effectiveSectionCount = mixAllSections 
                  ? availableSectionsForVoice.length 
                  : selectedMixSections.filter(s => availableSectionsForVoice.includes(s)).length
                
                // Only show format options if more than 1 section
                if (effectiveSectionCount <= 1) return null
                
                return (
                  <Card variant="glass" className="p-4 md:p-6 mb-6 relative z-10">
                    <button 
                      onClick={() => setShowOutputFormatSection(!showOutputFormatSection)}
                      className={`w-full relative flex flex-col items-center justify-center ${showOutputFormatSection ? 'mb-3' : ''}`}
                    >
                      <h3 className="text-base font-semibold text-white">Output Format</h3>
                      {!showOutputFormatSection && (
                        <p className="text-xs text-neutral-400 mt-1">
                          {mixOutputFormat === 'individual' ? 'Individual Sections' 
                            : mixOutputFormat === 'combined' ? 'Combined Full Track'
                            : 'Both'}
                        </p>
                      )}
                      <div className="absolute right-0 top-1/2 -translate-y-1/2">
                        {showOutputFormatSection ? (
                          <ChevronUp className="w-5 h-5 text-neutral-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-neutral-400" />
                        )}
                      </div>
                    </button>
                    
                    {showOutputFormatSection && (
                    <FormatSelector
                      value={mixOutputFormat}
                      onChange={setMixOutputFormat}
                      disabled={generating}
                    />
                    )}
                  </Card>
                )
              })()}

              {/* Mix Summary */}
              {selectedBackgroundTrack && selectedMixRatio && (
                <div className="mb-6">
                  <Card variant="glass" className="p-4">
                    <h4 className="text-base font-semibold text-white mb-4 text-center">Final Mix Preview</h4>
                    <div className="space-y-2">
                      {(() => {
                        const selectedRatio = mixRatios.find(r => r.id === selectedMixRatio)
                        if (!selectedRatio) return null
                        
                        const adjusted = (selectedBinauralTrack && binauralVolume > 0)
                          ? calculateAdjustedVolumes(selectedRatio.voice_volume, selectedRatio.bg_volume, binauralVolume)
                          : { voice: selectedRatio.voice_volume, bg: selectedRatio.bg_volume, binaural: 0 }
                        
                        const selectedBg = backgroundTracks.find(t => t.id === selectedBackgroundTrack)
                        const selectedBin = (selectedBinauralTrack && binauralVolume > 0) ? binauralTracks.find(t => t.id === selectedBinauralTrack) : null
                        
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-neutral-300">Your Voice:</span>
                              <span className="text-white font-semibold">{adjusted.voice}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-neutral-300">{selectedBg?.display_name}:</span>
                              <span className="text-white font-semibold">{adjusted.bg}%</span>
                            </div>
                            {selectedBin && (
                              <div className="flex items-center justify-between">
                                <span className="text-purple-300">{selectedBin.display_name}:</span>
                                <span className="text-purple-400 font-semibold">{adjusted.binaural}%</span>
                              </div>
                            )}
                            <div className="pt-2 mt-2 border-t border-neutral-700">
                              <div className="flex items-center justify-between">
                                <span className="text-neutral-400 text-sm">Total:</span>
                                <span className="text-white font-semibold">100%</span>
                              </div>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </Card>
                </div>
              )}

              {/* Generate Button */}
              <div className="flex justify-center">
                <Button 
                  variant="primary" 
                  onClick={handleGenerateCustomMix}
                  disabled={generating || !selectedBackgroundTrack || !selectedMixRatio || !selectedBaseVoice || (!mixAllSections && selectedMixSections.length === 0)}
                  className="w-full md:w-auto"
                >
                  {generating ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Generating Mix...
                    </>
                  ) : (
                    <>
                      <Music className="w-4 h-4 mr-2" />
                      Generate Mix ({mixAllSections ? 'All Sections' : `${selectedMixSections.length} Section${selectedMixSections.length !== 1 ? 's' : ''}`})
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </Card>
      </Stack>
    </Container>
  )
}
