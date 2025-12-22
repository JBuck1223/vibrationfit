"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Spinner, Badge, Container, Stack, VersionBadge, StatusBadge, PageHero } from '@/lib/design-system/components'
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

export default function AudioGeneratePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [visionId, setVisionId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
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
  
  // Mixing Section
  const [selectedBaseVoice, setSelectedBaseVoice] = useState<string>('')
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

    // Load mix variants from database
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
                <Button variant="outline" size="sm" asChild className="w-full col-span-2 lg:col-span-1">
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
                    <span className="lg:hidden">Vision</span>
                    <span className="hidden lg:inline">View Vision</span>
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

          {/* SECTION 2: Select Mix Variants */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-3">
              <span className="text-3xl font-bold text-purple-400">2</span>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-white">Select Mix Variants</h2>
            <p className="text-sm text-neutral-400">Add background music to your voice recording.</p>
          </div>

          <div className={existingVoiceSets.length === 0 ? 'opacity-50 pointer-events-none' : ''}>
            {existingVoiceSets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-neutral-400">Generate a voice-only set first to unlock mixing</p>
              </div>
            ) : (
            <>
              {/* Mix Variants Selection */}
              <p className="text-sm text-neutral-400 mb-3 text-center">Choose which background mixes to create:</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {mixVariants.map((variant) => {
                  const Icon = variant.icon
                  const isSelected = selectedMixVariants.includes(variant.id)
                  
                  return (
                    <Card
                      key={variant.id}
                      variant="default"
                      hover
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-500/10'
                          : ''
                      }`}
                      onClick={(e: React.MouseEvent) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setSelectedMixVariants(prev =>
                          prev.includes(variant.id)
                            ? prev.filter(v => v !== variant.id)
                            : [...prev, variant.id]
                        )
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${variant.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{variant.name}</p>
                          <p className="text-xs text-neutral-400">
                            {variant.voice_volume}% voice • {variant.bg_volume}% background
                          </p>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>

              {/* Generate Button */}
              <div className="flex justify-center">
                <Button 
                  variant="primary" 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleGenerateMixes()
                  }}
                  disabled={generating || selectedMixVariants.length === 0 || !selectedBaseVoice}
                  className="w-full md:w-auto"
                >
                  {generating ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Generating Mixes...
                    </>
                  ) : (
                    <>
                      Generate {selectedMixVariants.length} Mix{selectedMixVariants.length !== 1 ? 'es' : ''}
                    </>
                  )}
                </Button>
              </div>
            </>
            )}
          </div>
        </Card>

      </Stack>
    </Container>
  )
}
