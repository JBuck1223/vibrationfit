'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Spinner, Container, Stack, PageHero } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Play, Waves, X, ChevronDown, ChevronUp } from 'lucide-react'
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
  const [storyContentExpanded, setStoryContentExpanded] = useState(false)
  const [voices, setVoices] = useState<Voice[]>([])
  const [dataLoading, setDataLoading] = useState(false)

  const [selectedVoiceForNew, setSelectedVoiceForNew] = useState<string>('alloy')
  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [previewProgress, setPreviewProgress] = useState<number>(0)
  const previewAudioRef = React.useRef<HTMLAudioElement | null>(null)

  const [generateAllSections, setGenerateAllSections] = useState(true)
  const [selectedVoiceSections, setSelectedVoiceSections] = useState<string[]>([])


  function handleSourceSelected(selection: AudioSourceSelection) {
    setSelectedSource(selection)
    setDataLoading(true)
  }

  useEffect(() => {
    if (!selectedSource) return
    loadPageData()
  }, [selectedSource?.sourceId])

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
        batchInsert.content_type = 'story'
        batchInsert.content_id = activeSourceId
        batchInsert.metadata.story_id = activeSourceId
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
      }).then(res => {
        if (!res.ok) console.error('Generation API returned error:', res.status)
      }).catch(err => {
        console.error('Generation API error:', err)
      })

      await refreshBatches()
      router.push('/audio/queue')

    } catch (error) {
      console.error('Generation error:', error)
      alert('An error occurred during generation.')
      setGenerating(false)
    }
  }

  return (
    <Container size="xl" className="py-6">
      <Stack gap="lg" className="overflow-visible">
        <PageHero
          title="Generate Audio"
          subtitle="Choose a source and voice to create VIVA narration of your Life Vision or Story."
        />

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
                    <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setStoryContentExpanded(!storyContentExpanded)}
                        className="w-full flex items-center justify-between p-4 hover:bg-neutral-700/20 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                            {selectedStory.title || 'Story'}
                          </span>
                          <span className="text-xs text-neutral-400">
                            ({selectedStory.word_count?.toLocaleString() || 0} words)
                          </span>
                        </div>
                        {storyContentExpanded
                          ? <ChevronUp className="w-4 h-4 text-neutral-400" />
                          : <ChevronDown className="w-4 h-4 text-neutral-400" />
                        }
                      </button>
                      {storyContentExpanded && (
                        <div className="p-4 pt-0 border-t border-neutral-700 max-h-[60vh] overflow-y-auto">
                          <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap pt-4">
                            {selectedStory.content}
                          </p>
                        </div>
                      )}
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
