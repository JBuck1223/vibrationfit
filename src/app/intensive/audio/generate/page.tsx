'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Spinner, Container, Stack, EmbeddedPlayer } from '@/lib/design-system/components'
import type { AudioTrack } from '@/lib/design-system/components/media/types'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Play, X, AudioLines, Search, Headphones } from 'lucide-react'
import { getVisionCategoryKeys } from '@/lib/design-system'
import { useAudioStudio, QueueStatusBanner } from '@/components/audio-studio'
import { CompletedStepRow } from '@/components/CompletedStepRow'
import { useIntensiveStep } from '@/components/intensive-studio/IntensiveStepContext'

export default function IntensiveAudioGeneratePage() {
  const router = useRouter()
  const { allVisions, visionLoading, refreshBatches } = useAudioStudio()
  const { setCompletedAt } = useIntensiveStep()

  const activeVision = useMemo(
    () => allVisions.find(v => v.is_active) ?? allVisions[0] ?? null,
    [allVisions]
  )

  const [stepAlreadyComplete, setStepAlreadyComplete] = useState<boolean | null>(null)
  const [completedTracks, setCompletedTracks] = useState<AudioTrack[]>([])
  const [tracksLoading, setTracksLoading] = useState(false)

  const [generating, setGenerating] = useState(false)
  const [voices, setVoices] = useState<{ id: string; name: string; previewUrl?: string }[]>([])
  const [voicesLoading, setVoicesLoading] = useState(true)

  const [selectedVoiceId, setSelectedVoiceId] = useState('')
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null)
  const [previewProgress, setPreviewProgress] = useState(0)
  const [voiceSearch, setVoiceSearch] = useState('')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [lastBatchVoiceId, setLastBatchVoiceId] = useState<string | null>(null)

  const [currentStep, setCurrentStep] = useState<1 | 2>(1)
  const step1Ref = useRef<HTMLDivElement>(null)
  const step2Ref = useRef<HTMLDivElement>(null)

  const scrollToStep = (ref: React.RefObject<HTMLDivElement | null>) => {
    requestAnimationFrame(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

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

  const SECTION_LABELS = new Map<string, string>([
    ['forward', 'Forward'], ['fun', 'Fun'], ['health', 'Health'], ['travel', 'Travel'],
    ['love', 'Love'], ['family', 'Family'], ['social', 'Social'], ['home', 'Home'],
    ['work', 'Work'], ['money', 'Money'], ['stuff', 'Stuff'], ['giving', 'Giving'],
    ['spirituality', 'Spirituality'], ['conclusion', 'Conclusion'], ['full', 'Full Life Vision'],
  ])
  const CANONICAL_ORDER = ['forward', 'fun', 'health', 'travel', 'love', 'family', 'social', 'home', 'work', 'money', 'stuff', 'giving', 'spirituality', 'conclusion']

  async function loadCompletedTracks(supabase: ReturnType<typeof createClient>, userId: string, cancelled: boolean) {
    setTracksLoading(true)
    try {
      const { data: audioSet } = await supabase
        .from('audio_sets')
        .select('id, variant')
        .eq('user_id', userId)
        .eq('content_type', 'life_vision')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (cancelled || !audioSet) { setTracksLoading(false); return }

      const { data: tracks } = await supabase
        .from('audio_tracks')
        .select('id, audio_url, section_key, duration_seconds, mixed_audio_url, mix_status')
        .eq('audio_set_id', audioSet.id)
        .eq('status', 'completed')
        .not('audio_url', 'is', null)
        .order('section_key')

      if (cancelled) return

      const useDirectAudio = audioSet.variant === 'standard' || audioSet.variant === 'personal'
      const formatted: AudioTrack[] = (tracks || [])
        .map(t => {
          const url = !useDirectAudio && t.mixed_audio_url && t.mix_status === 'completed' ? t.mixed_audio_url : t.audio_url
          const dur = typeof t.duration_seconds === 'number' && isFinite(t.duration_seconds) && t.duration_seconds > 0 ? t.duration_seconds : 0
          return {
            id: t.id,
            title: SECTION_LABELS.get(t.section_key) || t.section_key,
            artist: '',
            duration: dur,
            url: url || '',
            thumbnail: '',
            sectionKey: t.section_key,
          }
        })
        .filter(t => t.url.length > 0)
        .sort((a, b) => {
          const ia = CANONICAL_ORDER.indexOf((a as any).sectionKey)
          const ib = CANONICAL_ORDER.indexOf((b as any).sectionKey)
          return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
        })

      setCompletedTracks(formatted)
    } catch (err) {
      console.error('Error loading completed tracks:', err)
    } finally {
      if (!cancelled) setTracksLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    async function checkStepCompletion() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('audio_generated, audio_generated_at')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (cancelled) return

      if (checklist?.audio_generated) {
        setStepAlreadyComplete(true)
        if (checklist.audio_generated_at) {
          setCompletedAt(checklist.audio_generated_at)
        }
        loadCompletedTracks(supabase, user.id, cancelled)
      } else {
        setStepAlreadyComplete(false)
      }
    }
    checkStepCompletion()
    return () => {
      cancelled = true
      setCompletedAt(null)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadVoicesAndLastBatch() {
      try {
        const [voiceResp, supabase] = await Promise.all([
          fetch('/api/audio/voices', { cache: 'no-store' }),
          Promise.resolve(createClient()),
        ])
        if (cancelled) return

        const voiceData = await voiceResp.json()
        const voiceList = (voiceData.voices || []).map(
          (v: { id: string; brandName?: string; name?: string; gender?: string; previewUrl?: string }) => ({
            id: v.id,
            name: `${v.brandName || v.name} (${v.gender})`,
            previewUrl: v.previewUrl,
          })
        )
        if (!cancelled) setVoices(voiceList)

        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user || cancelled) return
        const { data } = await supabase
          .from('audio_generation_batches')
          .select('voice_id')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (!cancelled && data?.voice_id) setLastBatchVoiceId(data.voice_id)
      } catch {
        /* keep empty */
      } finally {
        if (!cancelled) setVoicesLoading(false)
      }
    }
    loadVoicesAndLastBatch()
    return () => { cancelled = true }
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
      audioRef.current.play().catch(() => {
        setPreviewingVoiceId(null)
        setPreviewProgress(0)
      })
      setPreviewingVoiceId(voiceId)
    }
  }

  function handleVoiceSelect(voiceId: string) {
    if (selectedVoiceId !== voiceId && audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setPreviewingVoiceId(null)
      setPreviewProgress(0)
    }
    setSelectedVoiceId(voiceId)
    setCurrentStep(2)
    scrollToStep(step2Ref)
  }

  async function handleGenerate() {
    if (!activeVision || generating) return
    setGenerating(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) { alert('You must be logged in to generate audio'); setGenerating(false); return }

      const categoryKeys = getVisionCategoryKeys().filter(k => k !== 'forward' && k !== 'conclusion')
      const allSections = [
        { key: 'forward', text: activeVision.forward || '' },
        ...categoryKeys.map(key => ({ key, text: (activeVision as Record<string, string>)[key] || '' })),
        { key: 'conclusion', text: activeVision.conclusion || '' },
      ]
      const sectionsPayload = allSections
        .filter(s => s.text.trim().length > 0)
        .map(s => ({ sectionKey: s.key, text: s.text }))

      if (sectionsPayload.length === 0) {
        alert('No content found for generation.')
        setGenerating(false)
        return
      }

      const { data: batch, error: batchError } = await supabase
        .from('audio_generation_batches')
        .insert({
          user_id: user.id,
          vision_id: activeVision.id,
          variant_ids: ['standard'],
          voice_id: selectedVoiceId,
          sections_requested: sectionsPayload,
          total_tracks_expected: sectionsPayload.length,
          status: 'pending',
          metadata: {
            source_type: 'life_vision',
            generate_all_sections: true,
            selected_sections: null,
            audio_set_name: null,
          },
        })
        .select()
        .single()

      if (batchError || !batch) { alert('Failed to create generation batch.'); setGenerating(false); return }

      setLastBatchVoiceId(selectedVoiceId)

      fetch('/api/audio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: sectionsPayload,
          voice: selectedVoiceId,
          variant: 'standard',
          batchId: batch.id,
          visionId: activeVision.id,
        }),
      }).catch(err => {
        console.error('Generation API error:', err)
      })

      await refreshBatches()
      router.push('/intensive/audio/queue')
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

  const selectedVoiceObj = voices.find(v => v.id === selectedVoiceId) || null
  const voiceSummaryValue = selectedVoiceObj?.name || selectedVoiceId

  const lastVoiceNoteLabel = useMemo(() => {
    if (!lastBatchVoiceId) return null
    const fromList = voices.find(v => v.id === lastBatchVoiceId)
    return fromList?.name ?? lastBatchVoiceId
  }, [lastBatchVoiceId, voices])

  if (visionLoading || stepAlreadyComplete === null) {
    return (
      <Container size="xl">
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  if (!activeVision) {
    return (
      <Container size="xl">
        <Card variant="glass" className="p-6 text-center">
          <p className="text-neutral-400">No Life Vision found. Please complete the Life Vision step first.</p>
        </Card>
      </Container>
    )
  }

  if (stepAlreadyComplete) {
    return (
      <Container size="xl">
        <Stack gap="lg">
          <QueueStatusBanner />

          <div className="max-w-2xl mx-auto w-full">
            {tracksLoading ? (
              <div className="flex min-h-[20vh] items-center justify-center">
                <Spinner size="lg" />
              </div>
            ) : completedTracks.length > 0 ? (
              <EmbeddedPlayer
                tracks={completedTracks}
                setIcon={<Headphones className="w-5 h-5" />}
                setName="Life Vision Audio"
                contentCategory="life_vision"
                trackCount={completedTracks.length}
              />
            ) : (
              <Card variant="glass" className="p-6 md:p-8">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#39FF14]/15 flex items-center justify-center">
                    <CheckCircle className="w-7 h-7 text-[#39FF14]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Vision Audio Generated</h3>
                    <p className="text-sm text-neutral-400 max-w-md">
                      Your Life Vision audio has been generated.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </Stack>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg" className="overflow-visible">
        <h1 className="sr-only">Generate Vision Audio</h1>

        <QueueStatusBanner />

        {/* Step 1: Select Voice */}
        <div ref={step1Ref}>
          {voicesLoading && currentStep === 1 ? (
            <div className="flex min-h-[20vh] items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : currentStep === 1 ? (
            <Card variant="glass" className="p-4 md:p-6">
              <div className="space-y-6">
                <div>
                  <div className="flex flex-col items-center text-center mb-4">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-primary-500/15 text-primary-500 text-sm font-semibold flex items-center justify-center flex-shrink-0">
                        1
                      </span>
                      <h3 className="text-lg font-semibold text-white">Select Voice</h3>
                    </div>
                    <p className="text-sm text-neutral-400">
                      Choose the voice that will narrate your Life Vision. Preview samples, then select to continue.
                    </p>
                    {lastVoiceNoteLabel && (
                      <p className="text-xs text-neutral-500 max-w-md mx-auto mt-3 leading-relaxed">
                        Last time you generated audio, you used{' '}
                        <span className="text-neutral-300 font-medium">{lastVoiceNoteLabel}</span>.
                      </p>
                    )}
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
                      const isSelected = selectedVoiceId === voice.id
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
                          onClick={() => handleVoiceSelect(voice.id)}
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
                                <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(31,31,31,0.3)" strokeWidth="2" />
                                <circle
                                  cx="18" cy="18" r="16" fill="none" stroke="#1F1F1F" strokeWidth="2"
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
              </div>
            </Card>
          ) : (
            <CompletedStepRow
              step={1}
              label="Voice"
              value={voiceSummaryValue}
              onChange={() => {
                setCurrentStep(1)
                scrollToStep(step1Ref)
              }}
            />
          )}
        </div>

        {/* Step 2: Generate */}
        {currentStep === 2 && (
          <div ref={step2Ref}>
            <Card variant="glass" className="p-4 md:p-6">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-primary-500/15 text-primary-500 text-sm font-semibold flex items-center justify-center flex-shrink-0">
                    2
                  </span>
                  <h3 className="text-lg font-semibold text-white">Generate</h3>
                </div>
                <p className="text-sm text-neutral-400 max-w-xl">
                  VIVA will narrate your Life Vision in your selected voice. Audio will be generated for each section of your vision.
                </p>
                <Button
                  variant="primary"
                  onClick={handleGenerate}
                  disabled={generating || !selectedVoiceId}
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
            </Card>
          </div>
        )}
      </Stack>
    </Container>
  )
}
