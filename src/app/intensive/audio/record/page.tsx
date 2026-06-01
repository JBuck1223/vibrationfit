'use client'

import React, { useEffect, useRef, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Container, Icon, Spinner, Stack, IntensiveStepCompleteModal, EmbeddedPlayer } from '@/lib/design-system/components'
import type { AudioTrack } from '@/lib/design-system/components/media/types'
import { useAudioStudio } from '@/components/audio-studio'
import type { VisionData } from '@/components/audio-studio'
import { CategoryGrid } from '@/lib/design-system'
import { createClient } from '@/lib/supabase/client'
import { invalidateIntensiveSnapshot } from '@/lib/intensive/intensive-snapshot'
import { MediaRecorderComponent } from '@/components/MediaRecorder'
import { CheckCircle, Headphones, Mic, Wand2, RefreshCw, SkipForward } from 'lucide-react'
import Link from 'next/link'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { useIntensiveStep } from '@/components/intensive-studio/IntensiveStepContext'

export default function IntensiveRecordAudioPage() {
  const router = useRouter()
  const { allVisions, visionLoading } = useAudioStudio()
  const { setCompletedAt } = useIntensiveStep()

  const activeVision = useMemo(
    () => allVisions.find(v => v.is_active) ?? allVisions[0] ?? null,
    [allVisions]
  )

  const [loading, setLoading] = useState(true)
  const [recordings, setRecordings] = useState<Map<string, { url: string; duration: number }>>(new Map())
  const [saving, setSaving] = useState<string | null>(null)
  const [audioSetId, setAudioSetId] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<string>('forward')
  const [creatingFullTrack, setCreatingFullTrack] = useState(false)
  const [hasFullTrack, setHasFullTrack] = useState(false)
  const [intensiveId, setIntensiveId] = useState<string | null>(null)
  const [showStepCompleteModal, setShowStepCompleteModal] = useState(false)
  const [refinedCategories, setRefinedCategories] = useState<string[]>([])
  const [stepAlreadyComplete, setStepAlreadyComplete] = useState(false)
  const [completedPlayerTracks, setCompletedPlayerTracks] = useState<AudioTrack[]>([])
  const [completedTracksLoading, setCompletedTracksLoading] = useState(false)
  const [skipping, setSkipping] = useState(false)

  const SECTION_LABELS = useMemo(() => new Map<string, string>(
    VISION_CATEGORIES.map(c => [c.key, c.label])
  ), [])
  const CANONICAL_ORDER = useMemo(() => VISION_CATEGORIES.map(c => c.key), [])

  useEffect(() => {
    let cancelled = false
    async function checkCompletion() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('voice_recording_completed, voice_recording_completed_at, voice_recording_skipped')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (cancelled) return
      if (checklist?.voice_recording_completed || checklist?.voice_recording_skipped) {
        setStepAlreadyComplete(true)
        if (checklist.voice_recording_completed_at) {
          setCompletedAt(checklist.voice_recording_completed_at)
        }
        if (checklist.voice_recording_completed) {
          loadPersonalRecordingTracks(supabase, user.id, cancelled)
        }
      }
    }
    checkCompletion()
    return () => {
      cancelled = true
      setCompletedAt(null)
    }
  }, [])

  async function loadPersonalRecordingTracks(
    supabase: ReturnType<typeof createClient>,
    userId: string,
    cancelled: boolean
  ) {
    setCompletedTracksLoading(true)
    try {
      const { data: audioSet } = await supabase
        .from('audio_sets')
        .select('id')
        .eq('user_id', userId)
        .eq('variant', 'personal')
        .eq('content_type', 'life_vision')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (cancelled || !audioSet) { setCompletedTracksLoading(false); return }

      const { data: tracks } = await supabase
        .from('audio_tracks')
        .select('id, audio_url, section_key, duration_seconds')
        .eq('audio_set_id', audioSet.id)
        .eq('status', 'completed')
        .not('audio_url', 'is', null)
        .order('section_key')

      if (cancelled) return

      const formatted: AudioTrack[] = (tracks || [])
        .filter(t => t.section_key !== 'full')
        .map(t => {
          const dur = typeof t.duration_seconds === 'number' && isFinite(t.duration_seconds) && t.duration_seconds > 0 ? t.duration_seconds : 0
          return {
            id: t.id,
            title: SECTION_LABELS.get(t.section_key) || t.section_key,
            artist: '',
            duration: dur,
            url: t.audio_url || '',
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

      setCompletedPlayerTracks(formatted)
    } catch (err) {
      console.error('Error loading personal recording tracks:', err)
    } finally {
      if (!cancelled) setCompletedTracksLoading(false)
    }
  }

  useEffect(() => {
    if (!activeVision || visionLoading) return
    loadData()
  }, [activeVision?.id, visionLoading])

  async function loadData() {
    if (!activeVision) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('intensive_id')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle()
      if (checklist) setIntensiveId(checklist.intensive_id)

      let refined: string[] = Array.isArray(activeVision?.refined_categories) ? activeVision.refined_categories : []

      const { data: existingSet } = await supabase
        .from('audio_sets')
        .select('id')
        .eq('vision_id', activeVision.id)
        .eq('variant', 'personal')
        .maybeSingle()

      let recordingMap = new Map<string, { url: string; duration: number }>()
      const sectionsWithPriorRecording = new Set<string>()

      if (existingSet) {
        setAudioSetId(existingSet.id)
        const { data: tracks } = await supabase
          .from('audio_tracks')
          .select('section_key, audio_url, duration_seconds')
          .eq('audio_set_id', existingSet.id)
          .eq('status', 'completed')

        if (tracks) {
          let fullTrackExists = false
          tracks.forEach(track => {
            if (track.section_key === 'full') {
              fullTrackExists = true
            } else {
              sectionsWithPriorRecording.add(track.section_key)
              recordingMap.set(track.section_key, { url: track.audio_url, duration: track.duration_seconds || 0 })
            }
          })
          setRecordings(recordingMap)
          setHasFullTrack(fullTrackExists)
        }
      }

      refined = refined.filter(key => sectionsWithPriorRecording.has(key))

      if (recordingMap.size === 0 && user) {
        try {
          const { data: previousSet } = await supabase
            .from('audio_sets')
            .select('id, vision_id')
            .eq('user_id', user.id)
            .eq('variant', 'personal')
            .neq('vision_id', activeVision.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (previousSet) {
            const { data: oldTracks } = await supabase
              .from('audio_tracks')
              .select('*')
              .eq('audio_set_id', previousSet.id)
              .eq('status', 'completed')

            if (oldTracks && oldTracks.length > 0) {
              const recoverable = oldTracks.filter(track => {
                if (track.section_key === 'full') return false
                const currentText = (activeVision[track.section_key] || '').trim()
                const trackText = (track.text_content || '').trim()
                return currentText.length > 0 && currentText === trackText
              })

              if (recoverable.length > 0) {
                let setId = existingSet?.id
                if (!setId) {
                  const { data: newSet } = await supabase
                    .from('audio_sets')
                    .insert({
                      vision_id: activeVision.id,
                      user_id: user.id,
                      name: 'Personal Recording',
                      description: 'Your own voice reading your vision',
                      variant: 'personal',
                      voice_id: 'user_voice',
                      is_active: true
                    })
                    .select()
                    .single()
                  if (newSet) setId = newSet.id
                }

                if (setId) {
                  setAudioSetId(setId)
                  for (const track of recoverable) {
                    const { error: insertErr } = await supabase
                      .from('audio_tracks')
                      .insert({
                        user_id: user.id,
                        vision_id: activeVision.id,
                        audio_set_id: setId,
                        section_key: track.section_key,
                        content_hash: track.content_hash,
                        text_content: track.text_content,
                        voice_id: track.voice_id,
                        s3_bucket: track.s3_bucket,
                        s3_key: track.s3_key,
                        audio_url: track.audio_url,
                        duration_seconds: track.duration_seconds,
                        status: 'completed',
                        mix_status: track.mix_status,
                        mixed_audio_url: track.mixed_audio_url,
                        mixed_s3_key: track.mixed_s3_key,
                        play_count: 0,
                        content_type: track.content_type
                      })
                    if (!insertErr) {
                      recordingMap.set(track.section_key, { url: track.audio_url, duration: track.duration_seconds || 0 })
                    }
                  }

                  const allOldSectionKeys = oldTracks.filter(t => t.section_key !== 'full').map(t => t.section_key)
                  const recoveredKeys = new Set(recoverable.map(t => t.section_key))
                  const changedSections: string[] = []
                  for (const key of allOldSectionKeys) {
                    if (!recoveredKeys.has(key)) changedSections.push(key)
                  }
                  if (changedSections.length > 0 && refined.length === 0) {
                    refined = changedSections
                  }
                  setRecordings(new Map(recordingMap))
                }
              }
            }
          }
        } catch (recoveryErr) {
          console.warn('Personal recording recovery failed (non-blocking):', recoveryErr)
        }
      }

      setRefinedCategories(refined)

      const firstNeedsReRecord = refined.length > 0
        ? VISION_CATEGORIES.find(s => refined.includes(s.key) && !recordingMap.has(s.key))
        : null
      const firstIncomplete = VISION_CATEGORIES.find(section => !recordingMap.has(section.key))
      const autoSelect = firstNeedsReRecord || firstIncomplete
      if (autoSelect) setActiveSection(autoSelect.key)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveRecording(sectionKey: string, s3Url: string, duration: number) {
    if (!activeVision) return
    setSaving(sectionKey)
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let setId = audioSetId
      if (!setId) {
        const { data: newSet, error: setError } = await supabase
          .from('audio_sets')
          .insert({
            user_id: user.id,
            vision_id: activeVision.id,
            name: 'Personal Recording',
            description: 'Your own voice reading your vision',
            variant: 'personal',
            voice_id: 'user_voice',
            is_active: true,
          })
          .select()
          .single()
        if (setError) throw setError
        setId = newSet.id
        setAudioSetId(setId)
      }

      const sectionText = (activeVision[sectionKey] || '') as string
      const contentHash = await hashContent(sectionText)
      const s3Key = s3Url.split('.com/')[1] || ''
      const validDuration = isFinite(duration) && duration > 0 ? Math.floor(duration) : 0

      const { data: oldTrack } = await supabase
        .from('audio_tracks')
        .select('audio_url')
        .eq('audio_set_id', setId)
        .eq('section_key', sectionKey)
        .maybeSingle()

      if (oldTrack?.audio_url) {
        try {
          const { deleteRecording } = await import('@/lib/services/recordingService')
          await deleteRecording(oldTrack.audio_url)
        } catch {}
      }

      await supabase
        .from('audio_tracks')
        .delete()
        .eq('audio_set_id', setId)
        .eq('section_key', sectionKey)

      const { error: trackError } = await supabase.from('audio_tracks').insert({
        user_id: user.id,
        vision_id: activeVision.id,
        audio_set_id: setId,
        section_key: sectionKey,
        content_hash: contentHash,
        text_content: sectionText,
        voice_id: 'user_voice',
        s3_bucket: 'vibrationfit-media',
        s3_key: s3Key,
        audio_url: s3Url,
        duration_seconds: validDuration,
        status: 'completed',
        mix_status: 'not_required',
      })
      if (trackError) throw trackError

      if (intensiveId && recordings.size === 0) {
        await supabase
          .from('intensive_checklist')
          .update({ voice_recording_completed: true, voice_recording_completed_at: new Date().toISOString() })
          .eq('intensive_id', intensiveId)
        invalidateIntensiveSnapshot()
        setShowStepCompleteModal(true)
      }

      setRecordings(new Map(recordings.set(sectionKey, { url: s3Url, duration })))
      const currentIndex = VISION_CATEGORIES.findIndex(s => s.key === sectionKey)
      if (currentIndex < VISION_CATEGORIES.length - 1) {
        setActiveSection(VISION_CATEGORIES[currentIndex + 1].key)
      }
    } catch (error) {
      console.error('Failed to save recording:', error)
      alert('Failed to save recording. Please try again.')
    } finally {
      setSaving(null)
    }
  }

  async function hashContent(text: string): Promise<string> {
    const normalized = text.trim().toLowerCase().replace(/\s+/g, ' ')
    const encoder = new TextEncoder()
    const data = encoder.encode(normalized)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  async function handleCreateFullTrack() {
    if (!audioSetId || !activeVision || creatingFullTrack) return
    setCreatingFullTrack(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { alert('You must be logged in'); setCreatingFullTrack(false); return }

      const { data: audioSet } = await supabase
        .from('audio_sets')
        .select('voice_id')
        .eq('id', audioSetId)
        .single()

      const response = await fetch('/api/audio/generate-full-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioSetId,
          visionId: activeVision.id,
          userId: user.id,
          voiceId: audioSet?.voice_id || 'personal-recording'
        })
      })

      if (!response.ok) throw new Error('Failed to create full track')
      setHasFullTrack(true)
      alert('Full track created successfully! You can find it in your Audio Sets.')
    } catch (error) {
      console.error('Error creating full track:', error)
      alert('Failed to create full track. Please try again.')
    } finally {
      setCreatingFullTrack(false)
    }
  }

  async function handleSkipStep() {
    setSkipping(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const now = new Date().toISOString()
      await supabase
        .from('intensive_checklist')
        .update({ voice_recording_skipped: true, voice_recording_skipped_at: now })
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])

      invalidateIntensiveSnapshot()
      router.push('/intensive/dashboard')
    } catch (error) {
      console.error('Failed to skip step:', error)
      alert('Failed to skip step. Please try again.')
    } finally {
      setSkipping(false)
    }
  }

  const completedCount = recordings.size
  const totalCount = VISION_CATEGORIES.length
  const activeSessionSection = VISION_CATEGORIES.find(s => s.key === activeSection)
  const sectionText = activeVision ? ((activeVision[activeSection] || '') as string) : ''
  const hasText = sectionText.trim().length > 0
  const isRecorded = recordings.has(activeSection)
  const allSectionsRecorded = completedCount === totalCount
  const canCreateFullTrack = allSectionsRecorded && audioSetId && !hasFullTrack
  const sectionsNeedingReRecord = refinedCategories.filter(key => !recordings.has(key))
  const activeNeedsReRecord = refinedCategories.includes(activeSection) && !isRecorded

  if (visionLoading || (loading && !activeVision)) {
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
        <Card variant="glass" className="text-center">
          <p className="text-neutral-400">No Life Vision found. Please complete the Life Vision step first.</p>
        </Card>
      </Container>
    )
  }

  if (stepAlreadyComplete && !loading && !completedTracksLoading && completedPlayerTracks.length >= VISION_CATEGORIES.length) {
    return (
      <Container size="xl">
        <Stack gap="lg">
          <div className="max-w-2xl mx-auto w-full">
            <EmbeddedPlayer
              tracks={completedPlayerTracks}
              setIcon={<Mic className="w-5 h-5" />}
              setName="Personal Recording"
              contentCategory="life_vision"
              trackCount={completedPlayerTracks.length}
            />
          </div>
        </Stack>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg" className="overflow-visible">
        <h1 className="sr-only">Record Your Voice</h1>

        {loading ? (
          <Card variant="glass" className="flex min-h-[40vh] items-center justify-center">
            <Spinner size="lg" />
          </Card>
        ) : (
          <>
          <Card variant="glass">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h3 className="text-base font-semibold text-white">This step is optional</h3>
                <p className="text-sm text-neutral-400 mt-1">
                  If you don't want to record your own voice, you can skip ahead.
                </p>
              </div>
              <Button
                onClick={handleSkipStep}
                disabled={skipping}
                variant="outline"
                size="sm"
                className="shrink-0"
              >
                <SkipForward className="w-4 h-4 mr-1.5" />
                {skipping ? 'Skipping...' : 'Skip This Step'}
              </Button>
            </div>
          </Card>

          <Card variant="glass" className="space-y-6">
            <div className="flex flex-col items-center text-center gap-1 pb-4 border-b border-neutral-800">
              <h2 className="text-lg font-semibold text-white">Record Your Vision</h2>
              <p className="w-full text-center text-sm text-neutral-400">
                Read your vision aloud in your own voice, then save each recording.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
                <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs md:text-sm font-semibold border bg-[#39FF14]/20 text-[#39FF14] border-[#39FF14]/30">
                  <Mic className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1" />
                  {completedCount} of {totalCount} recorded
                </span>
                {sectionsNeedingReRecord.length > 0 && (
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs md:text-sm font-semibold border bg-[#FFFF00]/15 text-[#FFFF00] border-[#FFFF00]/30">
                    <RefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1" />
                    {sectionsNeedingReRecord.length} updated
                  </span>
                )}
                {canCreateFullTrack && (
                  <Button onClick={handleCreateFullTrack} variant="primary" size="sm" disabled={creatingFullTrack} className="flex items-center gap-2">
                    {creatingFullTrack ? (
                      <><Spinner size="sm" className="w-4 h-4" /><span>Creating...</span></>
                    ) : (
                      <><Wand2 className="w-4 h-4" /><span>Create Full Track</span></>
                    )}
                  </Button>
                )}
              </div>

              {sectionsNeedingReRecord.length > 0 && (
                <Card className="p-4 border-[#FFFF00]/30 bg-[#FFFF00]/5">
                  <div className="flex items-start gap-3">
                    <RefreshCw className="w-5 h-5 text-[#FFFF00] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#FFFF00]">
                        {sectionsNeedingReRecord.length} section{sectionsNeedingReRecord.length > 1 ? 's' : ''} updated since your last recording
                      </p>
                      <p className="text-xs text-neutral-400 mt-1">
                        Your unchanged recordings were carried over. Record the updated sections below.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              <div className="min-w-0 w-full">
                <CategoryGrid
                  categories={VISION_CATEGORIES}
                  activeCategory={activeSection}
                  completedCategories={Array.from(recordings.keys())}
                  refinedCategories={refinedCategories}
                  onCategoryClick={(key) => setActiveSection(key)}
                  mode={refinedCategories.length > 0 ? 'record' : 'completion'}
                  lifeVisionCategoryStrip
                  title="Select Section to Record"
                  pillLabel="scroll"
                />
              </div>

              {activeSessionSection && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-neutral-700/50 bg-neutral-900/40 px-4 pb-4 pt-4 md:px-6 md:pb-6 md:pt-5">
                    <div className="mb-2 flex flex-col items-center gap-2 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-3">
                      <div className="hidden min-w-0 md:block" aria-hidden="true" />
                      <div className="flex min-w-0 items-center justify-center gap-3">
                        <div className="shrink-0">
                          <Icon
                            icon={activeSessionSection.icon}
                            size="xs"
                            color={activeNeedsReRecord ? '#FFFF00' : isRecorded ? '#39FF14' : '#39FF14'}
                          />
                        </div>
                        <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-[0.25em] text-center md:text-left">
                          {activeSessionSection.label}
                        </h3>
                      </div>
                      <div className="flex w-full shrink-0 items-center justify-center gap-2 md:w-auto md:justify-end">
                        {isRecorded && (
                          <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-black" />
                          </div>
                        )}
                        {activeNeedsReRecord && (
                          <div className="w-12 h-12 rounded-full bg-[#FFFF00]/20 border-2 border-[#FFFF00]/40 flex items-center justify-center">
                            <RefreshCw className="w-6 h-6 text-[#FFFF00]" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-b border-neutral-800 mb-4" />

                    {activeNeedsReRecord && (
                      <div className="mt-4 p-3 rounded-lg bg-[#FFFF00]/5 border border-[#FFFF00]/20">
                        <p className="text-xs text-[#FFFF00]/80">
                          This section was updated during your last refinement. Record the new version below.
                        </p>
                      </div>
                    )}

                    {!hasText ? (
                      <div className="mt-6 p-8 bg-neutral-800/30 border border-neutral-700 border-dashed rounded-lg text-center">
                        <p className="text-neutral-400 mb-4">No vision text for this section yet.</p>
                        <Button asChild variant="primary" size="md">
                          <Link href={`/intensive/life-vision/create`}>
                            Add your vision first
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-6 max-h-[400px] overflow-y-auto">
                        <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">{sectionText}</p>
                      </div>
                    )}
                  </div>

                  {hasText && (
                    <MediaRecorderComponent
                      mode="audio"
                      recordingPurpose="audioOnly"
                      category={activeSection}
                      storageFolder="lifeVisionAudioRecordings"
                      onRecordingComplete={async (blob, transcript, shouldSave, s3Url) => {
                        if (s3Url && shouldSave) {
                          try {
                            const blobUrl = URL.createObjectURL(blob)
                            const audio = new Audio(blobUrl)
                            await new Promise<void>((resolve, reject) => {
                              audio.addEventListener('loadedmetadata', () => resolve())
                              audio.addEventListener('error', () => reject(new Error('Failed to load audio metadata')))
                              audio.load()
                            })
                            const dur = audio.duration
                            URL.revokeObjectURL(blobUrl)
                            await handleSaveRecording(activeSection, s3Url, dur)
                          } catch {
                            await handleSaveRecording(activeSection, s3Url, 0)
                          }
                        }
                      }}
                      enableEditor={true}
                      instanceId={activeSection}
                      className="w-full"
                    />
                  )}
                </div>
              )}

              {completedCount === totalCount && (
                <Card className="p-8 text-center bg-gradient-to-br from-primary-500/10 to-transparent border-2 border-primary-500/30">
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-500/20 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-primary-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">All Sections Recorded!</h3>
                    <p className="text-neutral-400 mb-6">Your personal voice version is complete. Ready to listen?</p>
                    <Button onClick={() => router.push('/intensive/audio')} variant="primary" size="lg">
                      <Headphones className="w-5 h-5 mr-2" />
                      Listen to Your Recording
                    </Button>
                  </div>
                </Card>
              )}

              <IntensiveStepCompleteModal
                isOpen={showStepCompleteModal}
                onClose={() => setShowStepCompleteModal(false)}
                stepId="record_audio"
              />
            </div>
          </Card>
          </>
        )}
      </Stack>
    </Container>
  )
}
