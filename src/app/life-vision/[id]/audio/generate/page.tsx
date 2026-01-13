"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Spinner, Badge, Container, Stack, VersionBadge, StatusBadge, PageHero } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { Headphones, CheckCircle, Play, CalendarDays, Plus, Mic, Clock, Eye, ListMusic, Music } from 'lucide-react'
import Link from 'next/link'
import { getVisionCategoryKeys, VISION_CATEGORIES } from '@/lib/design-system'
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
  
  // Voice Only Generation Form
  const [showNewVoiceForm, setShowNewVoiceForm] = useState(false)
  const [selectedVoiceForNew, setSelectedVoiceForNew] = useState<string>('alloy')
  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [previewProgress, setPreviewProgress] = useState<number>(0)
  const previewAudioRef = React.useRef<HTMLAudioElement | null>(null)
  
  // Section Selection for Voice Generation
  const [generateAllSections, setGenerateAllSections] = useState(true)
  const [selectedVoiceSections, setSelectedVoiceSections] = useState<string[]>([])
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('both')
  
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
      const voiceList = (data.voices || []).map((v: any) => ({ 
        id: v.id, 
        name: `${v.brandName || v.name} (${v.gender})`,
        previewUrl: v.previewUrl
      }))
      setVoices(voiceList)
    } catch {}

    // Load existing voice-only (standard) sets
    const { data: sets } = await supabase
      .from('audio_sets')
      .select(`
        id,
        voice_id,
        name,
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
      track_count: set.audio_tracks?.[0]?.count || 0,
      name: set.name
    }))

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
      <Stack gap="lg">
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

        {/* Existing Voice Sets */}
        {existingVoiceSets.length > 0 && (
          <Card variant="glass" className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Your Voice Sets</h2>
              <Badge variant="neutral">{existingVoiceSets.length} set{existingVoiceSets.length !== 1 ? 's' : ''}</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {existingVoiceSets.map((set) => (
                <Card 
                  key={set.id} 
                  variant="default" 
                  hover
                  className="p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white font-medium">
                        {set.name || voices.find(v => v.id === set.voice_id)?.name || set.voice_id}
                      </p>
                      <p className="text-xs text-neutral-400 mt-1">
                        {set.track_count} tracks • {new Date(set.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0" />
                  </div>
                </Card>
              ))}
            </div>
            
            {/* CTA to Mix */}
            {existingVoiceSets.length > 0 && (
              <div className="mt-6 pt-4 border-t border-neutral-700/50 text-center">
                <p className="text-sm text-neutral-400 mb-3">Ready to add background music?</p>
                <Button variant="secondary" asChild>
                  <Link href={`/life-vision/${visionId}/audio/mix`}>
                    <Music className="w-4 h-4 mr-2" />
                    Create Audio Mix
                  </Link>
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Generate New Voice Set */}
        <Card variant="glass" className="p-4 md:p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 bg-[#39FF14]/20 rounded-full flex items-center justify-center mb-3">
              <Headphones className="w-6 h-6 text-[#39FF14]" />
            </div>
            <h2 className="text-lg md:text-xl font-semibold text-white">Generate Voice-Only Tracks</h2>
            <p className="text-sm text-neutral-400">Choose a voice and sections to generate</p>
          </div>

          {!showNewVoiceForm ? (
            <div className="flex justify-center">
              <Button 
                variant="primary" 
                onClick={() => setShowNewVoiceForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Generate New Voice Set
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Voice Selection */}
              <div>
                <h3 className="text-sm font-medium text-white mb-3">Select Voice</h3>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <button
                      type="button"
                      onClick={() => setIsVoiceDropdownOpen(!isVoiceDropdownOpen)}
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
                        <div className="fixed inset-0 z-10" onClick={() => setIsVoiceDropdownOpen(false)} />
                        <div className="absolute z-20 w-full top-full mt-1 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-96 overflow-y-auto">
                          <div className="px-3 py-1 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Available Voices</div>
                          {voices.map((v: any) => (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => {
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
                    onClick={async () => {
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
                        const selectedVoice = voices.find(v => v.id === selectedVoiceForNew)
                        if (selectedVoice?.previewUrl) {
                          audioUrl = selectedVoice.previewUrl
                        } else {
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
              </div>

              {/* Section Selection */}
              <div className="pt-4 border-t border-neutral-800">
                <h3 className="text-sm font-medium text-white mb-3">Which sections to generate?</h3>
                <SectionSelector
                  allSelected={generateAllSections}
                  onAllSelectedChange={setGenerateAllSections}
                  selectedSections={selectedVoiceSections}
                  onSelectedSectionsChange={setSelectedVoiceSections}
                  label="All 14 Sections"
                  description="Select specific sections to create focused audio sets (e.g., just Money or Relationships)"
                />
              </div>

              {/* Output Format Selection - only show if more than 1 section */}
              {(generateAllSections || selectedVoiceSections.length > 1) && (
                <div className="pt-4 border-t border-neutral-800">
                  <h3 className="text-sm font-medium text-white mb-3">Output format</h3>
                  <FormatSelector
                    value={outputFormat}
                    onChange={setOutputFormat}
                    disabled={generating}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
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
                  onClick={handleGenerateVoiceOnly}
                  disabled={generating || !selectedVoiceForNew || (!generateAllSections && selectedVoiceSections.length === 0)}
                  className="flex-1"
                >
                  {generating ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      Generate {generateAllSections ? 'All 14 Sections' : `${selectedVoiceSections.length} Section${selectedVoiceSections.length !== 1 ? 's' : ''}`}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Recent Activity */}
        {activeBatches.length > 0 && (
          <Card variant="glass" className="p-4 md:p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {activeBatches.slice(0, 3).map((batch) => (
                <div 
                  key={batch.id}
                  className="flex items-center justify-between p-3 bg-neutral-900/50 rounded-xl border border-neutral-800"
                >
                  <div className="flex items-center gap-3">
                    {batch.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-primary-500" />
                    ) : batch.status === 'processing' || batch.status === 'pending' ? (
                      <Spinner size="sm" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                        <span className="text-red-400 text-xs">!</span>
                      </div>
                    )}
                    <div>
                      <p className="text-white text-sm font-medium">
                        {voices.find(v => v.id === batch.voice_id)?.name || batch.voice_id}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {batch.tracks_completed}/{batch.total_tracks_expected} tracks
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/life-vision/${visionId}/audio/queue/${batch.id}`}>
                      View
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
            
            {activeBatches.length > 3 && (
              <div className="mt-4 text-center">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/life-vision/${visionId}/audio/queue`}>
                    View All Activity
                  </Link>
                </Button>
              </div>
            )}
          </Card>
        )}
      </Stack>
    </Container>
  )
}
