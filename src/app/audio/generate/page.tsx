'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Spinner, Container, Stack } from '@/lib/design-system/components'
import { PlaylistPlayer } from '@/lib/design-system'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Play, Mic, Clock, Music, Waves, X, ChevronDown } from 'lucide-react'
import { getVisionCategoryKeys, VISION_CATEGORIES } from '@/lib/design-system'
import { SectionSelector } from '@/components/SectionSelector'
import { useAudioStudio, QueueStatusBanner, AudioSourceSelector } from '@/components/audio-studio'
import type { AudioSourceSelection } from '@/components/audio-studio'
import type { VisionData } from '@/components/audio-studio'
import type { Story } from '@/lib/stories/types'

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

export default function AudioGeneratePage() {
  const router = useRouter()
  const { refreshAudioSets, refreshBatches, sourceType, sourceId } = useAudioStudio()

  // Source selection
  const [selectedSource, setSelectedSource] = useState<AudioSourceSelection | null>(null)
  const selectedVision = selectedSource?.vision || null
  const selectedStory = selectedSource?.story || null
  const activeSourceType = selectedSource?.sourceType || null
  const activeSourceId = selectedSource?.sourceId || null

  const [generating, setGenerating] = useState(false)
  const [voices, setVoices] = useState<Voice[]>([])
  const [existingVoiceSets, setExistingVoiceSets] = useState<ExistingVoiceSet[]>([])
  const [dataLoading, setDataLoading] = useState(false)

  const [selectedVoiceForNew, setSelectedVoiceForNew] = useState<string>('alloy')
  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [previewProgress, setPreviewProgress] = useState<number>(0)
  const previewAudioRef = React.useRef<HTMLAudioElement | null>(null)

  const [generateAllSections, setGenerateAllSections] = useState(true)
  const [selectedVoiceSections, setSelectedVoiceSections] = useState<string[]>([])
  const [isVoiceSetDropdownOpen, setIsVoiceSetDropdownOpen] = useState(false)
  const [selectedVoiceSetId, setSelectedVoiceSetId] = useState<string | null>(null)
  const [selectedSetTracks, setSelectedSetTracks] = useState<any[]>([])
  const [loadingTracks, setLoadingTracks] = useState(false)

  function handleSourceSelected(selection: AudioSourceSelection) {
    setSelectedSource(selection)
    setExistingVoiceSets([])
    setSelectedVoiceSetId(null)
    setSelectedSetTracks([])
    setDataLoading(true)
  }

  useEffect(() => {
    if (!selectedSource) return
    loadPageData()
  }, [selectedSource?.sourceId])

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
      setSelectedSetTracks(tracks.map(t => {
        const category = VISION_CATEGORIES.find(c => c.key === t.section_key)
        return {
          id: t.id,
          title: category?.label || t.section_key || 'Full Track',
          artist: '',
          duration: t.duration_seconds || 0,
          url: t.audio_url,
          sectionKey: t.section_key,
        }
      }))
    }
    setLoadingTracks(false)
  }

  async function loadPageData() {
    if (!activeSourceId) return
    const supabase = createClient()

    let voiceList: Voice[] = []
    try {
      const resp = await fetch('/api/audio/voices', { cache: 'no-store' })
      const data = await resp.json()
      voiceList = (data.voices || []).map((v: any) => ({
        id: v.id,
        name: `${v.brandName || v.name} (${v.gender})`,
        previewUrl: v.previewUrl,
      }))
      setVoices(voiceList)
    } catch {}

    if (activeSourceType === 'life_vision') {
      const { data: sets } = await supabase
        .from('audio_sets')
        .select('id, voice_id, name, created_at, audio_tracks(section_key)')
        .eq('vision_id', activeSourceId)
        .eq('variant', 'standard')
        .order('created_at', { ascending: false })

      setExistingVoiceSets((sets || []).map((set: any) => ({
        id: set.id,
        voice_id: set.voice_id,
        voice_name: voiceList.find(v => v.id === set.voice_id)?.name || set.voice_id,
        created_at: set.created_at,
        track_count: set.audio_tracks?.length || 0,
        name: set.name,
        section_keys: set.audio_tracks?.map((t: any) => t.section_key).filter(Boolean) || [],
      })))
    } else if (activeSourceType === 'story') {
      // For stories, look up existing audio sets via the story's audio_set_id
      const { data: sets } = await supabase
        .from('audio_sets')
        .select('id, voice_id, name, created_at, audio_tracks(section_key)')
        .eq('content_type', 'story')
        .eq('entity_id', activeSourceId)
        .eq('variant', 'standard')
        .order('created_at', { ascending: false })

      setExistingVoiceSets((sets || []).map((set: any) => ({
        id: set.id,
        voice_id: set.voice_id,
        voice_name: voiceList.find(v => v.id === set.voice_id)?.name || set.voice_id,
        created_at: set.created_at,
        track_count: set.audio_tracks?.length || 0,
        name: set.name,
        section_keys: set.audio_tracks?.map((t: any) => t.section_key).filter(Boolean) || [],
      })))
    }

    setDataLoading(false)
  }

  async function handleGenerate() {
    if (!activeSourceId || generating) return
    setGenerating(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { alert('You must be logged in to generate audio'); setGenerating(false); return }

      let sectionsPayload: { sectionKey: string; text: string }[] = []
      let audioSetName = ''

      if (activeSourceType === 'life_vision' && selectedVision) {
        if (generateAllSections) {
          const categoryKeys = getVisionCategoryKeys().filter(k => k !== 'forward' && k !== 'conclusion')
          const allSections = [
            { key: 'forward', text: selectedVision.forward || '' },
            ...categoryKeys.map(key => ({ key, text: selectedVision[key] || '' })),
            { key: 'conclusion', text: selectedVision.conclusion || '' },
          ]
          sectionsPayload = allSections
            .filter(s => s.text.trim().length > 0)
            .map(s => ({ sectionKey: s.key, text: s.text }))
        } else {
          const orderedKeys = VISION_CATEGORIES.map(c => c.key) as string[]
          const sections = [...selectedVoiceSections]
            .sort((a, b) => orderedKeys.indexOf(a) - orderedKeys.indexOf(b))
            .map(key => ({ key, text: selectedVision[key] || '' }))
            .filter(s => s.text.trim().length > 0)
          sectionsPayload = sections.map(s => ({ sectionKey: s.key, text: s.text }))

          if (sections.length === 1) {
            const cat = VISION_CATEGORIES.find(c => c.key === sections[0].key)
            audioSetName = `${cat?.label || sections[0].key} Focus`
          } else if (sections.length <= 3) {
            audioSetName = `${sections.map(s => VISION_CATEGORIES.find(c => c.key === s.key)?.label || s.key).join(' + ')} Focus`
          } else if (sections.length < 14) {
            audioSetName = `Custom ${sections.length} Sections`
          }
        }
      } else if (activeSourceType === 'story' && selectedStory) {
        const content = selectedStory.content || ''
        if (!content.trim()) {
          alert('This story has no content to generate audio from.')
          setGenerating(false)
          return
        }
        sectionsPayload = [{ sectionKey: 'full', text: content }]
        audioSetName = selectedStory.title || 'Story Audio'
      }

      if (sectionsPayload.length === 0) {
        alert('No content found for generation.')
        setGenerating(false)
        return
      }

      const batchInsert: any = {
        user_id: user.id,
        variant_ids: ['standard'],
        voice_id: selectedVoiceForNew,
        sections_requested: sectionsPayload,
        total_tracks_expected: sectionsPayload.length,
        status: 'pending',
        metadata: {
          source_type: activeSourceType,
          generate_all_sections: activeSourceType === 'life_vision' ? generateAllSections : true,
          selected_sections: activeSourceType === 'life_vision' && !generateAllSections ? selectedVoiceSections : null,
          audio_set_name: audioSetName || null,
        },
      }

      if (activeSourceType === 'life_vision') {
        batchInsert.vision_id = activeSourceId
      } else if (activeSourceType === 'story') {
        batchInsert.metadata.story_id = activeSourceId
        batchInsert.metadata.content_type = 'story'
      }

      const { data: batch, error: batchError } = await supabase
        .from('audio_generation_batches')
        .insert(batchInsert)
        .select()
        .single()

      if (batchError || !batch) { alert('Failed to create generation batch.'); setGenerating(false); return }

      const generatePayload: any = {
        sections: sectionsPayload,
        voice: selectedVoiceForNew,
        variant: 'standard',
        batchId: batch.id,
        audioSetName: audioSetName || undefined,
      }

      if (activeSourceType === 'life_vision') {
        generatePayload.visionId = activeSourceId
      } else if (activeSourceType === 'story') {
        generatePayload.storyId = activeSourceId
        generatePayload.contentType = 'story'
      }

      fetch('/api/audio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generatePayload),
      }).catch(err => console.error('Generation API error:', err))

      await refreshBatches()
      setGenerating(false)

    } catch (error) {
      console.error('Generation error:', error)
      alert('An error occurred during generation.')
      setGenerating(false)
    }
  }

  return (
    <Container size="xl" className="py-6">
      <Stack gap="lg" className="overflow-visible">
        <QueueStatusBanner />

        {/* Source Selector */}
        <AudioSourceSelector
          onSourceSelected={handleSourceSelected}
          initialSourceType={sourceType}
          initialSourceId={sourceId}
        />

        {/* Content below only shows once source is selected */}
        {selectedSource && !dataLoading && (
          <>
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
                          <div className="fixed inset-0 z-10" onClick={() => setIsVoiceDropdownOpen(false)} />
                          <div className="absolute z-20 w-full mt-2 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                            {voices.map(voice => (
                              <button
                                key={voice.id}
                                onClick={() => {
                                  setSelectedVoiceForNew(voice.id)
                                  setIsVoiceDropdownOpen(false)
                                  if (previewAudioRef.current) { previewAudioRef.current.pause(); previewAudioRef.current.currentTime = 0 }
                                  setIsPreviewing(false)
                                  setPreviewProgress(0)
                                }}
                                className={`w-full px-4 py-3 text-left hover:bg-[#2A2A2A] transition-colors border-b border-[#333] last:border-b-0 ${selectedVoiceForNew === voice.id ? 'bg-primary-500/10' : ''}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-white font-medium">{voice.name}</span>
                                  {selectedVoiceForNew === voice.id && <CheckCircle className="w-5 h-5 text-primary-500" />}
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
                        const selectedVoice = voices.find(v => v.id === selectedVoiceForNew)
                        if (!selectedVoice?.previewUrl) return
                        if (isPreviewing) {
                          if (previewAudioRef.current) { previewAudioRef.current.pause(); previewAudioRef.current.currentTime = 0 }
                          setIsPreviewing(false); setPreviewProgress(0)
                        } else {
                          setIsPreviewing(true)
                          if (!previewAudioRef.current) previewAudioRef.current = new Audio(selectedVoice.previewUrl)
                          else previewAudioRef.current.src = selectedVoice.previewUrl
                          previewAudioRef.current.addEventListener('timeupdate', () => {
                            if (previewAudioRef.current) setPreviewProgress((previewAudioRef.current.currentTime / previewAudioRef.current.duration) * 100)
                          })
                          previewAudioRef.current.addEventListener('ended', () => { setIsPreviewing(false); setPreviewProgress(0) })
                          await previewAudioRef.current.play()
                        }
                      }}
                      disabled={!selectedVoiceForNew || !voices.find(v => v.id === selectedVoiceForNew)?.previewUrl}
                    >
                      <div className="flex items-center">
                        {isPreviewing ? <X className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                        {isPreviewing ? 'Stop Preview' : 'Preview Voice'}
                      </div>
                    </Button>
                  </div>
                </div>

                <div className="border-t border-[#333]" />

                {/* Section Selection (Life Vision only) */}
                {activeSourceType === 'life_vision' && (
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
                )}

                {/* Story content preview */}
                {activeSourceType === 'story' && selectedStory && (
                  <div className="py-4">
                    <div className="flex flex-col items-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center mb-2">
                        <span className="text-primary-500 font-bold text-2xl">2</span>
                      </div>
                      <h3 className="text-lg md:text-xl font-semibold text-white">Story Content</h3>
                    </div>
                    <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg overflow-hidden max-w-2xl mx-auto">
                      <div className="flex items-center gap-2 p-4 pb-3 border-b border-neutral-700">
                        <span className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                          {selectedStory.title || 'Story'}
                        </span>
                        <span className="text-xs text-neutral-400">
                          ({selectedStory.word_count?.toLocaleString() || 0} words)
                        </span>
                      </div>
                      <div className="p-4 max-h-48 overflow-y-auto">
                        <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap line-clamp-6">
                          {selectedStory.content}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Generate Button */}
                <div className="flex justify-center pb-2">
                  <Button
                    variant="primary"
                    onClick={handleGenerate}
                    disabled={
                      generating ||
                      !selectedVoiceForNew ||
                      (activeSourceType === 'life_vision' && !generateAllSections && selectedVoiceSections.length === 0)
                    }
                  >
                    {generating ? (
                      <><Spinner size="sm" className="mr-2" />Generating...</>
                    ) : activeSourceType === 'life_vision' ? (
                      <><Waves className="w-5 h-5 mr-2" />Generate {generateAllSections ? 'All 14 Sections' : `${selectedVoiceSections.length} Section${selectedVoiceSections.length !== 1 ? 's' : ''}`}</>
                    ) : (
                      <><Waves className="w-5 h-5 mr-2" />Generate Story Audio</>
                    )}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Existing Voice Sets */}
            {existingVoiceSets.length > 0 && (
              <Card variant="elevated" className="bg-[#0A0A0A] relative z-50 overflow-visible">
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
                              <Waves className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div className="text-left flex-1 min-w-0">
                              <div className="font-semibold truncate">
                                {existingVoiceSets.find(s => s.id === selectedVoiceSetId)?.name ||
                                  existingVoiceSets.find(s => s.id === selectedVoiceSetId)?.voice_name || 'Voice Set'}
                              </div>
                            </div>
                          </>
                        ) : (
                          <span className="text-neutral-400">Select a voice set to listen...</span>
                        )}
                      </div>
                      <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform flex-shrink-0 ml-2 ${isVoiceSetDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isVoiceSetDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-[100]" onClick={() => setIsVoiceSetDropdownOpen(false)} />
                        <div className="absolute z-[110] w-full mt-2 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-[60vh] overflow-y-auto">
                          {existingVoiceSets.map(set => (
                            <div
                              key={set.id}
                              onClick={() => {
                                setSelectedVoiceSetId(set.id)
                                setIsVoiceSetDropdownOpen(false)
                                loadSetTracks(set.id)
                              }}
                              className={`px-4 py-3 transition-colors border-b border-[#333] last:border-b-0 hover:bg-[#2A2A2A] cursor-pointer ${selectedVoiceSetId === set.id ? 'bg-primary-500/10' : ''}`}
                            >
                              <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary-500/20 text-primary-500">
                                  <Waves className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-semibold text-white pr-2">{set.name || set.voice_name}</h4>
                                    {selectedVoiceSetId === set.id && <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0" />}
                                  </div>
                                  <div className="space-y-1 text-xs text-neutral-400">
                                    <div><span className="text-neutral-500">Voice:</span> {set.voice_name}</div>
                                    <div className="flex items-center gap-2 pt-1">
                                      <span>{set.track_count} tracks</span>
                                      <span>&bull;</span>
                                      <span>{new Date(set.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {selectedVoiceSetId && selectedSetTracks.length > 0 && (
                  <div className="max-w-2xl mx-auto">
                    <PlaylistPlayer
                      tracks={selectedSetTracks}
                      setIcon={<div className="p-2 rounded-lg bg-primary-500/20 text-primary-500"><Waves className="w-6 h-6" /></div>}
                      setName={existingVoiceSets.find(s => s.id === selectedVoiceSetId)?.name || existingVoiceSets.find(s => s.id === selectedVoiceSetId)?.voice_name || 'Voice Set'}
                      trackCount={selectedSetTracks.length}
                      createdDate={new Date(existingVoiceSets.find(s => s.id === selectedVoiceSetId)?.created_at || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
                    <a href={activeSourceType && activeSourceId ? `/audio/mix?source=${activeSourceType}&sourceId=${activeSourceId}` : '/audio/mix'}>
                      <Music className="w-4 h-4 mr-2" />Create Audio Mix
                    </a>
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}

        {selectedSource && dataLoading && (
          <div className="flex min-h-[20vh] items-center justify-center">
            <Spinner size="lg" />
          </div>
        )}
      </Stack>
    </Container>
  )
}
