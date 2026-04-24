'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Spinner, Container, Stack } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Play, X, ChevronDown, ChevronUp, AudioLines, Search } from 'lucide-react'
import { getVisionCategoryKeys } from '@/lib/design-system'
import { useAudioStudio, QueueStatusBanner, AudioSourceSelector } from '@/components/audio-studio'
import type { AudioSourceSelection } from '@/components/audio-studio'

export default function AudioGeneratePage() {
  const router = useRouter()
  const { refreshBatches, sourceType, sourceId } = useAudioStudio()

  const [selectedSource, setSelectedSource] = useState<AudioSourceSelection | null>(null)
  const selectedVision = selectedSource?.vision || null
  const selectedStory = selectedSource?.story || null
  const activeSourceType = selectedSource?.sourceType || null
  const activeSourceId = selectedSource?.sourceId || null

  const [generating, setGenerating] = useState(false)
  const [storyContentExpanded, setStoryContentExpanded] = useState(false)
  const [voices, setVoices] = useState<{ id: string; name: string; previewUrl?: string }[]>([])
  const [dataLoading, setDataLoading] = useState(false)

  const [selectedVoiceForNew, setSelectedVoiceForNew] = useState<string>('alloy')
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null)
  const [previewProgress, setPreviewProgress] = useState<number>(0)
  const [voiceSearch, setVoiceSearch] = useState('')
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  // Voice preview (same pattern as binaural list on /audio/mix)
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.addEventListener('ended', () => {
        setPreviewingVoiceId(null)
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

  const handleVoicePreview = (e: React.MouseEvent, trackUrl: string, voiceId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!audioRef.current) return
    if (previewingVoiceId === voiceId) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setPreviewingVoiceId(null)
      setPreviewProgress(0)
    } else {
      if (previewingVoiceId) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      audioRef.current.src = trackUrl
      audioRef.current.currentTime = 0
      const updateProgress = () => {
        if (!audioRef.current) return
        const progress = (audioRef.current.currentTime / 30) * 100
        setPreviewProgress(Math.min(progress, 100))
        if (audioRef.current.currentTime >= 30) {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
          setPreviewingVoiceId(null)
          setPreviewProgress(0)
          audioRef.current.removeEventListener('timeupdate', updateProgress)
        }
      }
      audioRef.current.addEventListener('timeupdate', updateProgress)
      audioRef.current.play().catch(err => {
        console.error('Voice preview play error:', err)
        setPreviewingVoiceId(null)
        setPreviewProgress(0)
      })
      setPreviewingVoiceId(voiceId)
    }
  }

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

    let voiceList: { id: string; name: string; previewUrl?: string }[] = []
    try {
      const resp = await fetch('/api/audio/voices', { cache: 'no-store' })
      const data = await resp.json()
      voiceList = (data.voices || []).map((v: { id: string; brandName?: string; name?: string; gender?: string; previewUrl?: string }) => ({
        id: v.id,
        name: `${v.brandName || v.name} (${v.gender})`,
        previewUrl: v.previewUrl,
      }))
      setVoices(voiceList)
    } catch { /* keep empty */ }

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
        const categoryKeys = getVisionCategoryKeys().filter(k => k !== 'forward' && k !== 'conclusion')
        const allSections = [
          { key: 'forward', text: selectedVision.forward || '' },
          ...categoryKeys.map(key => ({ key, text: (selectedVision as Record<string, string>)[key] || '' })),
          { key: 'conclusion', text: selectedVision.conclusion || '' },
        ]
        sectionsPayload = allSections
          .filter(s => s.text.trim().length > 0)
          .map(s => ({ sectionKey: s.key, text: s.text }))
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

      const batchInsert: Record<string, unknown> = {
        user_id: user.id,
        variant_ids: ['standard'],
        voice_id: selectedVoiceForNew,
        sections_requested: sectionsPayload,
        total_tracks_expected: sectionsPayload.length,
        status: 'pending',
        metadata: {
          source_type: activeSourceType,
          generate_all_sections: true,
          selected_sections: null,
          audio_set_name: audioSetName || null,
        },
      }

      if (activeSourceType === 'life_vision') {
        batchInsert.vision_id = activeSourceId
      } else if (activeSourceType === 'story') {
        batchInsert.content_type = 'story'
        batchInsert.content_id = activeSourceId
        const meta = batchInsert.metadata as { story_id?: string }
        meta.story_id = activeSourceId
      }

      const { data: batch, error: batchError } = await supabase
        .from('audio_generation_batches')
        .insert(batchInsert)
        .select()
        .single()

      if (batchError || !batch) { alert('Failed to create generation batch.'); setGenerating(false); return }

      const generatePayload: Record<string, unknown> = {
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

  const filteredVoices = useMemo(
    () =>
      voices.filter(v => {
        if (!voiceSearch.trim()) return true
        const q = voiceSearch.toLowerCase()
        return v.name.toLowerCase().includes(q) || v.id.toLowerCase().includes(q)
      }),
    [voices, voiceSearch]
  )

  return (
    <Container size="xl" className="py-4 md:py-6">
      <Stack gap="lg" className="overflow-visible">
        <h1 className="sr-only">Generate Audio</h1>

        <QueueStatusBanner />

        <AudioSourceSelector
          onSourceSelected={handleSourceSelected}
          initialSourceType={sourceType}
          initialSourceId={sourceId}
        />

        {selectedSource && !dataLoading && (
          <>
            <Card variant="glass" className="p-4 md:p-6">
              <div className="space-y-6">
                <div className="py-2">
                  <div className="flex flex-col items-center text-center mb-4">
                    <h3 className="text-lg font-semibold text-white">Select Voice</h3>
                    <p className="text-sm text-neutral-400">Preview samples, select a voice, then click the Generate button below.</p>
                  </div>
                  {voices.length > 6 && (
                    <div className="relative max-w-md mx-auto mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                      <input
                        type="text"
                        value={voiceSearch}
                        onChange={e => setVoiceSearch(e.target.value)}
                        placeholder="Search voices..."
                        className="w-full pl-9 pr-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#39FF14]/50"
                      />
                    </div>
                  )}
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-0.5">
                    {voices.length > 0 && filteredVoices.length === 0 && (
                      <p className="text-sm text-neutral-500 text-center py-6">No voices match your search.</p>
                    )}
                    {filteredVoices.map(voice => {
                        const isSelected = selectedVoiceForNew === voice.id
                        const isThisPreviewing = previewingVoiceId === voice.id
                        const canPreview = Boolean(voice.previewUrl)
                        return (
                          <div
                            key={voice.id}
                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-primary-500/10 border border-primary-500'
                                : 'bg-neutral-800/50 border border-transparent hover:bg-neutral-800'
                            }`}
                            onClick={() => {
                              if (selectedVoiceForNew !== voice.id && audioRef.current) {
                                audioRef.current.pause()
                                audioRef.current.currentTime = 0
                                setPreviewingVoiceId(null)
                                setPreviewProgress(0)
                              }
                              setSelectedVoiceForNew(voice.id)
                            }}
                          >
                            {isSelected && (
                              <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-white font-medium text-sm md:text-base">{voice.name}</p>
                            </div>
                            <div className="relative flex-shrink-0 w-9 h-9">
                              {isThisPreviewing && (
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
                                disabled={!canPreview}
                                onClick={e => { if (canPreview && voice.previewUrl) handleVoicePreview(e, voice.previewUrl, voice.id) }}
                                className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                                  isThisPreviewing
                                    ? 'bg-primary-500'
                                    : canPreview
                                      ? 'bg-neutral-800 hover:bg-neutral-700'
                                      : 'bg-neutral-800/50 cursor-not-allowed opacity-50'
                                }`}
                              >
                                {isThisPreviewing ? <X className="w-4 h-4 text-[#1F1F1F]" /> : <Play className="w-4 h-4 text-neutral-400" />}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>

                {activeSourceType === 'story' && selectedStory && (
                  <>
                    <div className="border-t border-[#333]" />
                    <div className="pt-2">
                      <p className="text-xs text-neutral-500 text-center mb-2">Optional: preview the text that will be narrated</p>
                      <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setStoryContentExpanded(!storyContentExpanded)}
                          className="w-full flex items-center justify-between p-4 hover:bg-neutral-700/20 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs uppercase tracking-wider text-neutral-500 font-semibold truncate">
                              {selectedStory.title || 'Story'}
                            </span>
                            <span className="text-xs text-neutral-400 flex-shrink-0">
                              ({selectedStory.word_count?.toLocaleString() || 0} words)
                            </span>
                          </div>
                          {storyContentExpanded
                            ? <ChevronUp className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                            : <ChevronDown className="w-4 h-4 text-neutral-400 flex-shrink-0" />
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
                  </>
                )}

                <div className="flex justify-center pb-2">
                  <Button
                    variant="primary"
                    onClick={handleGenerate}
                    disabled={generating || !selectedVoiceForNew}
                    className="min-w-[12rem] justify-center"
                  >
                    {generating ? (
                      <span className="inline-flex items-center gap-2">
                        <Spinner size="sm" />
                        Generating...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <AudioLines className="w-5 h-5" />
                        Generate
                      </span>
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
