"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Spinner, Badge, Container, Stack, VersionBadge, StatusBadge, PageHero, Toggle } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { Headphones, CheckCircle, Play, CalendarDays, Moon, Zap, Sparkles, Plus, Music, X, AlertCircle, Wand2, Mic, Clock, Eye, Music2, ListMusic } from 'lucide-react'
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

interface MixVariant {
  id: string
  name: string
  voice_volume: number
  bg_volume: number
  background_track: string | null
  icon: any
  color: string
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

interface Batch {
  id: string
  status: string
  variant_ids: string[]
  voice_id: string
  tracks_completed: number
  tracks_failed: number
  total_tracks_expected: number
  created_at: string
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

// Helper function to handle audio preview
function handlePreview(e: React.MouseEvent, trackUrl: string, trackId: string, currentPreviewingTrack: string | null, setPreviewingTrack: (id: string | null) => void, audioRef: React.RefObject<HTMLAudioElement | null>) {
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

export default function AudioGeneratePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [visionId, setVisionId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatingComboId, setGeneratingComboId] = useState<string | null>(null)
  const [voices, setVoices] = useState<Voice[]>([])
  const [existingVoiceSets, setExistingVoiceSets] = useState<ExistingVoiceSet[]>([])
  const [mixVariants, setMixVariants] = useState<MixVariant[]>([])
  const [vision, setVision] = useState<any>(null)
  const [activeBatches, setActiveBatches] = useState<Batch[]>([])
  
  // Voice Only Section
  const [showNewVoiceForm, setShowNewVoiceForm] = useState(false)
  const [selectedVoiceForNew, setSelectedVoiceForNew] = useState<string>('alloy')
  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [previewProgress, setPreviewProgress] = useState<number>(0)
  const previewAudioRef = React.useRef<HTMLAudioElement | null>(null)
  
  // New Flexible Mixing Section
  const [selectedBaseVoice, setSelectedBaseVoice] = useState<string>('')
  const [backgroundTracks, setBackgroundTracks] = useState<BackgroundTrack[]>([])
  const [mixRatios, setMixRatios] = useState<MixRatio[]>([])
  const [selectedBackgroundTrack, setSelectedBackgroundTrack] = useState<string>('')
  const [selectedMixRatio, setSelectedMixRatio] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  // Binaural Enhancement (Optional 3rd track)
  const [binauralTracks, setBinauralTracks] = useState<BackgroundTrack[]>([])
  const [selectedBinauralTrack, setSelectedBinauralTrack] = useState<string>('')
  const [binauralVolume, setBinauralVolume] = useState<number>(0) // Default 0% volume (off)
  const [binauralFilter, setBinauralFilter] = useState<string>('all') // all, pure, theta, alpha, delta, beta
  
  // Audio preview
  const [previewingTrack, setPreviewingTrack] = useState<string | null>(null)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  
  // Recommended Combos
  const [recommendedCombos, setRecommendedCombos] = useState<any[]>([])
  const [mixMode, setMixMode] = useState<'recommended' | 'custom'>('recommended')
  
  // Old variant system (kept for backwards compatibility)
  const [selectedMixVariants, setSelectedMixVariants] = useState<string[]>([])
  
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

  // Poll for batch updates if there are active batches
  useEffect(() => {
    if (!visionId || activeBatches.length === 0) return
    
    const hasActiveBatches = activeBatches.some(b => ['pending', 'processing'].includes(b.status))
    if (!hasActiveBatches) return

    const interval = setInterval(async () => {
      const supabase = createClient()
      const { data: batches } = await supabase
        .from('audio_generation_batches')
        .select('*')
        .eq('vision_id', visionId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (batches) {
        setActiveBatches(batches)
      }
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(interval)
  }, [visionId, activeBatches])

  async function loadData() {
    const supabase = createClient()

    // Load vision
    const { data: v } = await supabase
      .from('vision_versions')
      .select('*')
      .eq('id', visionId)
      .single()
    
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

    // Load OpenAI voices
    try {
      const resp = await fetch('/api/audio/voices', { cache: 'no-store' })
      const data = await resp.json()
      const voices = (data.voices || []).map((v: any) => ({ 
        id: v.id, 
        name: `${v.brandName || v.name} (${v.gender})`
      }))
      
      setVoices(voices)
    } catch {}

    // Load existing voice-only (standard) sets
    const { data: sets } = await supabase
      .from('audio_sets')
      .select(`
        id,
        voice_id,
        created_at,
        audio_tracks(count)
      `)
      .eq('vision_id', visionId)
      .eq('variant', 'standard')
      .order('created_at', { ascending: false })

    const voiceSets: ExistingVoiceSet[] = (sets || []).map((set: any) => ({
      id: set.id,
      voice_id: set.voice_id,
      voice_name: voices.find(v => v.id === set.voice_id)?.name || set.voice_id,
      created_at: set.created_at,
      track_count: set.audio_tracks?.[0]?.count || 0
    }))

    setExistingVoiceSets(voiceSets)
    
    // Auto-select first voice for mixing if available
    if (voiceSets.length > 0 && !selectedBaseVoice) {
      setSelectedBaseVoice(voiceSets[0].voice_id)
    }

    // Load background tracks (excluding binaural/solfeggio)
    const { data: tracks } = await supabase
      .from('audio_background_tracks')
      .select('*')
      .eq('is_active', true)
      .not('category', 'in', '(binaural,solfeggio)')
      .order('sort_order')
    
    if (tracks) {
      setBackgroundTracks(tracks)
      // Auto-select first track
      if (tracks.length > 0 && !selectedBackgroundTrack) {
        setSelectedBackgroundTrack(tracks[0].id)
      }
    }
    
    // Load binaural tracks (optional enhancement layer)
    const { data: binauralData } = await supabase
      .from('audio_background_tracks')
      .select('*')
      .eq('is_active', true)
      .in('category', ['binaural', 'solfeggio'])
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
      // Auto-select balanced mix (50/50)
      const balanced = ratios.find(r => r.voice_volume === 50)
      if (balanced && !selectedMixRatio) {
        setSelectedMixRatio(balanced.id)
      }
    }

    // Load recommended combos (available to all users)
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

    // Load old mix variants for backwards compatibility
    const { data: variants } = await supabase
      .from('audio_variants')
      .select('*')
      .neq('id', 'standard')
      .order('id')
    
    if (variants) {
      const mixVars: MixVariant[] = variants.map((v: any) => ({
        id: v.id,
        name: v.name,
        voice_volume: v.voice_volume,
        bg_volume: v.bg_volume,
        background_track: v.background_track,
        icon: v.id === 'sleep' ? Moon : v.id === 'energy' ? Zap : Sparkles,
        color: v.id === 'sleep' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
               v.id === 'energy' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
               'bg-purple-500/20 text-purple-400 border-purple-500/30'
      }))
      setMixVariants(mixVars)
    }

    // Load active/recent generation batches
    const { data: batches } = await supabase
      .from('audio_generation_batches')
      .select('*')
      .eq('vision_id', visionId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (batches) {
      setActiveBatches(batches)
    }

    setLoading(false)
  }

  async function applyRecommendedCombo(combo: any) {
    if (!selectedBaseVoice) {
      alert('Please select a base voice first (Step 1)')
      return
    }
    
    // Verify that voice-only tracks exist for this voice
    const selectedVoiceSet = existingVoiceSets.find(set => set.voice_id === selectedBaseVoice)
    if (!selectedVoiceSet || selectedVoiceSet.track_count === 0) {
      alert('⚠️ No voice-only tracks found. Please generate voice-only tracks first (Step 1) before creating mixes.')
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

      // Get vision data for sections
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

      const categoryKeys = getVisionCategoryKeys().filter(k => k !== 'forward' && k !== 'conclusion')
      const sections = [
        { key: 'forward', text: vv.forward || '' },
        ...categoryKeys.map(key => ({ key, text: vv[key] || '' })),
        { key: 'conclusion', text: vv.conclusion || '' }
      ].filter(s => s.text.trim().length > 0)

      const sectionsPayload = sections.map(s => ({
        sectionKey: s.key,
        text: s.text
      }))

      // Use combo values directly
      const selectedTrack = combo.background_track
      const selectedRatio = combo.mix_ratio
      const selectedBinaural = combo.binaural_track

      // Create batch with custom mix metadata
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
            // Optional binaural enhancement
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

      console.log('✅ Batch created:', batch.id)

      // Trigger custom mix generation API
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

      // Redirect to queue page immediately
      console.log('Redirecting to queue page:', `/life-vision/${visionId}/audio/queue/${batch.id}`)
      router.push(`/life-vision/${visionId}/audio/queue/${batch.id}`)
      
    } catch (err) {
      console.error('Error generating custom mix:', err)
      alert('Failed to generate mix. Please try again.')
      setGeneratingComboId(null)
    }
  }

  async function handleGenerateVoiceOnly() {
    setGenerating(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('You must be logged in to generate audio')
        setGenerating(false)
        return
      }

      // Get vision data for sections
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

      const categoryKeys = getVisionCategoryKeys().filter(k => k !== 'forward' && k !== 'conclusion')
      const sections = [
        { key: 'forward', text: vv.forward || '' },
        ...categoryKeys.map(key => ({ key, text: vv[key] || '' })),
        { key: 'conclusion', text: vv.conclusion || '' }
      ].filter(s => s.text.trim().length > 0)

      const sectionsPayload = sections.map(s => ({
        sectionKey: s.key,
        text: s.text
      }))

      // Create batch
      const { data: batch, error: batchError } = await supabase
        .from('audio_generation_batches')
        .insert({
          user_id: user.id,
          vision_id: visionId,
          variant_ids: ['standard'],
          voice_id: selectedVoiceForNew,
          sections_requested: sectionsPayload,
          total_tracks_expected: sectionsPayload.length,
          status: 'pending'
        })
        .select()
        .single()

      if (batchError || !batch) {
        console.error('Failed to create batch:', batchError)
        alert('Failed to create generation batch. Please try again.')
        setGenerating(false)
        return
      }

      // Start generation (fire and forget - it runs in background)
      console.log('🎤 [FRONTEND] Starting generation with voice:', selectedVoiceForNew)
      console.log('🎤 [FRONTEND] Sending payload:', { visionId, voice: selectedVoiceForNew, variant: 'standard' })
      fetch('/api/audio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visionId,
          sections: sectionsPayload,
          voice: selectedVoiceForNew,
          variant: 'standard',
          batchId: batch.id
        })
      }).then(res => {
        if (!res.ok) {
          console.error('Generation API returned error:', res.status)
        }
      }).catch(err => {
        console.error('Generation API error:', err)
      })
      
      // Redirect to queue page immediately
      console.log('Redirecting to queue page:', `/life-vision/${visionId}/audio/queue/${batch.id}`)
      router.push(`/life-vision/${visionId}/audio/queue/${batch.id}`)
    } catch (error) {
      console.error('Generation error:', error)
      alert('An error occurred during generation. Please try again.')
      setGenerating(false)
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
    
    // Verify that voice-only tracks exist for this voice
    const selectedVoiceSet = existingVoiceSets.find(set => set.voice_id === selectedBaseVoice)
    if (!selectedVoiceSet || selectedVoiceSet.track_count === 0) {
      alert('⚠️ No voice-only tracks found for this voice. Please generate voice-only tracks first (Step 1) before creating mixes.')
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

      // Get vision data for sections
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

      const categoryKeys = getVisionCategoryKeys().filter(k => k !== 'forward' && k !== 'conclusion')
      const sections = [
        { key: 'forward', text: vv.forward || '' },
        ...categoryKeys.map(key => ({ key, text: vv[key] || '' })),
        { key: 'conclusion', text: vv.conclusion || '' }
      ].filter(s => s.text.trim().length > 0)

      const sectionsPayload = sections.map(s => ({
        sectionKey: s.key,
        text: s.text
      }))

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
          variant_ids: ['custom'],
          voice_id: selectedBaseVoice,
          sections_requested: sectionsPayload,
          total_tracks_expected: sectionsPayload.length,
          status: 'pending',
          metadata: {
            custom_mix: true,
            background_track_id: selectedBackgroundTrack,
            background_track_url: selectedTrack.file_url,
            mix_ratio_id: selectedMixRatio,
            voice_volume: selectedRatio.voice_volume,
            bg_volume: selectedRatio.bg_volume,
            // Optional binaural enhancement
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

      // Start generation with custom mix parameters
      console.log('Starting custom mix generation:', {
        voice: selectedBaseVoice,
        track: selectedTrack.display_name,
        ratio: selectedRatio.name
      })

      // Prepare request payload
      const generatePayload: any = {
        visionId,
        sections: sectionsPayload,
        voice: selectedBaseVoice,
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
      console.log('Redirecting to queue page:', `/life-vision/${visionId}/audio/queue/${batch.id}`)
      router.push(`/life-vision/${visionId}/audio/queue/${batch.id}`)
    } catch (error) {
      console.error('Generation error:', error)
      alert('An error occurred during generation. Please try again.')
      setGenerating(false)
    }
  }

  async function handleGenerateMixes() {
    if (selectedMixVariants.length === 0) {
      alert('Please select at least one mix variant')
      return
    }

    if (!selectedBaseVoice) {
      alert('Please select a base voice')
      return
    }
    
    // Verify that voice-only tracks exist for this voice
    const selectedVoiceSet = existingVoiceSets.find(set => set.voice_id === selectedBaseVoice)
    if (!selectedVoiceSet || selectedVoiceSet.track_count === 0) {
      alert('⚠️ No voice-only tracks found for this voice. Please generate voice-only tracks first (Step 1) before creating mixes.')
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

      // Get vision data for sections
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

      const categoryKeys = getVisionCategoryKeys().filter(k => k !== 'forward' && k !== 'conclusion')
      const sections = [
        { key: 'forward', text: vv.forward || '' },
        ...categoryKeys.map(key => ({ key, text: vv[key] || '' })),
        { key: 'conclusion', text: vv.conclusion || '' }
      ].filter(s => s.text.trim().length > 0)

      const sectionsPayload = sections.map(s => ({
        sectionKey: s.key,
        text: s.text
      }))

      // Create batch
      const { data: batch, error: batchError } = await supabase
        .from('audio_generation_batches')
        .insert({
          user_id: user.id,
          vision_id: visionId,
          variant_ids: selectedMixVariants,
          voice_id: selectedBaseVoice,
          sections_requested: sectionsPayload,
          total_tracks_expected: sectionsPayload.length * selectedMixVariants.length,
          status: 'pending'
        })
        .select()
        .single()

      if (batchError || !batch) {
        console.error('Failed to create batch:', batchError)
        alert('Failed to create generation batch. Please try again.')
        setGenerating(false)
        return
      }

      // Start generation for each variant
      // Each variant will reuse the existing voice-only track and just trigger mixing
      console.log('Starting mix generation with base voice:', selectedBaseVoice)
      for (const variantId of selectedMixVariants) {
        fetch('/api/audio/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visionId,
            sections: sectionsPayload,
            voice: selectedBaseVoice,
            variant: variantId,
            batchId: batch.id
          })
        }).then(res => {
          if (!res.ok) {
            console.error(`Generation API error for variant ${variantId}:`, res.status)
          }
        }).catch(err => {
          console.error(`Generation API error for variant ${variantId}:`, err)
        })
      }

      // Redirect to queue page immediately
      console.log('Redirecting to queue page:', `/life-vision/${visionId}/audio/queue/${batch.id}`)
      router.push(`/life-vision/${visionId}/audio/queue/${batch.id}`)
    } catch (error) {
      console.error('Generation error:', error)
      alert('An error occurred during generation. Please try again.')
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Hero Header */}
        <PageHero
          eyebrow={vision?.household_id ? "THE LIFE WE CHOOSE" : "THE LIFE I CHOOSE"}
          title="Generate Audio Sets"
          subtitle="Create voice-only tracks, then add background music mixes"
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

              {/* Action Buttons */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 max-w-5xl mx-auto">
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href={`/life-vision/${visionId}/audio/sets`} className="flex items-center justify-center gap-2">
                    <ListMusic className="w-4 h-4" />
                    <span>Audio Sets</span>
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href={`/life-vision/${visionId}/audio/record`} className="flex items-center justify-center gap-2">
                    <Mic className="w-4 h-4" />
                    <span>Record</span>
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
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href={`/life-vision/${visionId}`} className="flex items-center justify-center gap-2">
                    <Eye className="w-4 h-4" />
                    <span>Vision</span>
                  </Link>
                </Button>
              </div>
            </>
          )}
        </PageHero>

        {/* Combined Generation Card */}
        <Card variant="glass" className="mb-6">
          {/* SECTION 1: Select Base Voice */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-[#39FF14]/20 rounded-full flex items-center justify-center mb-3">
              <span className="text-3xl font-bold text-[#39FF14]">1</span>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-white">Select Base Voice</h2>
            <p className="text-sm text-neutral-400">Choose a voice recording to use. You must have a base voice to generate background mixes with.</p>
          </div>

          {/* Existing Voice Sets */}
          {existingVoiceSets.length > 0 ? (
            <>
              <p className="text-sm text-neutral-400 mb-3 text-center">Select a voice to use for mixing:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                {existingVoiceSets.map((set) => (
                  <Card 
                    key={set.id} 
                    variant="default" 
                    hover
                    className={`p-4 cursor-pointer transition-all ${
                      selectedBaseVoice === set.voice_id
                        ? 'border-primary-500 bg-primary-500/10'
                        : ''
                    }`}
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setSelectedBaseVoice(set.voice_id)
                    }}
                  >
                    <div>
                      <p className="text-white font-medium">{voices.find(v => v.id === set.voice_id)?.name || set.voice_id}</p>
                      <p className="text-xs text-neutral-400">{set.track_count} tracks • {new Date(set.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 mb-6">
              <p className="text-neutral-400">No voice recordings yet. Generate your first set below.</p>
            </div>
          )}

          {/* Action Buttons */}
          {!showNewVoiceForm ? (
            <div className="space-y-3 flex justify-center">
              <Button 
                variant="primary" 
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowNewVoiceForm(true)
                }}
                className="w-full md:w-auto"
              >
                <div className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center mr-2">
                  <Plus className="w-4 h-4" />
                </div>
                Generate New Voice Only Set
              </Button>
            </div>
          ) : (
            <Card variant="glass" className="p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Select Voice</h3>
              
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsVoiceDropdownOpen(!isVoiceDropdownOpen)
                    }}
                    className="w-full pl-6 pr-12 py-3 rounded-full bg-[#1F1F1F] text-white text-sm border-2 border-[#333] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer text-left"
                  >
                    {voices.find(v => v.id === selectedVoiceForNew)?.name || 'Select a voice'}
                  </button>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isVoiceDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  
                  {isVoiceDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setIsVoiceDropdownOpen(false)
                        }}
                      />
                      <div className="absolute z-20 w-full top-full mt-1 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-96 overflow-y-auto">
                        {/* OpenAI Voices */}
                        <div className="px-3 py-1 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Available Voices</div>
                        {voices.map((v: any) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setSelectedVoiceForNew(v.id)
                              setIsVoiceDropdownOpen(false)
                            }}
                            className={`w-full px-6 py-2 text-left text-sm transition-colors ${
                              selectedVoiceForNew === v.id 
                                ? 'bg-primary-500/20 text-primary-500 font-semibold' 
                                : 'text-white hover:bg-[#333]'
                            }`}
                          >
                            {v.name}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <Button 
                  variant={isPreviewing ? "primary" : "ghost"}
                  onClick={async (e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    
                    if (isPreviewing && previewAudioRef.current) {
                      previewAudioRef.current.pause()
                      previewAudioRef.current.currentTime = 0
                      setIsPreviewing(false)
                      setPreviewProgress(0)
                      return
                    }

                    try {
                      if (previewAudioRef.current) {
                        previewAudioRef.current.pause()
                      }
                      
                      let audioUrl: string
                      
                      // Check if it's a cloned voice with direct preview URL
                      const selectedVoice = voices.find(v => v.id === selectedVoiceForNew)
                      if (selectedVoice?.previewUrl) {
                        // Use the cloned voice's sample audio
                        audioUrl = selectedVoice.previewUrl
                      } else {
                        // Fetch preview from API (OpenAI/ElevenLabs pre-made)
                        const res = await fetch(`/api/audio/voices?preview=${selectedVoiceForNew}`, { cache: 'no-store' })
                        const data = await res.json()
                        audioUrl = data.url
                      }
                      
                      const audio = new Audio(audioUrl)
                      previewAudioRef.current = audio
                      setIsPreviewing(true)
                      setPreviewProgress(0)
                      
                      const interval = setInterval(() => {
                        if (audio.paused || audio.ended) {
                          clearInterval(interval)
                          setPreviewProgress(0)
                          setIsPreviewing(false)
                        } else {
                          setPreviewProgress((audio.currentTime / audio.duration) * 100)
                        }
                      }, 100)

                      audio.play()
                    } catch (err) {
                      console.error('Preview failed:', err)
                      setIsPreviewing(false)
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  {isPreviewing ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="4" width="4" height="16" rx="1" />
                        <rect x="14" y="4" width="4" height="16" rx="1" />
                      </svg>
                      <span>Stop Preview</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Preview Voice</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Preview Progress Bar */}
              {isPreviewing && previewProgress > 0 && (
                <div className="mt-3">
                  <div className="w-full bg-neutral-800 rounded-full h-1.5">
                    <div 
                      className="bg-primary-500 h-1.5 rounded-full transition-all duration-200"
                      style={{ width: `${previewProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-3 mt-4">
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (previewAudioRef.current) {
                        previewAudioRef.current.pause()
                        previewAudioRef.current.currentTime = 0
                      }
                      setIsPreviewing(false)
                      setPreviewProgress(0)
                      setShowNewVoiceForm(false)
                      setGenerating(false)
                    }}
                    disabled={generating}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleGenerateVoiceOnly()
                    }}
                    disabled={generating || !selectedVoiceForNew}
                    className="flex-1"
                  >
                    {generating ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Generating...
                      </>
                    ) : (
                      'Generate Voice Only'
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Divider */}
          <div className="my-12 border-t border-neutral-700/50"></div>

          {/* SECTION 2: Mix Mode Toggle */}
          {existingVoiceSets.length > 0 && (
            <>
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-3">
                  <span className="text-3xl font-bold text-purple-400">2</span>
                </div>
                <h2 className="text-xl md:text-2xl font-semibold text-white">Create Custom Mix</h2>
                <p className="text-sm text-neutral-400 mb-6">Choose how you want to create your mix.</p>
                
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
                  <div id="recommended-combos-section" className="flex flex-col items-center text-center mb-6">
                    <h3 className="text-lg md:text-xl font-semibold text-white mb-2">✨ Quick Presets</h3>
                    <p className="text-sm text-neutral-400 max-w-2xl">
                      Curated mixes designed for optimal results. Click a combo to auto-fill settings and generate.
                    </p>
                  </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {recommendedCombos.map((combo) => (
                  <Card
                    key={combo.id}
                    variant="elevated"
                    hover
                    className="p-6 transition-all"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Music2 className="w-5 h-5 text-primary-500" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="text-lg font-semibold text-white mb-1">{combo.name}</h3>
                        {combo.description && (
                          <p className="text-xs text-neutral-400">{combo.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-left">
                      {/* Background Track */}
                      <div className="flex items-center gap-2 text-sm">
                        <Music className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                        <span className="text-neutral-400">Background:</span>
                        <span className="text-white font-medium">
                          {combo.background_track?.display_name || 'Unknown'}
                        </span>
                      </div>

                      {/* Mix Ratio */}
                      <div className="flex items-center gap-2 text-sm">
                        <ListMusic className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                        <span className="text-neutral-400">Ratio:</span>
                        <span className="text-primary-400 font-semibold">
                          {combo.mix_ratio?.voice_volume}% / {combo.mix_ratio?.bg_volume}%
                          {combo.binaural_volume > 0 && ` / ${combo.binaural_volume}%`}
                        </span>
                      </div>

                      {/* Binaural (if present) */}
                      {combo.binaural_track_id && (
                        <div className="flex items-center gap-2 text-sm">
                          <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
                          <span className="text-neutral-400">Binaural:</span>
                          <span className="text-purple-400 font-medium">
                            {combo.binaural_track?.display_name || 'Unknown'}
                          </span>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full mt-4"
                      disabled={generatingComboId !== null}
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
                ))}
              </div>

                </>
              )}

              {/* CUSTOM BUILD MODE */}
              {mixMode === 'custom' && (
                <>

          <div className={existingVoiceSets.length === 0 ? 'opacity-50 pointer-events-none' : ''}>
            {existingVoiceSets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-neutral-400">Generate a voice-only set first to unlock mixing</p>
              </div>
            ) : (
            <>
              {/* Background Track Selection */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-3">1. Choose Background Track</h3>
                
                {/* Category Filter */}
                <div className="flex gap-2 mb-4 flex-wrap">
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

                {/* Track Grid */}
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
                          className={`cursor-pointer transition-all p-4 ${
                            isSelected
                              ? 'border-primary-500 bg-primary-500/10'
                              : ''
                          }`}
                          onClick={(e: React.MouseEvent) => {
                            e.preventDefault()
                            e.stopPropagation()
                            // Toggle selection
                            setSelectedBackgroundTrack(isSelected ? '' : track.id)
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${
                              track.category === 'nature' ? 'bg-green-500/20 text-green-400' :
                              track.category === 'ambient' ? 'bg-purple-500/20 text-purple-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              <Music2 className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium text-sm">{track.display_name}</p>
                              {track.description && (
                                <p className="text-xs text-neutral-400 mt-1 line-clamp-1">{track.description}</p>
                              )}
                              <Badge variant="neutral" className="mt-2 text-xs">
                                {track.category}
                              </Badge>
                            </div>
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={(e) => handlePreview(e, track.file_url, track.id, previewingTrack, setPreviewingTrack, audioRef)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isPreviewing 
                                    ? 'bg-primary-500 text-white' 
                                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                                }`}
                                title={isPreviewing ? 'Stop preview' : 'Play preview'}
                              >
                                {isPreviewing ? <X className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                              </button>
                              {isSelected && (
                                <CheckCircle className="w-4 h-4 text-primary-500 mx-auto" />
                              )}
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                </div>
              </div>

              {/* Mix Ratio Selection */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-3">2. Choose Mix Ratio</h3>
                <p className="text-sm text-neutral-400 mb-3">
                  {selectedBinauralTrack && binauralVolume > 0
                    ? `Voice + Background ratio (Binaural will be added at ${binauralVolume}%)`
                    : 'Voice + Background balance'}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {mixRatios.map((ratio) => {
                    const isSelected = selectedMixRatio === ratio.id
                    const adjusted = (selectedBinauralTrack && binauralVolume > 0)
                      ? calculateAdjustedVolumes(ratio.voice_volume, ratio.bg_volume, binauralVolume)
                      : { voice: ratio.voice_volume, bg: ratio.bg_volume, binaural: 0 }
                    
                    return (
                      <Card
                        key={ratio.id}
                        variant="default"
                        hover
                        className={`cursor-pointer transition-all p-4 ${
                          isSelected
                            ? 'border-primary-500 bg-primary-500/10'
                            : ''
                        }`}
                        onClick={(e: React.MouseEvent) => {
                          e.preventDefault()
                          e.stopPropagation()
                          // Toggle selection
                          setSelectedMixRatio(isSelected ? '' : ratio.id)
                        }}
                      >
                        <div className="text-center">
                          <p className="text-white font-medium text-sm">{ratio.name}</p>
                          {(selectedBinauralTrack && binauralVolume > 0) ? (
                            <div className="text-xs text-neutral-400 mt-1">
                              <div>Voice: {adjusted.voice}%</div>
                              <div>BG: {adjusted.bg}%</div>
                              <div className="text-purple-400">Binaural: {adjusted.binaural}%</div>
                            </div>
                          ) : (
                            <p className="text-xs text-neutral-400 mt-1">
                              {ratio.voice_volume}/{ratio.bg_volume}
                            </p>
                          )}
                          {isSelected && (
                            <CheckCircle className="w-4 h-4 text-primary-500 mx-auto mt-2" />
                          )}
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>

              {/* Optional Binaural Enhancement */}
              {binauralTracks.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-white">3. Binaural Enhancement (Optional)</h3>
                    <Badge variant="info">Brainwave</Badge>
                  </div>
                  <p className="text-sm text-neutral-400 mb-4">
                    Add healing frequencies or brainwave entrainment to your mix.
                  </p>
                  
                  {/* Filter Buttons */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Button
                      size="sm"
                      variant={binauralFilter === 'all' ? 'primary' : 'secondary'}
                      onClick={() => setBinauralFilter('all')}
                    >
                      All
                    </Button>
                    <Button
                      size="sm"
                      variant={binauralFilter === 'pure' ? 'primary' : 'secondary'}
                      onClick={() => setBinauralFilter('pure')}
                    >
                      Pure Solfeggio
                    </Button>
                    <Button
                      size="sm"
                      variant={binauralFilter === 'delta' ? 'primary' : 'secondary'}
                      onClick={() => setBinauralFilter('delta')}
                    >
                      Delta (Sleep)
                    </Button>
                    <Button
                      size="sm"
                      variant={binauralFilter === 'theta' ? 'primary' : 'secondary'}
                      onClick={() => setBinauralFilter('theta')}
                    >
                      Theta (Meditation)
                    </Button>
                    <Button
                      size="sm"
                      variant={binauralFilter === 'alpha' ? 'primary' : 'secondary'}
                      onClick={() => setBinauralFilter('alpha')}
                    >
                      Alpha (Focus)
                    </Button>
                    <Button
                      size="sm"
                      variant={binauralFilter === 'beta' ? 'primary' : 'secondary'}
                      onClick={() => setBinauralFilter('beta')}
                    >
                      Beta (Alert)
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                    {/* None option */}
                    <Card
                      variant="default"
                      hover
                      className={`cursor-pointer transition-all p-4 ${
                        !selectedBinauralTrack
                          ? 'border-primary-500 bg-primary-500/10'
                          : ''
                      }`}
                      onClick={(e: React.MouseEvent) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setSelectedBinauralTrack('')
                        setBinauralVolume(0)
                      }}
                    >
                      <div className="text-center">
                        <p className="text-white font-medium text-sm">None</p>
                        <p className="text-xs text-neutral-400 mt-1">No binaural</p>
                        {!selectedBinauralTrack && (
                          <CheckCircle className="w-4 h-4 text-primary-500 mx-auto mt-2" />
                        )}
                      </div>
                    </Card>
                    
                    {binauralTracks
                      .filter(track => {
                        if (!track.name) return false // Skip tracks without a name
                        if (binauralFilter === 'all') return true
                        if (binauralFilter === 'pure') return track.name.includes('-pure')
                        return track.name.includes(`-${binauralFilter}`)
                      })
                      .map((track) => {
                        const isSelected = selectedBinauralTrack === track.id
                        const isPreviewing = previewingTrack === track.id
                        return (
                          <Card
                            key={track.id}
                            variant="default"
                            hover
                            className={`cursor-pointer transition-all p-4 ${
                              isSelected
                                ? 'border-purple-500 bg-purple-500/10'
                                : ''
                            }`}
                            onClick={(e: React.MouseEvent) => {
                              e.preventDefault()
                              e.stopPropagation()
                              // Toggle selection
                              if (isSelected) {
                                setSelectedBinauralTrack('')
                                setBinauralVolume(0)
                              } else {
                                setSelectedBinauralTrack(track.id)
                                if (binauralVolume === 0) {
                                  setBinauralVolume(15) // Set to 15% when selecting
                                }
                              }
                            }}
                          >
                            <div className="flex flex-col gap-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-medium text-sm">{track.display_name}</p>
                                  {track.description && (
                                    <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{track.description}</p>
                                  )}
                                </div>
                                <button
                                  onClick={(e) => handlePreview(e, track.file_url, track.id, previewingTrack, setPreviewingTrack, audioRef)}
                                  className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                                    isPreviewing 
                                      ? 'bg-purple-500 text-white' 
                                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                                  }`}
                                  title={isPreviewing ? 'Stop preview' : 'Play preview'}
                                >
                                  {isPreviewing ? <X className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                </button>
                              </div>
                              {isSelected && (
                                <CheckCircle className="w-4 h-4 text-purple-500 mx-auto" />
                              )}
                            </div>
                          </Card>
                        )
                      })}
                  </div>
                  
                  {/* Volume slider for binaural */}
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
                </div>
              )}
              
              {/* Hidden audio element for preview */}
              <audio
                ref={audioRef}
                onEnded={() => setPreviewingTrack(null)}
                style={{ display: 'none' }}
              />

              {/* Mix Summary */}
              {selectedBackgroundTrack && selectedMixRatio && (
                <div className="mb-6">
                  <Card variant="glass" className="p-4">
                    <h4 className="text-base font-semibold text-white mb-4">Final Mix Preview</h4>
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
                  id="generate-custom-mix-button"
                  variant="primary" 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleGenerateCustomMix()
                  }}
                  disabled={generating || !selectedBackgroundTrack || !selectedMixRatio || !selectedBaseVoice}
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
                      Generate Custom Mix
                    </>
                  )}
                </Button>
              </div>
            </>
            )}
          </div>
                </>
              )}
            </>
          )}
        </Card>

      </Stack>
    </Container>
  )
}
