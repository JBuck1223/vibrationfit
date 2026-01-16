"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Spinner, Badge, Container, Stack, VersionBadge, StatusBadge, PageHero, TrackingMilestoneCard } from '@/lib/design-system/components'
import { PlaylistPlayer } from '@/lib/design-system'
import { createClient } from '@/lib/supabase/client'
import { Headphones, CheckCircle, Play, CalendarDays, Mic, Clock, Eye, ListMusic, Music, AudioLines, Disc3, Layers, X } from 'lucide-react'
import Link from 'next/link'
import { getVisionCategoryKeys, VISION_CATEGORIES } from '@/lib/design-system'
import { ChevronDown } from 'lucide-react'
import { SectionSelector } from '@/components/SectionSelector'
import { FormatSelector, OutputFormat } from '@/components/FormatSelector'

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
  name?: string
  section_keys?: string[]
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
  const [vision, setVision] = useState<any>(null)
  const [activeBatches, setActiveBatches] = useState<Batch[]>([])
  const [voiceTracksCount, setVoiceTracksCount] = useState(0)
  const [audioMixesCount, setAudioMixesCount] = useState(0)
  const [totalAudioSetsCount, setTotalAudioSetsCount] = useState(0)
  
  // Voice Only Generation Form
  const [selectedVoiceForNew, setSelectedVoiceForNew] = useState<string>('alloy')
  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [previewProgress, setPreviewProgress] = useState<number>(0)
  const previewAudioRef = React.useRef<HTMLAudioElement | null>(null)
  
  // Section Selection for Voice Generation
  const [generateAllSections, setGenerateAllSections] = useState(true)
  const [selectedVoiceSections, setSelectedVoiceSections] = useState<string[]>([])
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('both')
  const [isVoiceSetDropdownOpen, setIsVoiceSetDropdownOpen] = useState(false)
  const [selectedVoiceSetId, setSelectedVoiceSetId] = useState<string | null>(null)
  const [selectedSetTracks, setSelectedSetTracks] = useState<any[]>([])
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
    }, 3000)

    return () => clearInterval(interval)
  }, [visionId, activeBatches])

  async function loadSetTracks(setId: string) {
    setLoadingTracks(true)
    const supabase = createClient()
    
    const { data: tracks } = await supabase
      .from('audio_tracks')
      .select('*')
      .eq('audio_set_id', setId)
      .eq('status', 'completed')
      .not('audio_url', 'is', null)
      .order('section_key')
    
    if (tracks) {
      // Map database fields to PlaylistPlayer expected format
      const tracksWithKey = tracks.map(t => {
        // Get human-readable title from VISION_CATEGORIES
        const category = VISION_CATEGORIES.find(c => c.key === t.section_key)
        const title = category?.label || t.section_key
        
        return {
          id: t.id,
          title,
          artist: '', // No subtitle - matches audio/sets page
          duration: t.duration_seconds || 0,
          url: t.audio_url, // Map audio_url to url for PlaylistPlayer
          sectionKey: t.section_key,
        }
      })
      setSelectedSetTracks(tracksWithKey)
    }
    
    setLoadingTracks(false)
  }

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
    let voiceList: Voice[] = []
    try {
      const resp = await fetch('/api/audio/voices', { cache: 'no-store' })
      const data = await resp.json()
      voiceList = (data.voices || []).map((v: any) => ({ 
        id: v.id, 
        name: `${v.brandName || v.name} (${v.gender})`,
        previewUrl: v.previewUrl
      }))
      setVoices(voiceList)
    } catch {}

    // Load existing voice-only (standard) sets
    const { data: sets, error: setsError } = await supabase
      .from('audio_sets')
      .select(`
        id,
        voice_id,
        name,
        created_at,
        audio_tracks(section_key)
      `)
      .eq('vision_id', visionId)
      .eq('variant', 'standard')
      .order('created_at', { ascending: false })

    const voiceSets: ExistingVoiceSet[] = (sets || []).map((set: any) => {
      const sectionKeys = set.audio_tracks?.map((t: any) => t.section_key).filter(Boolean) || []
      return {
        id: set.id,
        voice_id: set.voice_id,
        voice_name: voiceList.find(v => v.id === set.voice_id)?.name || set.voice_id,
        created_at: set.created_at,
        track_count: set.audio_tracks?.length || 0,
        name: set.name,
        section_keys: sectionKeys
      }
    })

    setExistingVoiceSets(voiceSets)

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

    // Count voice-only tracks (standard variant)
    const { count: voiceCount } = await supabase
      .from('audio_sets')
      .select('*', { count: 'exact', head: true })
      .eq('vision_id', visionId)
      .eq('variant', 'standard')
    setVoiceTracksCount(voiceCount || 0)

    // Count audio mixes (mixed variant)
    const { count: mixCount } = await supabase
      .from('audio_sets')
      .select('*', { count: 'exact', head: true })
      .eq('vision_id', visionId)
      .eq('variant', 'mixed')
    setAudioMixesCount(mixCount || 0)

    // Count all audio sets
    const { count: totalCount } = await supabase
      .from('audio_sets')
      .select('*', { count: 'exact', head: true })
      .eq('vision_id', visionId)
    setTotalAudioSetsCount(totalCount || 0)

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

      // Build sections based on user selection
      let sectionsToGenerate: { key: string; text: string }[] = []
      
      if (generateAllSections) {
        // All 14 sections
        const categoryKeys = getVisionCategoryKeys().filter(k => k !== 'forward' && k !== 'conclusion')
        sectionsToGenerate = [
          { key: 'forward', text: vv.forward || '' },
          ...categoryKeys.map(key => ({ key, text: vv[key] || '' })),
          { key: 'conclusion', text: vv.conclusion || '' }
        ]
      } else {
        // Only selected sections (maintain order from VISION_CATEGORIES)
        const orderedKeys = VISION_CATEGORIES.map(c => c.key) as string[]
        const sortedSelectedSections = [...selectedVoiceSections].sort(
          (a, b) => orderedKeys.indexOf(a) - orderedKeys.indexOf(b)
        )
        sectionsToGenerate = sortedSelectedSections.map(key => ({
          key,
          text: vv[key] || ''
        }))
      }
      
      const sections = sectionsToGenerate.filter(s => s.text.trim().length > 0)
      
      if (sections.length === 0) {
        alert('No content found for the selected sections. Please ensure your vision has content.')
        setGenerating(false)
        return
      }

      const sectionsPayload = sections.map(s => ({
        sectionKey: s.key,
        text: s.text
      }))
      
      // Build descriptive set name based on selection
      let audioSetName = ''
      if (!generateAllSections && sections.length < 14) {
        if (sections.length === 1) {
          const cat = VISION_CATEGORIES.find(c => c.key === sections[0].key)
          audioSetName = `${cat?.label || sections[0].key} Focus`
        } else if (sections.length <= 3) {
          const labels = sections.map(s => {
            const cat = VISION_CATEGORIES.find(c => c.key === s.key)
            return cat?.label || s.key
          })
          audioSetName = `${labels.join(' + ')} Focus`
        } else {
          audioSetName = `Custom ${sections.length} Sections`
        }
      }

      // Create batch with metadata
      const { data: batch, error: batchError } = await supabase
        .from('audio_generation_batches')
        .insert({
          user_id: user.id,
          vision_id: visionId,
          variant_ids: ['standard'],
          voice_id: selectedVoiceForNew,
          sections_requested: sectionsPayload,
          total_tracks_expected: sectionsPayload.length,
          status: 'pending',
          metadata: {
            output_format: outputFormat,
            generate_all_sections: generateAllSections,
            selected_sections: generateAllSections ? null : selectedVoiceSections,
            audio_set_name: audioSetName || null
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

      // Start generation (fire and forget)
      console.log('Starting generation with voice:', selectedVoiceForNew)
      fetch('/api/audio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visionId,
          sections: sectionsPayload,
          voice: selectedVoiceForNew,
          variant: 'standard',
          batchId: batch.id,
          audioSetName: audioSetName || undefined
        })
      }).then(res => {
        if (!res.ok) {
          console.error('Generation API returned error:', res.status)
        }
      }).catch(err => {
        console.error('Generation API error:', err)
      })
      
      // Redirect to queue page
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

  return (
    <Container size="xl">
      <Stack gap="lg" className="overflow-visible">
        {/* Hero Header */}
        <PageHero
          eyebrow={vision?.household_id ? "THE LIFE WE CHOOSE" : "THE LIFE I CHOOSE"}
          title="Generate Voice Tracks"
          subtitle="Create voice-only recordings of your vision"
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
                  <Link href={`/life-vision/${visionId}/audio/mix`} className="flex items-center justify-center gap-2">
                    <Music className="w-4 h-4" />
                    <span>Create Mix</span>
                  </Link>
                </Button>
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
                <Button variant="outline" size="sm" asChild className="w-full col-span-2 lg:col-span-1">
                  <Link href={`/life-vision/${visionId}`} className="flex items-center justify-center gap-2">
                    <Eye className="w-4 h-4" />
                    <span>Vision</span>
                  </Link>
                </Button>
              </div>
            </>
          )}
        </PageHero>

        {/* Milestone Tracking Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <TrackingMilestoneCard
            label="Voice Tracks Generated"
            value={voiceTracksCount}
            theme="primary"
          />

          <TrackingMilestoneCard
            label="Audio Mixes Generated"
            value={audioMixesCount}
            theme="secondary"
          />

          <TrackingMilestoneCard
            label="Audio Sets"
            value={totalAudioSetsCount}
            theme="accent"
          />
        </div>

        {/* Generate New Voice Set */}
        <Card variant="glass" className="p-4 md:p-6">
          <div className="space-y-6">
              {/* Voice Selection */}
              <div className="py-4">
                <div className="flex flex-col items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center mb-2">
                    <span className="text-primary-500 font-bold text-2xl">1</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-white">Select Voice</h3>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <button
                      type="button"
                      onClick={() => setIsVoiceDropdownOpen(!isVoiceDropdownOpen)}
                      className="w-full pl-6 pr-12 py-3 rounded-full bg-[#1F1F1F] text-white text-sm border-2 border-[#333] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer text-left"
                    >
                      {voices.find(v => v.id === selectedVoiceForNew)?.name || selectedVoiceForNew}
                    </button>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isVoiceDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {isVoiceDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setIsVoiceDropdownOpen(false)}
                        />
                        <div className="absolute z-20 w-full mt-2 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                          {voices.map((voice) => (
                            <button
                              key={voice.id}
                              onClick={() => {
                                setSelectedVoiceForNew(voice.id)
                                setIsVoiceDropdownOpen(false)
                                if (previewAudioRef.current) {
                                  previewAudioRef.current.pause()
                                  previewAudioRef.current.currentTime = 0
                                }
                                setIsPreviewing(false)
                                setPreviewProgress(0)
                              }}
                              className={`w-full px-4 py-3 text-left hover:bg-[#2A2A2A] transition-colors border-b border-[#333] last:border-b-0 ${
                                selectedVoiceForNew === voice.id ? 'bg-primary-500/10' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-white font-medium">{voice.name}</span>
                                {selectedVoiceForNew === voice.id && (
                                  <CheckCircle className="w-5 h-5 text-primary-500" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  
                  <Button 
                    variant="primary"
                    onClick={async () => {
                      if (!selectedVoiceForNew) return
                      
                      const selectedVoice = voices.find(v => v.id === selectedVoiceForNew)
                      if (!selectedVoice?.previewUrl) return

                      if (isPreviewing) {
                        if (previewAudioRef.current) {
                          previewAudioRef.current.pause()
                          previewAudioRef.current.currentTime = 0
                        }
                        setIsPreviewing(false)
                        setPreviewProgress(0)
                      } else {
                        setIsPreviewing(true)
                        if (!previewAudioRef.current) {
                          previewAudioRef.current = new Audio(selectedVoice.previewUrl)
                        } else {
                          previewAudioRef.current.src = selectedVoice.previewUrl
                        }
                        
                        previewAudioRef.current.addEventListener('timeupdate', () => {
                          if (previewAudioRef.current) {
                            const progress = (previewAudioRef.current.currentTime / previewAudioRef.current.duration) * 100
                            setPreviewProgress(progress)
                          }
                        })
                        
                        previewAudioRef.current.addEventListener('ended', () => {
                          setIsPreviewing(false)
                          setPreviewProgress(0)
                        })
                        
                        await previewAudioRef.current.play()
                      }
                    }}
                    disabled={!selectedVoiceForNew || !voices.find(v => v.id === selectedVoiceForNew)?.previewUrl}
                    className="relative group"
                  >
                    <div className="relative flex items-center">
                      <div className="relative w-5 h-5 mr-2">
                        {/* Circular progress indicator */}
                        {isPreviewing && (
                          <svg className="absolute inset-0 w-5 h-5 -rotate-90 pointer-events-none" viewBox="0 0 20 20">
                            {/* Background track */}
                            <circle
                              cx="10"
                              cy="10"
                              r="8"
                              fill="none"
                              stroke="rgba(0,0,0,0.2)"
                              strokeWidth="2"
                              className="group-hover:stroke-[rgba(57,255,20,0.3)] transition-all duration-200"
                            />
                            {/* Progress */}
                            <circle
                              cx="10"
                              cy="10"
                              r="8"
                              fill="none"
                              stroke="black"
                              strokeWidth="2"
                              strokeDasharray="50.27"
                              strokeDashoffset={50.27 - (50.27 * (isNaN(previewProgress) ? 0 : previewProgress) / 100)}
                              className="transition-all duration-200 group-hover:stroke-[#39FF14]"
                            />
                          </svg>
                        )}
                        {isPreviewing ? (
                          <X className="w-3 h-3 absolute inset-0 m-auto z-10" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                      </div>
                      {isPreviewing ? 'Stop Preview' : 'Preview Voice'}
                    </div>
                  </Button>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-[#333]" />

              {/* Section Selection */}
              <div className="py-4">
                <div className="flex flex-col items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center mb-2">
                    <span className="text-primary-500 font-bold text-2xl">2</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-white">Select Sections</h3>
                </div>
                <SectionSelector
                  allSelected={generateAllSections}
                  onAllSelectedChange={setGenerateAllSections}
                  selectedSections={selectedVoiceSections}
                  onSelectedSectionsChange={setSelectedVoiceSections}
                />
              </div>

              {/* Divider */}
              <div className="border-t border-[#333]" />

              {/* Output Format Selection */}
              <div className="py-4">
                <div className="flex flex-col items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center mb-2">
                    <span className="text-primary-500 font-bold text-2xl">3</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-white">Output Format</h3>
                </div>
                <FormatSelector
                  value={outputFormat}
                  onChange={setOutputFormat}
                />
              </div>

              {/* Action Button */}
              <div className="flex justify-center pb-2">
                <Button 
                  variant="primary" 
                  onClick={handleGenerateVoiceOnly}
                  disabled={generating || !selectedVoiceForNew || (!generateAllSections && selectedVoiceSections.length === 0)}
                >
                  {generating ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <AudioLines className="w-4 h-4 mr-2" />
                      Generate {generateAllSections ? 'All 14 Sections' : `${selectedVoiceSections.length} Section${selectedVoiceSections.length !== 1 ? 's' : ''}`}
                    </>
                  )}
                </Button>
              </div>
            </div>
        </Card>

        {/* Existing Voice Sets */}
        {existingVoiceSets.length > 0 && (
          <Card variant="elevated" className="bg-[#0A0A0A] relative z-50 overflow-visible">
            {/* Audio Set Selector */}
            <div className={selectedVoiceSetId && selectedSetTracks.length > 0 ? 'mb-8' : ''}>
              <h2 className="text-xl md:text-2xl font-semibold text-white mb-6 text-center">Your Voice-Only Sets</h2>
              
              <div className="relative max-w-2xl mx-auto">
                <button
                  type="button"
                  onClick={() => setIsVoiceSetDropdownOpen(!isVoiceSetDropdownOpen)}
                  className="w-full px-4 md:px-6 py-3 md:py-3.5 rounded-full bg-[#1F1F1F] text-white border-2 border-[#333] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {selectedVoiceSetId ? (
                      <>
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary-500/20 text-primary-500">
                          <AudioLines className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <div className="font-semibold truncate">
                            {existingVoiceSets.find(s => s.id === selectedVoiceSetId)?.name || 
                             existingVoiceSets.find(s => s.id === selectedVoiceSetId)?.voice_name || 
                             'Voice Set'}
                          </div>
                        </div>
                      </>
                    ) : (
                      <span className="text-neutral-400">Select a voice set to listen...</span>
                    )}
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform ${isVoiceSetDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isVoiceSetDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-[100]" 
                      onClick={() => setIsVoiceSetDropdownOpen(false)}
                    />
                    <div className="absolute z-[110] w-full mt-2 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-[60vh] overflow-y-auto">
                      {existingVoiceSets.map((set) => (
                        <div
                          key={set.id}
                          onClick={() => {
                            setSelectedVoiceSetId(set.id)
                            setIsVoiceSetDropdownOpen(false)
                            loadSetTracks(set.id)
                          }}
                          className={`px-4 py-3 transition-colors border-b border-[#333] last:border-b-0 ${
                            selectedVoiceSetId === set.id ? 'bg-primary-500/10' : ''
                          } hover:bg-[#2A2A2A] cursor-pointer`}
                        >
                          <div className="flex items-start gap-4">
                            {/* Icon with background */}
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary-500/20 text-primary-500">
                              <AudioLines className="w-6 h-6" />
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-semibold text-white pr-2">
                                  {set.name || set.voice_name}
                                </h4>
                                {selectedVoiceSetId === set.id && (
                                  <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0" />
                                )}
                              </div>
                              <div className="space-y-1 text-xs text-neutral-400">
                                <div>
                                  <span className="text-neutral-500">Voice:</span> {set.voice_name}
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                  <span>{set.track_count} tracks</span>
                                  <span>•</span>
                                  <span>{new Date(set.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                              </div>
                              {set.track_count < 14 && set.section_keys && set.section_keys.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {set.section_keys.map((key) => {
                                    const category = VISION_CATEGORIES.find(c => c.key === key)
                                    return category ? (
                                      <span 
                                        key={key}
                                        className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs rounded-full"
                                      >
                                        {category.label}
                                      </span>
                                    ) : null
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Player for Selected Set */}
            {selectedVoiceSetId && selectedSetTracks.length > 0 && (
              <div className="max-w-2xl mx-auto">
                <PlaylistPlayer
                  tracks={selectedSetTracks}
                  setIcon={
                    <div className="p-2 rounded-lg bg-primary-500/20 text-primary-500">
                      <AudioLines className="w-6 h-6" />
                    </div>
                  }
                  setName={existingVoiceSets.find(s => s.id === selectedVoiceSetId)?.name || 
                           existingVoiceSets.find(s => s.id === selectedVoiceSetId)?.voice_name || 
                           'Voice Set'}
                  trackCount={selectedSetTracks.length}
                  createdDate={new Date(existingVoiceSets.find(s => s.id === selectedVoiceSetId)?.created_at || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  onRename={async (newName: string) => {
                    const selectedSet = existingVoiceSets.find(s => s.id === selectedVoiceSetId)
                    if (!selectedSet) return
                    
                    const supabase = createClient()
                    try {
                      const { error } = await supabase
                        .from('audio_sets')
                        .update({ name: newName })
                        .eq('id', selectedSet.id)
                      
                      if (error) throw error
                      
                      // Update local state
                      setExistingVoiceSets(existingVoiceSets.map(s => 
                        s.id === selectedSet.id ? { ...s, name: newName } : s
                      ))
                    } catch (error) {
                      console.error('Error updating audio set name:', error)
                      alert('Failed to update name. Please try again.')
                    }
                  }}
                />
              </div>
            )}

            {loadingTracks && (
              <div className="max-w-2xl mx-auto mt-8 text-center">
                <Spinner size="md" />
                <p className="text-sm text-neutral-400 mt-2">Loading tracks...</p>
              </div>
            )}
          </Card>
        )}

        {/* CTA to Mix */}
        {existingVoiceSets.length > 0 && (
          <Card variant="glass">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-[#14B8A6]/20 rounded-full flex items-center justify-center mb-3">
                <Music className="w-6 h-6 text-[#14B8A6]" />
              </div>
              <h2 className="text-xl md:text-2xl font-semibold text-white">Add Background Sounds</h2>
              <p className="text-sm text-neutral-400 mt-2">Choose how you want to create your mix</p>
            </div>
            <div className="flex justify-center">
              <Button variant="primary" asChild>
                <Link href={`/life-vision/${visionId}/audio/mix`}>
                  <Music className="w-4 h-4 mr-2" />
                  Create Audio Mix
                </Link>
              </Button>
            </div>
          </Card>
        )}
      </Stack>
    </Container>
  )
}