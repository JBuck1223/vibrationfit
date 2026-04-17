"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Container, StatusBadge, Icon, Spinner, Stack, IntensiveStepCompleteModal, PageHero } from '@/lib/design-system/components'
import { useAudioStudio, AudioSourceSelector } from '@/components/audio-studio'
import type { AudioSourceSelection } from '@/components/audio-studio'
import type { VisionData } from '@/components/audio-studio'
import type { Story } from '@/lib/stories/types'
import { CategoryGrid } from '@/lib/design-system'
import { createClient } from '@/lib/supabase/client'
import { MediaRecorderComponent } from '@/components/MediaRecorder'
import { CheckCircle, Headphones, Mic, Wand2, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'

const VISION_SECTIONS = [
  { key: 'forward', label: 'Forward', description: 'Your opening vision statement', order: 0, icon: Mic },
  ...VISION_CATEGORIES.filter(c => c.order > 0 && c.order < 13).map(c => ({
    key: c.key,
    label: c.label,
    description: c.description,
    order: c.order,
    icon: c.icon
  })),
  { key: 'conclusion', label: 'Conclusion', description: 'Your vision conclusion', order: 14, icon: Mic },
]

export default function RecordVisionAudioPage() {
  const router = useRouter()
  const { sourceType, sourceId } = useAudioStudio()

  // Source selection
  const [selectedSource, setSelectedSource] = useState<AudioSourceSelection | null>(null)
  const selectedVision = selectedSource?.vision || null
  const selectedStory = selectedSource?.story || null
  const activeSourceType = selectedSource?.sourceType || null
  const activeSourceId = selectedSource?.sourceId || null

  const [loading, setLoading] = useState(false)
  const [recordings, setRecordings] = useState<Map<string, { url: string; duration: number }>>(new Map())
  const [saving, setSaving] = useState<string | null>(null)
  const [audioSetId, setAudioSetId] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<string>('forward')
  const [creatingFullTrack, setCreatingFullTrack] = useState(false)
  const [hasFullTrack, setHasFullTrack] = useState(false)
  const [intensiveId, setIntensiveId] = useState<string | null>(null)
  const [showStepCompleteModal, setShowStepCompleteModal] = useState(false)
  const [refinedCategories, setRefinedCategories] = useState<string[]>([])
  // Story recording state
  const [storyRecording, setStoryRecording] = useState<{ url: string; duration: number } | null>(null)

  function handleSourceSelected(selection: AudioSourceSelection) {
    setSelectedSource(selection)
    setRecordings(new Map())
    setStoryRecording(null)
    setAudioSetId(null)
    setHasFullTrack(false)
    setRefinedCategories([])
    setLoading(true)
  }

  useEffect(() => {
    if (!selectedSource) return
    loadData()
  }, [selectedSource?.sourceId])

  async function loadData() {
    if (!activeSourceId) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (activeSourceType === 'life_vision' && selectedVision) {
      if (user) {
        const { data: checklist } = await supabase
          .from('intensive_checklist')
          .select('intensive_id')
          .eq('user_id', user.id)
          .in('status', ['pending', 'in_progress'])
          .maybeSingle()
        if (checklist) setIntensiveId(checklist.intensive_id)
      }

      let refined: string[] = Array.isArray(selectedVision?.refined_categories) ? selectedVision.refined_categories : []
      setRefinedCategories(refined)

      const { data: existingSet } = await supabase
        .from('audio_sets')
        .select('id')
        .eq('vision_id', activeSourceId)
        .eq('variant', 'personal')
        .maybeSingle()

      let recordingMap = new Map<string, { url: string; duration: number }>()

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
              recordingMap.set(track.section_key, { url: track.audio_url, duration: track.duration_seconds || 0 })
            }
          })
          setRecordings(recordingMap)
          setHasFullTrack(fullTrackExists)
        }
      }

      // Recovery logic for previous vision versions
      if (recordingMap.size === 0 && user && selectedVision) {
        try {
          const { data: previousSet } = await supabase
            .from('audio_sets')
            .select('id, vision_id')
            .eq('user_id', user.id)
            .eq('variant', 'personal')
            .neq('vision_id', activeSourceId)
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
                const currentText = (selectedVision[track.section_key] || '').trim()
                const trackText = (track.text_content || '').trim()
                return currentText.length > 0 && currentText === trackText
              })

              if (recoverable.length > 0) {
                let setId = existingSet?.id
                if (!setId) {
                  const { data: newSet } = await supabase
                    .from('audio_sets')
                    .insert({
                      vision_id: activeSourceId,
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
                        vision_id: activeSourceId,
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
                    setRefinedCategories(changedSections)
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

      const firstNeedsReRecord = refined.length > 0
        ? VISION_SECTIONS.find(s => refined.includes(s.key) && !recordingMap.has(s.key))
        : null
      const firstIncomplete = VISION_SECTIONS.find(section => !recordingMap.has(section.key))
      const autoSelect = firstNeedsReRecord || firstIncomplete
      if (autoSelect) setActiveSection(autoSelect.key)
    } else if (activeSourceType === 'story' && selectedStory && user) {
      // Check for existing story recording
      const { data: existingSet } = await supabase
        .from('audio_sets')
        .select('id')
        .eq('content_type', 'story')
        .eq('content_id', activeSourceId)
        .eq('variant', 'personal')
        .maybeSingle()

      if (existingSet) {
        setAudioSetId(existingSet.id)
        const { data: tracks } = await supabase
          .from('audio_tracks')
          .select('audio_url, duration_seconds')
          .eq('audio_set_id', existingSet.id)
          .eq('status', 'completed')
          .limit(1)
          .maybeSingle()
        if (tracks) {
          setStoryRecording({ url: tracks.audio_url, duration: tracks.duration_seconds || 0 })
        }
      }
    }

    setLoading(false)
  }

  async function handleSaveRecording(sectionKey: string, s3Url: string, duration: number) {
    setSaving(sectionKey)
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let setId = audioSetId
      if (!setId) {
        const insertData: any = {
          user_id: user.id,
          name: 'Personal Recording',
          description: activeSourceType === 'story' ? 'Your own voice reading this story' : 'Your own voice reading your vision',
          variant: 'personal',
          voice_id: 'user_voice',
          is_active: true,
        }
        if (activeSourceType === 'life_vision') {
          insertData.vision_id = activeSourceId
        } else if (activeSourceType === 'story') {
          insertData.content_type = 'story'
          insertData.content_id = activeSourceId
        }

        const { data: newSet, error: setError } = await supabase
          .from('audio_sets')
          .insert(insertData)
          .select()
          .single()
        if (setError) throw setError
        setId = newSet.id
        setAudioSetId(setId)
      }

      const sectionText = getSectionText(sectionKey)
      const contentHash = await hashContent(sectionText)
      const s3Key = s3Url.split('.com/')[1] || ''
      const validDuration = isFinite(duration) && duration > 0 ? Math.floor(duration) : 0

      // Delete existing track for this section
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

      const trackInsert: any = {
        user_id: user.id,
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
      }

      if (activeSourceType === 'life_vision') {
        trackInsert.vision_id = activeSourceId
      } else if (activeSourceType === 'story') {
        trackInsert.content_type = 'story'
      }

      const { error: trackError } = await supabase.from('audio_tracks').insert(trackInsert)
      if (trackError) throw trackError

      if (activeSourceType === 'life_vision') {
        if (intensiveId && recordings.size === 0) {
          await supabase
            .from('intensive_checklist')
            .update({ voice_recording_completed: true, voice_recording_completed_at: new Date().toISOString() })
            .eq('intensive_id', intensiveId)
          setShowStepCompleteModal(true)
        }

        setRecordings(new Map(recordings.set(sectionKey, { url: s3Url, duration })))
        const currentIndex = VISION_SECTIONS.findIndex(s => s.key === sectionKey)
        if (currentIndex < VISION_SECTIONS.length - 1) {
          setActiveSection(VISION_SECTIONS[currentIndex + 1].key)
        }
      } else if (activeSourceType === 'story') {
        setStoryRecording({ url: s3Url, duration: validDuration })
      }

    } catch (error) {
      console.error('Failed to save recording:', error)
      alert('Failed to save recording. Please try again.')
    } finally {
      setSaving(null)
    }
  }

  function getSectionText(sectionKey: string): string {
    if (activeSourceType === 'life_vision' && selectedVision) {
      return selectedVision[sectionKey] || ''
    } else if (activeSourceType === 'story' && selectedStory) {
      return selectedStory.content || ''
    }
    return ''
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
    if (!audioSetId || !activeSourceId || creatingFullTrack) return
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
          visionId: activeSourceType === 'life_vision' ? activeSourceId : undefined,
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

  // Vision recording state
  const completedCount = recordings.size
  const totalCount = VISION_SECTIONS.length
  const activeSessionSection = VISION_SECTIONS.find(s => s.key === activeSection)
  const sectionText = activeSourceType === 'life_vision' ? getSectionText(activeSection) : ''
  const hasText = sectionText.trim().length > 0
  const isRecorded = recordings.has(activeSection)
  const allSectionsRecorded = completedCount === totalCount
  const canCreateFullTrack = allSectionsRecorded && audioSetId && !hasFullTrack
  const sectionsNeedingReRecord = refinedCategories.filter(key => !recordings.has(key))
  const activeNeedsReRecord = refinedCategories.includes(activeSection) && !isRecorded

  return (
    <Container size="xl" className="py-6">
      <Stack gap="lg">
        <PageHero
          title="Record Audio"
          subtitle="Read your Life Vision or Story aloud and create a personal voice recording."
        />

        {/* Source Selector */}
        <AudioSourceSelector
          onSourceSelected={handleSourceSelected}
          initialSourceType={sourceType}
          initialSourceId={sourceId}
        />

      {loading && (
        <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      )}

      {/* Life Vision Recording Flow */}
      {selectedSource && !loading && activeSourceType === 'life_vision' && selectedVision && (
        <>
          {/* Stats Bar */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-neutral-900/60 border border-neutral-700/50">
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
            <Card className="mb-6 p-4 border-[#FFFF00]/30 bg-[#FFFF00]/5">
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

          <div className="mb-6">
            <div className="mb-4 text-center">
              <h3 className="text-lg font-semibold text-white mb-1">Select Section to Record</h3>
              <p className="text-sm text-neutral-400">
                Recording {VISION_SECTIONS.findIndex(s => s.key === activeSection) + 1} of {VISION_SECTIONS.length}
                {completedCount > 0 && (
                  <span className="ml-2 text-[#39FF14]">
                    • {completedCount} completed
                  </span>
                )}
              </p>
            </div>
            <CategoryGrid
              categories={VISION_SECTIONS}
              activeCategory={activeSection}
              completedCategories={Array.from(recordings.keys())}
              refinedCategories={refinedCategories}
              onCategoryClick={(key) => setActiveSection(key)}
              layout="14-column"
              mode={refinedCategories.length > 0 ? 'record' : 'completion'}
              variant="outlined"
              withCard={true}
            />
          </div>

          {activeSessionSection && (
            <div>
              <Card className="p-6 md:p-8 mb-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary-500">
                      <Icon icon={activeSessionSection.icon} size="sm" color="#000000" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-white">{activeSessionSection.label}</h2>
                      <p className="text-sm text-neutral-400">{activeSessionSection.description}</p>
                    </div>
                  </div>
                  {isRecorded && (
                    <div className="ml-4">
                      <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-black" />
                      </div>
                    </div>
                  )}
                  {activeNeedsReRecord && (
                    <div className="ml-4">
                      <div className="w-12 h-12 rounded-full bg-[#FFFF00]/20 border-2 border-[#FFFF00]/40 flex items-center justify-center">
                        <RefreshCw className="w-6 h-6 text-[#FFFF00]" />
                      </div>
                    </div>
                  )}
                </div>

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
                      <Link href={activeSourceId ? `/life-vision/${activeSourceId}` : '/life-vision'}>
                        Add your vision first
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="mt-6">
                    <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg overflow-hidden">
                      <div className="flex items-center gap-2 p-4 pb-3 border-b border-neutral-700">
                        <span className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">Your Vision Text:</span>
                        <span className="text-xs text-neutral-400">({sectionText.length} characters)</span>
                      </div>
                      <div className="p-4 max-h-[400px] overflow-y-auto">
                        <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">{sectionText}</p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

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
            <Card className="mt-8 p-8 text-center bg-gradient-to-br from-primary-500/10 to-transparent border-2 border-primary-500/30">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-500/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-primary-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">All Sections Recorded!</h3>
                <p className="text-neutral-400 mb-6">Your personal voice version is complete. Ready to listen?</p>
                <Button onClick={() => router.push('/audio')} variant="primary" size="lg">
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
        </>
      )}

      {/* Story Recording Flow */}
      {selectedSource && !loading && activeSourceType === 'story' && selectedStory && (
        <>
          <Card className="p-6 md:p-8 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-white mb-1">{selectedStory.title || 'Story Recording'}</h2>
                <p className="text-sm text-neutral-400">
                  {selectedStory.word_count?.toLocaleString() || 0} words
                </p>
              </div>
              {storyRecording && (
                <div className="ml-4">
                  <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-black" />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg overflow-hidden mb-6">
              <div className="flex items-center gap-2 p-4 pb-3 border-b border-neutral-700">
                <span className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">Story Text</span>
              </div>
              <div className="p-4 max-h-[400px] overflow-y-auto">
                <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedStory.content}
                </p>
              </div>
            </div>
          </Card>

          <MediaRecorderComponent
            mode="audio"
            recordingPurpose="audioOnly"
            category="story"
            storageFolder="storyAudioRecordings"
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
                  await handleSaveRecording('full', s3Url, dur)
                } catch {
                  await handleSaveRecording('full', s3Url, 0)
                }
              }
            }}
            enableEditor={true}
            instanceId="story-recording"
            className="w-full"
          />

          {storyRecording && (
            <Card className="mt-8 p-8 text-center bg-gradient-to-br from-primary-500/10 to-transparent border-2 border-primary-500/30">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-500/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-primary-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Story Recorded!</h3>
                <p className="text-neutral-400 mb-6">Your personal voice recording is saved.</p>
                <Button onClick={() => router.push('/audio')} variant="primary" size="lg">
                  <Headphones className="w-5 h-5 mr-2" />
                  Listen Now
                </Button>
              </div>
            </Card>
          )}
        </>
      )}
    </Stack>
    </Container>
  )
}
