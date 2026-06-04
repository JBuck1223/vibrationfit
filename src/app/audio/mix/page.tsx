"use client"
import React, { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button, Card, Spinner, Container, Stack, Toggle } from '@/lib/design-system/components'
import { useAudioStudio, QueueStatusBanner, AudioSourceSelector } from '@/components/audio-studio'
import type { AudioSourceSelection } from '@/components/audio-studio'
import type { VisionData } from '@/components/audio-studio'
import type { Story } from '@/lib/stories/types'
import { createClient } from '@/lib/supabase/client'
import { Headphones, CheckCircle, Play, Moon, Zap, Sparkles, Music, X, Wand2, Mic, Clock, Music2, Plus, Waves, Search, Home } from 'lucide-react'
import Link from 'next/link'
import { getVisionCategoryKeys, VISION_CATEGORIES } from '@/lib/design-system'
import { SectionSelector } from '@/components/SectionSelector'
import { FormatSelector, OutputFormat } from '@/components/FormatSelector'
import { CompletedStepRow } from '@/components/CompletedStepRow'

interface Voice {
  id: string
  name: string
}

interface ExistingVoiceSet {
  id: string
  voice_id: string
  voice_name: string
  variant: string
  created_at: string
  /** Per-section (category) files only; excludes combined `section_key: full` */
  track_count: number
  /** True when this set has a completed combined full-vision file (all sections in one track). */
  hasFullCombinedTrack: boolean
  available_sections: string[]
  sample_audio_url?: string
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

export default function AudioMixPage() {
  const router = useRouter()
  const pathname = usePathname()
  const pathPrefix = pathname.startsWith('/intensive/') ? '/intensive' : ''
  const { refreshAudioSets, refreshBatches, sourceType, sourceId, allVisions, visionLoading } = useAudioStudio()

  // Defer intensive mode detection to after mount to avoid hydration mismatch
  const [isIntensivePath, setIsIntensivePath] = useState(false)
  useEffect(() => {
    setIsIntensivePath(pathname.startsWith('/intensive/'))
  }, [pathname])

  // Source selection
  const [selectedSource, setSelectedSource] = useState<AudioSourceSelection | null>(null)
  const selectedVision = selectedSource?.vision || null
  const selectedStory = selectedSource?.story || null
  const activeSourceType = selectedSource?.sourceType || null
  const activeSourceId = selectedSource?.sourceId || null

  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [sourceSelectionEpoch, setSourceSelectionEpoch] = useState(0)
  const step1Ref = useRef<HTMLDivElement>(null)
  const step2Ref = useRef<HTMLDivElement>(null)
  const step3Ref = useRef<HTMLDivElement>(null)

  // Intensive mode: auto-select the active life vision as source
  const [intensiveAutoSelected, setIntensiveAutoSelected] = useState(false)
  useEffect(() => {
    if (!isIntensivePath || intensiveAutoSelected || visionLoading || allVisions.length === 0) return
    const activeVision = allVisions.find(v => v.is_active) ?? allVisions[0]
    if (!activeVision) return
    setIntensiveAutoSelected(true)
    setSelectedSource({
      sourceType: 'life_vision',
      sourceId: activeVision.id,
      vision: activeVision,
    })
    setExistingVoiceSets([])
    setSelectedBaseVoiceSetId('')
    setLoading(true)
    setSourceSelectionEpoch(n => n + 1)
    setCurrentStep(2)
  }, [isIntensivePath, intensiveAutoSelected, visionLoading, allVisions])

  const scrollToStep = (ref: React.RefObject<HTMLDivElement | null>) => {
    requestAnimationFrame(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const [generating, setGenerating] = useState(false)
  const [generatingComboId, setGeneratingComboId] = useState<string | null>(null)
  const [voices, setVoices] = useState<Voice[]>([])
  const [existingVoiceSets, setExistingVoiceSets] = useState<ExistingVoiceSet[]>([])
  
  /** `audio_sets.id` — a voice can appear in multiple sets, so we key on set id, not `voice_id`. */
  const [selectedBaseVoiceSetId, setSelectedBaseVoiceSetId] = useState<string>('')
  const [baseVoiceSearch, setBaseVoiceSearch] = useState('')

  const selectedBaseVoiceSet = existingVoiceSets.find((s) => s.id === selectedBaseVoiceSetId) ?? null
  const selectedVoiceId = selectedBaseVoiceSet?.voice_id ?? ''
  
  // Background Track Selection
  const [backgroundTracks, setBackgroundTracks] = useState<BackgroundTrack[]>([])
  const [selectedBackgroundTrack, setSelectedBackgroundTrack] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [bgTrackSearch, setBgTrackSearch] = useState('')
  
  // Mix Ratio Selection
  const [mixRatios, setMixRatios] = useState<MixRatio[]>([])
  const [selectedMixRatio, setSelectedMixRatio] = useState<string>('')
  
  // Binaural Enhancement (Optional 3rd track)
  const [binauralTracks, setBinauralTracks] = useState<BackgroundTrack[]>([])
  const [selectedBinauralTrack, setSelectedBinauralTrack] = useState<string>('')
  const [binauralVolume, setBinauralVolume] = useState<number>(0)
  const [binauralFilter, setBinauralFilter] = useState<string>('all')
  const [binauralSearch, setBinauralSearch] = useState('')
  
  // Intensive mode: hide Binaural Enhancement until user completes intensive (graduate unlock)
  const [isIntensiveMode, setIsIntensiveMode] = useState(false)

  // Section Selection for Custom Mixing (before wizard-derived values)
  const [mixAllSections, setMixAllSections] = useState(true)
  const [selectedMixSections, setSelectedMixSections] = useState<string[]>([])
  const [mixOutputFormat, setMixOutputFormat] = useState<OutputFormat>('individual')

  /** Build My Own sequential wizard */
  type CustomMixWizardStep = 'ratio' | 'background' | 'binaural' | 'sections' | 'output' | 'review'
  const [customMixStep, setCustomMixStep] = useState<CustomMixWizardStep>('ratio')
  /** User clicked a binaural option (None or track) before Continue */
  const [customBinauralAck, setCustomBinauralAck] = useState(false)
  const customRatioRef = useRef<HTMLDivElement>(null)
  const customBgRef = useRef<HTMLDivElement>(null)
  const customBinRef = useRef<HTMLDivElement>(null)
  const customSectionsRef = useRef<HTMLDivElement>(null)
  const customOutputRef = useRef<HTMLDivElement>(null)
  const customReviewRef = useRef<HTMLDivElement>(null)

  const scrollToCustomPanel = (ref: React.RefObject<HTMLDivElement | null>) => {
    requestAnimationFrame(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  useEffect(() => {
    if (customMixStep !== 'binaural') return
    if (!selectedBinauralTrack && binauralVolume === 0) {
      setCustomBinauralAck(true)
    }
  }, [customMixStep, selectedBinauralTrack, binauralVolume])

  // Recommended Combos / Build My Own (must be before handleMixModeChange)
  const [recommendedCombos, setRecommendedCombos] = useState<any[]>([])
  const [mixMode, setMixMode] = useState<'recommended' | 'custom'>('recommended')

  const handleMixModeChange = (mode: 'recommended' | 'custom') => {
    setMixMode(mode)
    if (mode === 'custom') {
      setCustomMixStep('ratio')
      setCustomBinauralAck(false)
      setSelectedMixRatio('')
      setSelectedBackgroundTrack('')
      setSelectedBinauralTrack('')
      setBinauralVolume(0)
    }
  }

  // Audio preview
  const [previewingTrack, setPreviewingTrack] = useState<string | null>(null)
  const [previewProgress, setPreviewProgress] = useState<number>(0)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  const isVoiceOnly = (() => {
    const ratio = mixRatios.find(r => r.id === selectedMixRatio)
    return ratio ? ratio.bg_volume === 0 : false
  })()

  const availableSectionsForMix = selectedBaseVoiceSet?.available_sections || []
  const effectiveSectionCountForMix = mixAllSections
    ? availableSectionsForMix.length
    : selectedMixSections.filter((s) => availableSectionsForMix.includes(s)).length
  const customShowOutputStep = effectiveSectionCountForMix > 1
  const customShowBinauralStep =
    !isVoiceOnly && binauralTracks.length > 0 && !isIntensiveMode

  const pickMixRatio = (id: string) => {
    const r = mixRatios.find((x) => x.id === id)
    const vo = r ? r.bg_volume === 0 : false
    if (vo) {
      setSelectedBackgroundTrack('')
      setSelectedBinauralTrack('')
      setBinauralVolume(0)
    }
    setSelectedMixRatio(id)
    if (vo) {
      setCustomMixStep('sections')
      scrollToCustomPanel(customSectionsRef)
    } else {
      setCustomMixStep('background')
      scrollToCustomPanel(customBgRef)
    }
  }

  const pickBackgroundTrack = (trackId: string) => {
    const backgroundChanged = trackId !== selectedBackgroundTrack
    setSelectedBackgroundTrack(trackId)
    if (backgroundChanged) {
      setSelectedBinauralTrack('')
      setBinauralVolume(0)
    }
    if (!isVoiceOnly && binauralTracks.length > 0 && !isIntensiveMode) {
      setCustomBinauralAck(true)
      setCustomMixStep('binaural')
      scrollToCustomPanel(customBinRef)
    } else {
      setCustomMixStep('sections')
      scrollToCustomPanel(customSectionsRef)
    }
  }

  const finishBinauralStep = () => {
    setCustomMixStep('sections')
    scrollToCustomPanel(customSectionsRef)
  }

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

  function handleSourceSelected(selection: AudioSourceSelection) {
    setSelectedSource(selection)
    setExistingVoiceSets([])
    setSelectedBaseVoiceSetId('')
    setLoading(true)
    setSourceSelectionEpoch(n => n + 1)
    setCurrentStep(2)
    if (!isIntensivePath) {
      scrollToStep(step2Ref)
    }
  }

  useEffect(() => {
    if (!selectedSource) return
    loadData()
  }, [selectedSource?.sourceId, sourceSelectionEpoch])

  async function loadData() {
    if (!activeSourceId) return
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('id')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle()
      setIsIntensiveMode(!!checklist)
    } else {
      setIsIntensiveMode(false)
    }

    let voiceList: Voice[] = []
    try {
      const resp = await fetch('/api/audio/voices', { cache: 'no-store' })
      const data = await resp.json()
      voiceList = (data.voices || []).map((v: any) => ({ 
        id: v.id, 
        name: v.brandName || v.name
      }))
      setVoices(voiceList)
    } catch {}

    // Load existing voice-only (standard + personal) sets with their actual tracks
    let setsQuery = supabase
      .from('audio_sets')
      .select(`
        id,
        voice_id,
        variant,
        created_at,
        audio_tracks(section_key, status, audio_url)
      `)
      .in('variant', ['standard', 'personal'])
      .order('created_at', { ascending: false })

    if (activeSourceType === 'life_vision') {
      setsQuery = setsQuery.eq('vision_id', activeSourceId)
    } else if (activeSourceType === 'story') {
      setsQuery = setsQuery.eq('content_type', 'story').eq('content_id', activeSourceId)
    }

    const { data: sets } = await setsQuery

    const orderedKeys = VISION_CATEGORIES.map(c => c.key) as string[]
    const voiceSets: ExistingVoiceSet[] = (sets || []).map((set: any) => {
      const rawTracks = (set.audio_tracks || []) as { section_key: string; status: string; audio_url?: string }[]
      const fullTrack = rawTracks.find(
        (t) => t.status === 'completed' && t.audio_url && t.section_key === 'full'
      )
      const hasFullCombinedTrack = Boolean(fullTrack)
      const completedTracks = rawTracks.filter(
        (t) => t.status === 'completed' && t.audio_url && t.section_key !== 'full'
      )
      const availableSections = completedTracks
        .map((t) => t.section_key)
        .sort((a: string, b: string) => orderedKeys.indexOf(a) - orderedKeys.indexOf(b))
      const sampleUrl =
        completedTracks.length > 0 ? completedTracks[0].audio_url : fullTrack?.audio_url

      const isPersonal = set.variant === 'personal'

      return {
        id: set.id,
        voice_id: set.voice_id,
        voice_name: isPersonal
          ? 'Your Voice (Personal Recording)'
          : voiceList.find((v: Voice) => v.id === set.voice_id)?.name || set.voice_id,
        variant: set.variant,
        created_at: set.created_at,
        track_count: completedTracks.length,
        hasFullCombinedTrack,
        available_sections: availableSections,
        sample_audio_url: sampleUrl
      }
    })

    setExistingVoiceSets(voiceSets)

    // Intensive mode: auto-select the only voice set and skip to mix step
    if (isIntensivePath && voiceSets.length === 1) {
      setSelectedBaseVoiceSetId(voiceSets[0].id)
      setCurrentStep(3)
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
    if (!selectedBaseVoiceSetId) {
      alert('Please select a base voice first')
      return
    }
    
    const selectedVoiceSet = existingVoiceSets.find((set) => set.id === selectedBaseVoiceSetId)
    if (!selectedVoiceSet || (selectedVoiceSet.track_count === 0 && !selectedVoiceSet.hasFullCombinedTrack)) {
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

      let sectionsPayload: { sectionKey: string; text: string }[] = []

      if (activeSourceType === 'life_vision') {
        const { data: vv } = await supabase
          .from('vision_versions')
          .select('*')
          .eq('id', activeSourceId)
          .single()

        if (!vv) {
          alert('Vision not found')
          setGeneratingComboId(null)
          return
        }

        const selectedVoiceSetData = existingVoiceSets.find((set) => set.id === selectedBaseVoiceSetId)
        const availableSections = selectedVoiceSetData?.available_sections || []
        
        if (availableSections.length === 0) {
          alert('No voice-only tracks available for mixing. Please generate voice-only tracks first.')
          setGeneratingComboId(null)
          return
        }
        
        const catOrder = VISION_CATEGORIES.map(c => c.key) as string[]
        const sections = [...availableSections]
          .sort((a, b) => catOrder.indexOf(a) - catOrder.indexOf(b))
          .map(key => ({ key, text: vv[key] || '' }))
          .filter(s => s.text.trim().length > 0)

        sectionsPayload = sections.map(s => ({ sectionKey: s.key, text: s.text }))
      } else if (activeSourceType === 'story' && selectedStory) {
        const content = selectedStory.content || ''
        if (!content.trim()) {
          alert('Story has no content.')
          setGeneratingComboId(null)
          return
        }
        sectionsPayload = [{ sectionKey: 'full', text: content }]
      }

      if (sectionsPayload.length === 0) {
        alert('No content found for mixing.')
        setGeneratingComboId(null)
        return
      }

      const selectedVoiceSetData = existingVoiceSets.find((set) => set.id === selectedBaseVoiceSetId)

      const selectedTrack = combo.background_track
      const selectedRatio = combo.mix_ratio
      const selectedBinaural = combo.binaural_track

      const batchInsert: any = {
        user_id: user.id,
        variant_ids: ['custom'],
        voice_id: selectedVoiceId,
        sections_requested: sectionsPayload,
        total_tracks_expected:
          sectionsPayload.length +
          (mixOutputFormat === 'combined' && sectionsPayload.length > 1 ? 1 : 0),
        status: 'pending',
        metadata: {
          custom_mix: true,
          output_format: mixOutputFormat,
          source_type: activeSourceType,
          background_track_id: combo.background_track_id,
          background_track_url: selectedTrack?.file_url,
          mix_ratio_id: combo.mix_ratio_id,
          voice_volume: selectedRatio.voice_volume,
          bg_volume: selectedRatio.bg_volume,
          ...(combo.binaural_track_id && {
            binaural_track_id: combo.binaural_track_id,
            binaural_track_url: selectedBinaural.file_url,
            binaural_volume: combo.binaural_volume || 15
          }),
          ...(activeSourceType === 'story' && { story_id: activeSourceId, content_type: 'story' })
        }
      }
      if (activeSourceType === 'life_vision') {
        batchInsert.vision_id = activeSourceId
      } else if (activeSourceType === 'story') {
        batchInsert.content_type = 'story'
        batchInsert.content_id = activeSourceId
      }

      const { data: batch, error: batchError } = await supabase
        .from('audio_generation_batches')
        .insert(batchInsert)
        .select()
        .single()

      if (batchError || !batch) {
        console.error('Batch creation error:', batchError)
        alert('Failed to create generation batch')
        setGeneratingComboId(null)
        return
      }

      const comboPayload: any = {
        batchId: batch.id,
        voice: selectedVoiceId,
        sections: sectionsPayload,
        backgroundTrackUrl: selectedTrack?.file_url,
        voiceVolume: selectedRatio.voice_volume,
        bgVolume: selectedRatio.bg_volume,
        binauralTrackUrl: selectedBinaural?.file_url || null,
        binauralVolume: combo.binaural_volume || 0,
        outputFormat: mixOutputFormat
      }

      if (activeSourceType === 'life_vision') {
        comboPayload.visionId = activeSourceId
      } else if (activeSourceType === 'story') {
        comboPayload.storyId = activeSourceId
        comboPayload.contentType = 'story'
      }

      const selectedVoiceSet = selectedVoiceSetData
      if (selectedVoiceSet?.variant === 'personal') {
        comboPayload.sourceAudioSetId = selectedVoiceSet.id
      }

      fetch(`/api/audio/generate-custom-mix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comboPayload)
      }).then(res => {
        if (!res.ok) {
          console.error('Generation API error:', res.status)
        }
      }).catch(err => {
        console.error('Generation API error:', err)
      })

      router.push(`${pathPrefix}/audio/queue`)
      
    } catch (err) {
      console.error('Error generating custom mix:', err)
      alert('Failed to generate mix. Please try again.')
      setGeneratingComboId(null)
    }
  }

  async function handleGenerateCustomMix() {
    if (!selectedMixRatio) {
      alert('Please select a mix ratio')
      return
    }

    if (!isVoiceOnly && !selectedBackgroundTrack) {
      alert('Please select a background track')
      return
    }

    if (!selectedBaseVoiceSetId) {
      alert('Please select a base voice')
      return
    }
    
    const selectedVoiceSet = existingVoiceSets.find((set) => set.id === selectedBaseVoiceSetId)
    if (!selectedVoiceSet || (selectedVoiceSet.track_count === 0 && !selectedVoiceSet.hasFullCombinedTrack)) {
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

      const selectedVoiceSetData = existingVoiceSets.find((set) => set.id === selectedBaseVoiceSetId)
      const availableSections = selectedVoiceSetData?.available_sections || []

      let sections: { key: string; text: string }[] = []

      if (activeSourceType === 'life_vision') {
        const { data: vv } = await supabase
          .from('vision_versions')
          .select('*')
          .eq('id', activeSourceId)
          .single()

        if (!vv) {
          alert('Vision not found')
          setGenerating(false)
          return
        }

        if (availableSections.length === 0) {
          alert('No voice-only tracks available for mixing.')
          setGenerating(false)
          return
        }

        const catOrderKeys = VISION_CATEGORIES.map(c => c.key) as string[]

        if (mixAllSections) {
          sections = [...availableSections]
            .sort((a, b) => catOrderKeys.indexOf(a) - catOrderKeys.indexOf(b))
            .map(key => ({ key, text: vv[key] || '' }))
        } else {
          const validSelections = selectedMixSections.filter(key => availableSections.includes(key))
          const sortedSelectedSections = [...validSelections].sort(
            (a, b) => catOrderKeys.indexOf(a) - catOrderKeys.indexOf(b)
          )
          sections = sortedSelectedSections.map(key => ({ key, text: vv[key] || '' }))
        }
        sections = sections.filter(s => s.text.trim().length > 0)
      } else if (activeSourceType === 'story' && selectedStory) {
        const content = selectedStory.content || ''
        if (!content.trim()) {
          alert('Story has no content.')
          setGenerating(false)
          return
        }
        sections = [{ key: 'full', text: content }]
      }
      
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

      if (!selectedRatio || (!isVoiceOnly && !selectedTrack)) {
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
      const includesCombinedTrack = effectiveOutputFormat === 'combined' && sectionsPayload.length > 1

      const batchMeta: any = {
        custom_mix: true,
        output_format: effectiveOutputFormat,
        source_type: activeSourceType,
        mix_all_sections: mixAllSections,
        selected_sections: mixAllSections ? null : selectedMixSections,
        audio_set_name: mixSetName || null,
        background_track_id: selectedBackgroundTrack,
        background_track_url: selectedTrack?.file_url,
        mix_ratio_id: selectedMixRatio,
        voice_volume: selectedBinaural && binauralVolume > 0
          ? Math.round((selectedRatio.voice_volume / (selectedRatio.voice_volume + selectedRatio.bg_volume)) * (100 - binauralVolume))
          : selectedRatio.voice_volume,
        bg_volume: selectedBinaural && binauralVolume > 0
          ? Math.round((selectedRatio.bg_volume / (selectedRatio.voice_volume + selectedRatio.bg_volume)) * (100 - binauralVolume))
          : selectedRatio.bg_volume,
        original_voice_volume: selectedRatio.voice_volume,
        original_bg_volume: selectedRatio.bg_volume,
        ...(selectedBinaural && {
          binaural_track_id: selectedBinauralTrack,
          binaural_track_url: selectedBinaural.file_url,
          binaural_volume: binauralVolume
        }),
        ...(activeSourceType === 'story' && { story_id: activeSourceId, content_type: 'story' })
      }

      const batchRow: any = {
        user_id: user.id,
        variant_ids: ['custom'],
        voice_id: selectedVoiceId,
        sections_requested: sectionsPayload,
        total_tracks_expected: sectionsPayload.length + (includesCombinedTrack ? 1 : 0),
        status: 'pending',
        metadata: batchMeta,
      }
      if (activeSourceType === 'life_vision') {
        batchRow.vision_id = activeSourceId
      } else if (activeSourceType === 'story') {
        batchRow.content_type = 'story'
        batchRow.content_id = activeSourceId
      }

      const { data: batch, error: batchError } = await supabase
        .from('audio_generation_batches')
        .insert(batchRow)
        .select()
        .single()

      if (batchError || !batch) {
        console.error('Failed to create batch:', batchError)
        alert('Failed to create generation batch. Please try again.')
        setGenerating(false)
        return
      }

      const generatePayload: any = {
        sections: sectionsPayload,
        voice: selectedVoiceId,
        batchId: batch.id,
        backgroundTrackUrl: selectedTrack?.file_url,
        voiceVolume: selectedRatio.voice_volume,
        bgVolume: selectedRatio.bg_volume,
        audioSetName: mixSetName || undefined,
        outputFormat: effectiveOutputFormat
      }

      if (activeSourceType === 'life_vision') {
        generatePayload.visionId = activeSourceId
      } else if (activeSourceType === 'story') {
        generatePayload.storyId = activeSourceId
        generatePayload.contentType = 'story'
      }
      
      if (selectedVoiceSet?.variant === 'personal') {
        generatePayload.sourceAudioSetId = selectedVoiceSet.id
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

      router.push(`${pathPrefix}/audio/queue`)
    } catch (error) {
      console.error('Generation error:', error)
      alert('An error occurred during generation. Please try again.')
      setGenerating(false)
    }
  }

  const sourceComplete = !!selectedSource

  const sourceSummaryValue =
    activeSourceType === 'life_vision' && selectedVision
      ? (
          <span className="inline-flex items-center gap-1.5">
            Life Vision — Version {selectedVision.version_number}
            {selectedVision.household_id && <Home className="w-3.5 h-3.5 text-secondary-500" />}
          </span>
        )
      : activeSourceType === 'story' && selectedStory
        ? `Story — ${selectedStory.title || 'Untitled'}`
        : ''

  const baseVoiceSummaryValue = selectedBaseVoiceSet?.voice_name || 'Base voice'

  return (
    <Container size="xl">
      <Stack gap="lg" className="overflow-visible">
        <h1 className="sr-only">Mix Audio</h1>

        <QueueStatusBanner />

        <div className="flex flex-col gap-4">
          {!isIntensivePath && (
          <div ref={step1Ref}>
            <div className={currentStep === 1 ? 'block' : 'hidden'}>
              <AudioSourceSelector
                onSourceSelected={handleSourceSelected}
                initialSourceType={sourceType}
                initialSourceId={sourceId}
                stepNumber={1}
                sourceTypeDescriptions={{
                  life_vision:
                    'Add background music and binaural beats to your Life Vision voice tracks.',
                  story:
                    "Add background music and binaural beats to your story's voice track.",
                }}
              />
            </div>
            {currentStep !== 1 && (
              <CompletedStepRow
                step={1}
                label="Source"
                value={sourceSummaryValue}
                onChange={() => {
                  setLoading(false)
                  setCurrentStep(1)
                  scrollToStep(step1Ref)
                }}
              />
            )}
          </div>
          )}

          {(isIntensivePath ? !!selectedSource : sourceComplete) && currentStep >= 2 && (
          <div ref={step2Ref}>
            {loading && currentStep === 2 ? (
              <div className="flex min-h-[20vh] items-center justify-center">
                <Spinner size="lg" />
              </div>
            ) : currentStep === 2 ? (
              existingVoiceSets.length === 0 ? (
          <Card variant="glass" className="p-6 md:p-8 text-center">
            <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mic className="w-8 h-8 text-neutral-500" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No Voice Recordings Yet</h2>
            <p className="text-neutral-400 mb-6 max-w-md mx-auto">
              You need to generate voice-only tracks first before you can create mixes with background music.
            </p>
            <Button variant="primary" asChild>
              <Link href={activeSourceType && activeSourceId ? `${pathPrefix}/audio/generate?source=${activeSourceType}&sourceId=${activeSourceId}` : `${pathPrefix}/audio/generate`}>
                <Plus className="w-4 h-4 mr-2" />
                Generate Voice Tracks
              </Link>
            </Button>
          </Card>
              ) : (
        <Card variant="glass" className="p-3 md:p-5 lg:p-6">
          <div className="flex flex-col items-center text-center gap-1 pb-4 border-b border-neutral-800">
            <div className="flex items-center justify-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary-500/15 text-primary-500 text-sm font-semibold flex items-center justify-center shrink-0">
                {isIntensivePath ? 1 : 2}
              </span>
              <h2 className="text-lg font-semibold text-white">Select Base Voice</h2>
            </div>
            <p className="w-full text-sm text-neutral-400">Choose which voice recording to mix</p>
          </div>

          <div className="mt-6 space-y-6">

          {existingVoiceSets.length > 5 && (
            <div className="relative max-w-md mx-auto mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
              <input
                type="text"
                value={baseVoiceSearch}
                onChange={(e) => setBaseVoiceSearch(e.target.value)}
                placeholder="Search by voice name or type..."
                className="w-full pl-9 pr-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#39FF14]/50"
              />
            </div>
          )}

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {(baseVoiceSearch.trim()
              ? existingVoiceSets.filter(set => {
                  const q = baseVoiceSearch.toLowerCase()
                  return (
                    set.voice_name.toLowerCase().includes(q) ||
                    set.variant.toLowerCase().includes(q) ||
                    (set.variant === 'personal' && 'recorded'.includes(q))
                  )
                })
              : existingVoiceSets
            ).map((set) => {
              const isPreviewing = previewingTrack === set.id
              const isSelected = selectedBaseVoiceSetId === set.id
              return (
                <div
                  key={set.id}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-primary-500/10 border border-primary-500'
                      : 'bg-neutral-800/50 border border-transparent hover:bg-neutral-800'
                  }`}
                  onClick={() => {
                    setSelectedBaseVoiceSetId(set.id)
                    setCurrentStep(3)
                    scrollToStep(step3Ref)
                  }}
                >
                  {isSelected && (
                    <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm md:text-base">{set.voice_name}</p>
                    <p className="text-xs md:text-sm text-neutral-400">
                      {(() => {
                        const t = VISION_CATEGORIES.length
                        const n = set.track_count
                        const hasFull = set.hasFullCombinedTrack
                        if (hasFull) {
                          if (n === 0) {
                            return 'Full life vision in one combined file'
                          }
                          if (n < t) {
                            return `Full combined file + ${n} per-section file${n === 1 ? '' : 's'}`
                          }
                          return `Full combined + ${n} per-section files`
                        }
                        if (n < t) {
                          return `${n} of ${t} per-section files (not a full 14 set)`
                        }
                        return `${n} per-section files (full 14 set)`
                      })()}
                    </p>
                  </div>
                  {set.sample_audio_url && (
                    <div className="relative flex-shrink-0 w-9 h-9">
                      {isPreviewing && (
                        <svg className="absolute inset-0 w-9 h-9 -rotate-90 pointer-events-none" viewBox="0 0 36 36" style={{ zIndex: 10 }}>
                          <circle
                            cx="18"
                            cy="18"
                            r="16"
                            fill="none"
                            stroke="rgba(31,31,31,0.3)"
                            strokeWidth="2"
                          />
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
                        type="button"
                        onClick={(e) => handlePreview(e, set.sample_audio_url!, set.id)}
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
              )
            })}
          </div>

          {/* Generate New Base Voice Button */}
          {!isIntensivePath && (
          <div className="flex justify-center pt-2">
            <Button variant="outline" asChild>
              <Link href={`${pathPrefix}/audio/generate`} className="flex items-center gap-2">
                <Waves className="w-5 h-5" />
                Generate New Base Voice
              </Link>
            </Button>
          </div>
          )}
          </div>
        </Card>
              )
            ) : (
              !(isIntensivePath && existingVoiceSets.length <= 1) && (
              <CompletedStepRow
                step={isIntensivePath ? 1 : 2}
                label="Base voice"
                value={baseVoiceSummaryValue}
                onChange={() => {
                  setLoading(false)
                  setCurrentStep(2)
                  scrollToStep(step2Ref)
                }}
              />
              )
            )}
          </div>
          )}
        </div>

        {sourceComplete && !loading && existingVoiceSets.length > 0 && currentStep === 3 && (
          <div ref={step3Ref}>
        {/* Step 3: Mix Mode + options */}
        <Card variant="glass" className="p-3 md:p-5 lg:p-6">
          <div className="flex flex-col items-center text-center gap-1 pb-4 border-b border-neutral-800">
            <div className="flex items-center justify-center gap-2">
              {!isIntensivePath && (
              <span className="w-7 h-7 rounded-full bg-primary-500/15 text-primary-500 text-sm font-semibold flex items-center justify-center shrink-0">
                3
              </span>
              )}
              <h2 className="text-lg font-semibold text-white">Create Your Mix</h2>
            </div>
            <p className="w-full text-sm text-neutral-400">
              Choose how you want to create your mix
            </p>
          </div>

          <div className="flex justify-center mt-6 mb-6">
            <Toggle
              variant="segmented"
              value={mixMode}
              onChange={handleMixModeChange}
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
                        disabled={generatingComboId !== null || !selectedBaseVoiceSetId}
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

          {/* CUSTOM BUILD MODE — sequential wizard */}
          {mixMode === 'custom' && (
            <>
              <div className="space-y-3 mb-4">
                {selectedMixRatio && customMixStep !== 'ratio' && (
                  <CompletedStepRow
                    step={1}
                    badgeVariant="accent"
                    label="Mix ratio"
                    value={(() => {
                      const r = mixRatios.find((x) => x.id === selectedMixRatio)
                      if (!r) return ''
                      const name = r.name.replace(/\s*\(\d+\/\d+\)\s*$/, '')
                      const sub =
                        r.bg_volume === 0
                          ? `${r.voice_volume}% voice (voice only)`
                          : `${r.voice_volume}% voice / ${r.bg_volume}% background`
                      return `${name} — ${sub}`
                    })()}
                    onChange={() => {
                      setCustomMixStep('ratio')
                      scrollToCustomPanel(customRatioRef)
                    }}
                  />
                )}

                {!isVoiceOnly &&
                  selectedBackgroundTrack &&
                  !['ratio', 'background'].includes(customMixStep) && (
                    <CompletedStepRow
                      step={2}
                      badgeVariant="accent"
                      label="Background track"
                      value={
                        backgroundTracks.find((t) => t.id === selectedBackgroundTrack)?.display_name ||
                        'Selected'
                      }
                      onChange={() => {
                        setCustomMixStep('background')
                        scrollToCustomPanel(customBgRef)
                      }}
                    />
                  )}

                {customShowBinauralStep &&
                  ['sections', 'output', 'review'].includes(customMixStep) && (
                    <CompletedStepRow
                      step={3}
                      badgeVariant="accent"
                      label="Binaural enhancement"
                      value={
                        selectedBinauralTrack
                          ? binauralTracks.find((t) => t.id === selectedBinauralTrack)?.display_name ||
                            'Selected'
                          : 'None'
                      }
                      onChange={() => {
                        setCustomMixStep('binaural')
                        scrollToCustomPanel(customBinRef)
                      }}
                    />
                  )}

                {(customMixStep === 'output' || customMixStep === 'review') &&
                  (mixAllSections || selectedMixSections.length > 0) && (
                    <CompletedStepRow
                      step={customShowBinauralStep ? 4 : 2}
                      badgeVariant="accent"
                      label="Sections"
                      value={
                        mixAllSections
                          ? `All ${availableSectionsForMix.length} sections`
                          : `${selectedMixSections.length} section${selectedMixSections.length !== 1 ? 's' : ''} selected`
                      }
                      onChange={() => {
                        setCustomMixStep('sections')
                        scrollToCustomPanel(customSectionsRef)
                      }}
                    />
                  )}

                {customShowOutputStep &&
                  customMixStep === 'review' &&
                  (mixAllSections || selectedMixSections.length > 0) && (
                    <CompletedStepRow
                      step={customShowBinauralStep ? 5 : 3}
                      badgeVariant="accent"
                      label="Output format"
                      value={
                        mixOutputFormat === 'individual'
                          ? `${effectiveSectionCountForMix} ${effectiveSectionCountForMix === 1 ? 'track' : 'tracks'}`
                          : 'Single combined track'
                      }
                      onChange={() => {
                        setCustomMixStep('output')
                        scrollToCustomPanel(customOutputRef)
                      }}
                    />
                  )}
              </div>

              <div ref={customRatioRef}>
                <div className={customMixStep === 'ratio' ? 'block' : 'hidden'}>
                <Card variant="glass" className="p-4 md:p-6 mb-6 overflow-visible relative z-30">
                  <div className="flex flex-col items-center text-center gap-1 mb-4">
                    <h3 className="text-base font-semibold text-white">Choose Mix Ratio</h3>
                    <p className="text-sm text-neutral-400">
                      Voice and background balance for your mix.
                    </p>
                  </div>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {mixRatios.map((ratio) => {
                      const isSelected = selectedMixRatio === ratio.id
                      const cleanName = ratio.name.replace(/\s*\(\d+\/\d+\)\s*$/, '')
                      const sub =
                        ratio.bg_volume === 0
                          ? `${ratio.voice_volume}% voice — voice only`
                          : `${ratio.voice_volume}% voice / ${ratio.bg_volume}% background`
                      return (
                        <div
                          key={ratio.id}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              pickMixRatio(ratio.id)
                            }
                          }}
                          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-primary-500/10 border border-primary-500'
                              : 'bg-neutral-800/50 border border-transparent hover:bg-neutral-800'
                          }`}
                          onClick={() => pickMixRatio(ratio.id)}
                        >
                          {isSelected && (
                            <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm md:text-base">{cleanName}</p>
                            <p className="text-xs md:text-sm text-neutral-400 mt-1">{sub}</p>
                            {ratio.description && (
                              <p className="text-xs text-neutral-500 mt-1">{ratio.description}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
                </div>
              </div>
              {!isVoiceOnly && (
                <div ref={customBgRef}>
                  <div className={customMixStep === 'background' ? 'block' : 'hidden'}>
                <Card variant="glass" className="p-4 md:p-6 mb-6">
                  <div className="flex flex-col items-center text-center gap-1 mb-4">
                    <h3 className="text-base font-semibold text-white">Choose Background Track</h3>
                    <p className="text-sm text-neutral-400">Pick the ambience behind your voice.</p>
                  </div>
                  <div
                    className="flex w-full flex-wrap justify-center gap-1.5 mb-3 md:gap-2 md:mb-4"
                    role="toolbar"
                    aria-label="Background track category"
                  >
                    <Button
                      variant={selectedCategory === 'all' ? 'primary' : 'outline'}
                      size="sm"
                      className="shrink-0 !border !px-3 !py-1.5 text-xs md:!px-3.5 md:!py-2 md:text-sm"
                      onClick={() => setSelectedCategory('all')}
                    >
                      <span className="sm:hidden">All</span>
                      <span className="hidden sm:inline">All Tracks</span>
                    </Button>
                    {Array.from(new Set(backgroundTracks.map((t) => t.category))).map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? 'primary' : 'outline'}
                        size="sm"
                        className="shrink-0 !border !px-3 !py-1.5 text-xs md:!px-3.5 md:!py-2 md:text-sm"
                        onClick={() => setSelectedCategory(category)}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </Button>
                    ))}
                  </div>

                  {backgroundTracks.length > 6 && (
                    <div className="relative max-w-md mx-auto mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                      <input
                        type="text"
                        value={bgTrackSearch}
                        onChange={(e) => setBgTrackSearch(e.target.value)}
                        placeholder="Search tracks by name or description..."
                        className="w-full pl-9 pr-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#39FF14]/50"
                      />
                    </div>
                  )}

                  <div className="space-y-2 mb-4 max-h-80 overflow-y-auto">
                    {backgroundTracks
                      .filter(
                        (track) => selectedCategory === 'all' || track.category === selectedCategory
                      )
                      .filter((track) => {
                        if (!bgTrackSearch.trim()) return true
                        const q = bgTrackSearch.toLowerCase()
                        return (
                          track.display_name.toLowerCase().includes(q) ||
                          (track.description || '').toLowerCase().includes(q)
                        )
                      })
                      .map((track) => {
                        const isSelected = selectedBackgroundTrack === track.id
                        const isPreviewing = previewingTrack === track.id
                        return (
                          <div
                            key={track.id}
                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-primary-500/10 border border-primary-500'
                                : 'bg-neutral-800/50 border border-transparent hover:bg-neutral-800'
                            }`}
                            onClick={() => pickBackgroundTrack(track.id)}
                          >
                            {isSelected && (
                              <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium text-sm md:text-base">
                                {track.display_name}
                              </p>
                              {track.description && (
                                <p className="text-xs md:text-sm text-neutral-400 mt-1">
                                  {track.description}
                                </p>
                              )}
                            </div>
                            <div className="relative flex-shrink-0 w-9 h-9">
                              {isPreviewing && (
                                <svg
                                  className="absolute inset-0 w-9 h-9 -rotate-90 pointer-events-none"
                                  viewBox="0 0 36 36"
                                  style={{ zIndex: 10 }}
                                >
                                  <circle
                                    cx="18"
                                    cy="18"
                                    r="16"
                                    fill="none"
                                    stroke="rgba(31,31,31,0.3)"
                                    strokeWidth="2"
                                  />
                                  <circle
                                    cx="18"
                                    cy="18"
                                    r="16"
                                    fill="none"
                                    stroke="#1F1F1F"
                                    strokeWidth="2"
                                    strokeDasharray="100.53"
                                    strokeDashoffset={100.53 - (100.53 * previewProgress) / 100}
                                    className="transition-all duration-100"
                                  />
                                </svg>
                              )}
                              <button
                                type="button"
                                onClick={(e) => handlePreview(e, track.file_url, track.id)}
                                className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                                  isPreviewing
                                    ? 'bg-primary-500'
                                    : 'bg-neutral-800 hover:bg-neutral-700'
                                }`}
                              >
                                {isPreviewing ? (
                                  <X className="w-4 h-4 text-[#1F1F1F]" />
                                ) : (
                                  <Play className="w-4 h-4 text-neutral-400" />
                                )}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </Card>
                  </div>
                </div>
              )}
              {customShowBinauralStep && (
                <div ref={customBinRef}>
                  <div className={customMixStep === 'binaural' ? 'block' : 'hidden'}>
                <Card variant="glass" className="p-4 md:p-6 mb-6 relative z-10">
                  <div className="flex flex-col items-center text-center gap-1 mb-4">
                    <h3 className="text-base font-semibold text-white">Binaural Enhancement (Optional)</h3>
                    <p className="text-sm text-neutral-400">
                      Add healing frequencies or brainwave entrainment to your mix.
                    </p>
                  </div>

                  <div
                    className="mb-3 w-full max-md:grid max-md:grid-cols-3 max-md:gap-1.5 max-md:[&_button]:min-w-0 max-md:[&_button]:w-full md:mb-4 md:flex md:flex-wrap md:justify-center md:gap-2"
                    role="toolbar"
                    aria-label="Binaural filter"
                  >
                    <Button
                      size="sm"
                      className="shrink-0 !border !px-3 !py-1.5 text-xs md:!px-3.5 md:!py-2 md:text-sm"
                      variant={binauralFilter === 'all' ? 'primary' : 'outline'}
                      onClick={() => setBinauralFilter('all')}
                    >
                      All
                    </Button>
                    <Button
                      size="sm"
                      className="shrink-0 !border !px-3 !py-1.5 text-xs md:!px-3.5 md:!py-2 md:text-sm"
                      variant={binauralFilter === 'pure' ? 'primary' : 'outline'}
                      onClick={() => setBinauralFilter('pure')}
                    >
                      <span className="md:hidden">Pure</span>
                      <span className="hidden md:inline">Pure Solfeggio</span>
                    </Button>
                    <Button
                      size="sm"
                      className="shrink-0 !border !px-3 !py-1.5 text-xs md:!px-3.5 md:!py-2 md:text-sm"
                      variant={binauralFilter === 'delta' ? 'primary' : 'outline'}
                      onClick={() => setBinauralFilter('delta')}
                    >
                      <span className="md:hidden">Delta</span>
                      <span className="hidden md:inline">Delta (Sleep)</span>
                    </Button>
                    <Button
                      size="sm"
                      className="shrink-0 !border !px-3 !py-1.5 text-xs md:!px-3.5 md:!py-2 md:text-sm"
                      variant={binauralFilter === 'theta' ? 'primary' : 'outline'}
                      onClick={() => setBinauralFilter('theta')}
                    >
                      <span className="md:hidden">Theta</span>
                      <span className="hidden md:inline">Theta (Meditation)</span>
                    </Button>
                    <Button
                      size="sm"
                      className="shrink-0 !border !px-3 !py-1.5 text-xs md:!px-3.5 md:!py-2 md:text-sm"
                      variant={binauralFilter === 'alpha' ? 'primary' : 'outline'}
                      onClick={() => setBinauralFilter('alpha')}
                    >
                      <span className="md:hidden">Alpha</span>
                      <span className="hidden md:inline">Alpha (Focus)</span>
                    </Button>
                    <Button
                      size="sm"
                      className="shrink-0 !border !px-3 !py-1.5 text-xs md:!px-3.5 md:!py-2 md:text-sm"
                      variant={binauralFilter === 'beta' ? 'primary' : 'outline'}
                      onClick={() => setBinauralFilter('beta')}
                    >
                      <span className="md:hidden">Beta</span>
                      <span className="hidden md:inline">Beta (Alert)</span>
                    </Button>
                  </div>

                  {binauralTracks.length > 6 && (
                    <div className="relative max-w-md mx-auto mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                      <input
                        type="text"
                        value={binauralSearch}
                        onChange={(e) => setBinauralSearch(e.target.value)}
                        placeholder="Search binaural tracks..."
                        className="w-full pl-9 pr-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#39FF14]/50"
                      />
                    </div>
                  )}

                  <div className="space-y-2 mb-4 max-h-80 overflow-y-auto">
                    <div
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                        customBinauralAck && !selectedBinauralTrack
                          ? 'bg-primary-500/10 border border-primary-500'
                          : 'bg-neutral-800/50 border border-transparent hover:bg-neutral-800'
                      }`}
                      onClick={() => {
                        setSelectedBinauralTrack('')
                        setBinauralVolume(0)
                        setCustomBinauralAck(true)
                      }}
                    >
                      {customBinauralAck && !selectedBinauralTrack && (
                        <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm md:text-base">None</p>
                        <p className="text-xs md:text-sm text-neutral-400">No binaural layer</p>
                      </div>
                    </div>

                    {binauralTracks
                      .filter((track) => {
                        if (!track.name) return false
                        if (binauralFilter === 'all') return true
                        if (binauralFilter === 'pure') return track.name.includes('-pure')
                        return track.name.includes(`-${binauralFilter}`)
                      })
                      .filter((track) => {
                        if (!binauralSearch.trim()) return true
                        const q = binauralSearch.toLowerCase()
                        return (
                          track.display_name.toLowerCase().includes(q) ||
                          (track.description || '').toLowerCase().includes(q)
                        )
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
                              setSelectedBinauralTrack(track.id)
                              if (binauralVolume === 0) setBinauralVolume(15)
                              setCustomBinauralAck(true)
                            }}
                          >
                            {isSelected && (
                              <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium text-sm md:text-base">
                                {track.display_name}
                              </p>
                              {track.description && (
                                <p className="text-xs md:text-sm text-neutral-400">{track.description}</p>
                              )}
                            </div>
                            <div className="relative flex-shrink-0 w-9 h-9">
                              {isPreviewing && (
                                <svg
                                  className="absolute inset-0 w-9 h-9 -rotate-90 pointer-events-none"
                                  viewBox="0 0 36 36"
                                  style={{ zIndex: 10 }}
                                >
                                  <circle
                                    cx="18"
                                    cy="18"
                                    r="16"
                                    fill="none"
                                    stroke="rgba(31,31,31,0.3)"
                                    strokeWidth="2"
                                  />
                                  <circle
                                    cx="18"
                                    cy="18"
                                    r="16"
                                    fill="none"
                                    stroke="#1F1F1F"
                                    strokeWidth="2"
                                    strokeDasharray="100.53"
                                    strokeDashoffset={100.53 - (100.53 * previewProgress) / 100}
                                    className="transition-all duration-100"
                                  />
                                </svg>
                              )}
                              <button
                                type="button"
                                onClick={(e) => handlePreview(e, track.file_url, track.id)}
                                className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                                  isPreviewing ? 'bg-purple-500' : 'bg-neutral-800 hover:bg-neutral-700'
                                }`}
                              >
                                {isPreviewing ? (
                                  <X className="w-4 h-4 text-[#1F1F1F]" />
                                ) : (
                                  <Play className="w-4 h-4 text-neutral-400" />
                                )}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                  </div>

                  {selectedBinauralTrack && (
                    <div className="bg-neutral-900/60 border border-neutral-700 rounded-xl p-4 mb-4">
                      <label className="block text-sm font-medium text-white mb-2">
                        Binaural Volume: {binauralVolume}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        value={binauralVolume}
                        onChange={(e) => setBinauralVolume(parseInt(e.target.value, 10))}
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

                  <div className="flex justify-center mt-2">
                    <Button
                      variant="primary"
                      disabled={!customBinauralAck}
                      onClick={() => finishBinauralStep()}
                    >
                      Continue
                    </Button>
                  </div>
                </Card>
                  </div>
                </div>
              )}
              <div ref={customSectionsRef}>
                <div className={customMixStep === 'sections' ? 'block' : 'hidden'}>
                <Card variant="glass" className="p-4 md:p-6 mb-6 relative z-10">
                  <div className="flex flex-col items-center text-center gap-1 mb-4">
                    <h3 className="text-base font-semibold text-white">Which Sections to Mix?</h3>
                    <p className="text-sm text-neutral-400">
                      Mix all sections or select specific ones for a focused audio set.
                    </p>
                  </div>
                  <SectionSelector
                    toggleVariant="segmented"
                    allSelected={mixAllSections}
                    onAllSelectedChange={setMixAllSections}
                    selectedSections={selectedMixSections}
                    onSelectedSectionsChange={setSelectedMixSections}
                    label="Mix All Sections"
                    availableSections={selectedBaseVoiceSet?.available_sections}
                  />
                  <div className="flex justify-center mt-6">
                    <Button
                      variant="primary"
                      disabled={!mixAllSections && selectedMixSections.length === 0}
                      onClick={() => {
                        if (!mixAllSections && selectedMixSections.length === 0) return
                        if (customShowOutputStep) {
                          setCustomMixStep('output')
                          scrollToCustomPanel(customOutputRef)
                        } else {
                          setCustomMixStep('review')
                          scrollToCustomPanel(customReviewRef)
                        }
                      }}
                    >
                      Continue
                    </Button>
                  </div>
                </Card>
                </div>
              </div>

              {customShowOutputStep && (
                <div ref={customOutputRef}>
                  <div className={customMixStep === 'output' ? 'block' : 'hidden'}>
                <Card variant="glass" className="p-4 md:p-6 mb-6 relative z-10">
                  <div className="flex flex-col items-center text-center gap-1 mb-4">
                    <h3 className="text-base font-semibold text-white">Output Format</h3>
                    <p className="text-sm text-neutral-400">
                      Choose how your sections are delivered as audio files.
                    </p>
                  </div>
                  <FormatSelector
                    value={mixOutputFormat}
                    onChange={setMixOutputFormat}
                    disabled={generating}
                  />
                  <div className="flex justify-center mt-6">
                    <Button
                      variant="primary"
                      onClick={() => {
                        setCustomMixStep('review')
                        scrollToCustomPanel(customReviewRef)
                      }}
                    >
                      Continue
                    </Button>
                  </div>
                </Card>
                  </div>
                </div>
              )}

              {selectedMixRatio &&
                (isVoiceOnly || selectedBackgroundTrack) && (
                  <div ref={customReviewRef}>
                    <div
                      className={customMixStep === 'review' ? 'block' : 'hidden'}
                    >
                  <div className="space-y-6">
                    <Card variant="glass" className="p-4">
                      <h4 className="text-base font-semibold text-white mb-4 text-center">
                        Final Mix Preview
                      </h4>
                      <div className="space-y-2">
                        {(() => {
                          const selectedRatio = mixRatios.find((r) => r.id === selectedMixRatio)
                          if (!selectedRatio) return null

                          const adjusted =
                            selectedBinauralTrack && binauralVolume > 0
                              ? calculateAdjustedVolumes(
                                  selectedRatio.voice_volume,
                                  selectedRatio.bg_volume,
                                  binauralVolume
                                )
                              : {
                                  voice: selectedRatio.voice_volume,
                                  bg: selectedRatio.bg_volume,
                                  binaural: 0,
                                }

                          const selectedBg = backgroundTracks.find((t) => t.id === selectedBackgroundTrack)
                          const selectedBin =
                            selectedBinauralTrack && binauralVolume > 0
                              ? binauralTracks.find((t) => t.id === selectedBinauralTrack)
                              : null

                          return (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="text-neutral-300">Your Voice:</span>
                                <span className="text-white font-semibold">{adjusted.voice}%</span>
                              </div>
                              {!isVoiceOnly && selectedBg && (
                                <div className="flex items-center justify-between">
                                  <span className="text-neutral-300">{selectedBg.display_name}:</span>
                                  <span className="text-white font-semibold">{adjusted.bg}%</span>
                                </div>
                              )}
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

                    <div className="flex justify-center">
                      <Button
                        variant="primary"
                        onClick={handleGenerateCustomMix}
                        disabled={
                          generating ||
                          !selectedMixRatio ||
                          !selectedBaseVoiceSetId ||
                          (!isVoiceOnly && !selectedBackgroundTrack) ||
                          (!mixAllSections && selectedMixSections.length === 0)
                        }
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
                            Generate Mix (
                            {mixAllSections
                              ? 'All Sections'
                              : `${selectedMixSections.length} Section${selectedMixSections.length !== 1 ? 's' : ''}`}
                            )
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                    </div>
                  </div>
                )}
            </>
          )}
        </Card>
          </div>
        )}
      </Stack>
    </Container>
  )
}
