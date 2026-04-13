"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Container, StatusBadge, Icon, Spinner, Stack, IntensiveStepCompleteModal } from '@/lib/design-system/components'
import { useAudioStudio } from '@/components/audio-studio'
import { CategoryGrid } from '@/lib/design-system'
import { createClient } from '@/lib/supabase/client'
import { MediaRecorderComponent } from '@/components/MediaRecorder'
import { CheckCircle, Headphones, Mic, Wand2, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'

// Add meta sections (intro/outro) to the vision categories for audio recording
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
  const { visionId, vision, visionLoading } = useAudioStudio()
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

  useEffect(() => {
    if (!visionId || visionLoading) return
    loadData()
  }, [visionId, visionLoading])

  async function loadData() {
    if (!visionId) return
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: checklist } = await supabase
        .from('intensive_checklist')
        .select('intensive_id')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle()
      if (checklist) {
        setIntensiveId(checklist.intensive_id)
      }
    }

    let refined: string[] = Array.isArray(vision?.refined_categories)
      ? vision.refined_categories
      : []
    setRefinedCategories(refined)

    // Check for existing "Personal Recording" audio set
    const { data: existingSet } = await supabase
      .from('audio_sets')
      .select('id')
      .eq('vision_id', visionId)
      .eq('variant', 'personal')
      .maybeSingle()

    let recordingMap = new Map()
    
    if (existingSet) {
      setAudioSetId(existingSet.id)
      
      // Load existing recordings
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
            recordingMap.set(track.section_key, {
              url: track.audio_url,
              duration: track.duration_seconds || 0
            })
          }
        })
        
        setRecordings(recordingMap)
        setHasFullTrack(fullTrackExists)
      }
    }

    // Recovery: if no personal recordings on this vision, look for them on previous versions
    if (recordingMap.size === 0 && user && vision) {
      try {
        const { data: previousSet } = await supabase
          .from('audio_sets')
          .select('id, vision_id')
          .eq('user_id', user.id)
          .eq('variant', 'personal')
          .neq('vision_id', visionId)
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
            // Pre-scan: only recover tracks whose text still matches the current vision
            const recoverable = oldTracks.filter(track => {
              if (track.section_key === 'full') return false
              const currentText = (vision[track.section_key] || '').trim()
              const trackText = (track.text_content || '').trim()
              return currentText.length > 0 && currentText === trackText
            })

            if (recoverable.length > 0) {
              // Reuse existing empty set or create a new one
              let setId = existingSet?.id
              if (!setId) {
                const { data: newSet } = await supabase
                  .from('audio_sets')
                  .insert({
                    vision_id: visionId,
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
                const changedSections: string[] = []

                for (const track of recoverable) {
                  const { error: insertErr } = await supabase
                    .from('audio_tracks')
                    .insert({
                      user_id: user.id,
                      vision_id: visionId,
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
                    recordingMap.set(track.section_key, {
                      url: track.audio_url,
                      duration: track.duration_seconds || 0
                    })
                  }
                }

                // Determine which sections changed (had old recordings but text no longer matches)
                const allOldSectionKeys = oldTracks
                  .filter(t => t.section_key !== 'full')
                  .map(t => t.section_key)
                const recoveredKeys = new Set(recoverable.map(t => t.section_key))
                for (const key of allOldSectionKeys) {
                  if (!recoveredKeys.has(key)) changedSections.push(key)
                }

                // If we detected changed sections, surface them as needing re-recording
                if (changedSections.length > 0 && refined.length === 0) {
                  refined = changedSections
                  setRefinedCategories(changedSections)
                }

                setRecordings(new Map(recordingMap))
                console.log(`Recovered ${recordingMap.size} personal recordings from previous vision, ${changedSections.length} sections need re-recording`)
              }
            }
          }
        }
      } catch (recoveryErr) {
        console.warn('Personal recording recovery failed (non-blocking):', recoveryErr)
      }
    }
    
    // Auto-select: prioritize sections needing re-recording, then first incomplete
    const firstNeedsReRecord = refined.length > 0
      ? VISION_SECTIONS.find(s => refined.includes(s.key) && !recordingMap.has(s.key))
      : null
    const firstIncomplete = VISION_SECTIONS.find(section => !recordingMap.has(section.key))
    const autoSelect = firstNeedsReRecord || firstIncomplete
    if (autoSelect) {
      setActiveSection(autoSelect.key)
    }

    setLoading(false)
  }

  async function handleSaveRecording(sectionKey: string, s3Url: string, duration: number) {
    setSaving(sectionKey)
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create audio set if it doesn't exist
      let setId = audioSetId
      if (!setId) {
        const { data: newSet, error: setError } = await supabase
          .from('audio_sets')
          .insert({
            vision_id: visionId,
            user_id: user.id,
            name: 'Personal Recording',
            description: 'Your own voice reading your vision',
            variant: 'personal',
            voice_id: 'user_voice',
            is_active: true
          })
          .select()
          .single()

        if (setError) throw setError
        setId = newSet.id
        setAudioSetId(setId)
      }

      // Get section text from vision
      const sectionText = getSectionText(sectionKey)
      
      // Create content hash
      const contentHash = await hashContent(sectionText)

      // Extract S3 key from URL
      const s3Key = s3Url.split('.com/')[1] || ''

      // Ensure duration is valid (not NaN, Infinity, or negative)
      const validDuration = isFinite(duration) && duration > 0 ? Math.floor(duration) : 0
      
      console.log('💾 Saving audio track:', {
        section_key: sectionKey,
        duration: duration,
        validDuration: validDuration,
        s3Url: s3Url
      })

      // For personal recordings, delete any existing recording for this section first
      // This ensures we always replace, even if the text content changed
      
      // First, get the old recording to delete its S3 file
      const { data: oldTrack } = await supabase
        .from('audio_tracks')
        .select('audio_url')
        .eq('vision_id', visionId)
        .eq('audio_set_id', setId)
        .eq('section_key', sectionKey)
        .maybeSingle()

      if (oldTrack?.audio_url) {
        // Delete old S3 file
        try {
          const { deleteRecording } = await import('@/lib/services/recordingService')
          await deleteRecording(oldTrack.audio_url)
          console.log('🗑️ Deleted old recording from S3:', oldTrack.audio_url)
        } catch (deleteErr) {
          console.warn('⚠️ Could not delete old S3 file:', deleteErr)
          // Continue anyway - not critical
        }
      }

      // Delete the database record
      const { error: deleteError } = await supabase
        .from('audio_tracks')
        .delete()
        .eq('vision_id', visionId)
        .eq('audio_set_id', setId)
        .eq('section_key', sectionKey)

      if (deleteError) {
        console.warn('⚠️ Could not delete old recording record (may not exist):', deleteError)
        // Continue anyway - this might be the first recording
      }

      // Insert the new recording
      const { error: trackError } = await supabase
        .from('audio_tracks')
        .insert({
          user_id: user.id,
          vision_id: visionId,
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
          mix_status: 'not_required'
        })

      if (trackError) throw trackError

      // Mark Step 8 complete on intensive checklist (first recording is sufficient)
      if (intensiveId && recordings.size === 0) {
        await supabase
          .from('intensive_checklist')
          .update({
            voice_recording_completed: true,
            voice_recording_completed_at: new Date().toISOString()
          })
          .eq('intensive_id', intensiveId)
        setShowStepCompleteModal(true)
      }

      // Update local state
      setRecordings(new Map(recordings.set(sectionKey, { url: s3Url, duration })))

      // Auto-advance to next section if not last
      const currentIndex = VISION_SECTIONS.findIndex(s => s.key === sectionKey)
      if (currentIndex < VISION_SECTIONS.length - 1) {
        setActiveSection(VISION_SECTIONS[currentIndex + 1].key)
      }

    } catch (error) {
      console.error('Failed to save recording:', error)
      alert('Failed to save recording. Please try again.')
    } finally {
      setSaving(null)
    }
  }

  function getSectionText(sectionKey: string): string {
    if (!vision) return ''
    return vision[sectionKey] || ''
  }

  async function hashContent(text: string): Promise<string> {
    const normalized = text.trim().toLowerCase().replace(/\s+/g, ' ')
    const encoder = new TextEncoder()
    const data = encoder.encode(normalized)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  const completedCount = recordings.size
  const totalCount = VISION_SECTIONS.length
  const activeSessionSection = VISION_SECTIONS.find(s => s.key === activeSection)
  const sectionText = getSectionText(activeSection)
  const hasText = sectionText.trim().length > 0
  const isRecorded = recordings.has(activeSection)
  const allSectionsRecorded = completedCount === totalCount
  const canCreateFullTrack = allSectionsRecorded && audioSetId && !hasFullTrack

  const sectionsNeedingReRecord = refinedCategories.filter(key => !recordings.has(key))
  const activeNeedsReRecord = refinedCategories.includes(activeSection) && !isRecorded
  const hasCarriedOverRecordings = refinedCategories.length > 0 && completedCount > 0

  async function handleCreateFullTrack() {
    if (!audioSetId || !visionId || creatingFullTrack) return

    setCreatingFullTrack(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('You must be logged in')
        setCreatingFullTrack(false)
        return
      }

      // Get voice ID from audio set
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
          visionId,
          userId: user.id,
          voiceId: audioSet?.voice_id || 'personal-recording'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create full track')
      }

      const result = await response.json()
      console.log('✅ Full track created:', result)
      
      setHasFullTrack(true)
      alert('Full track created successfully! You can find it in your Audio Sets.')
      
    } catch (error) {
      console.error('Error creating full track:', error)
      alert('Failed to create full track. Please try again.')
    } finally {
      setCreatingFullTrack(false)
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
    <Container size="xl" className="py-6">
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
          <Button
            onClick={handleCreateFullTrack}
            variant="primary"
            size="sm"
            disabled={creatingFullTrack}
            className="flex items-center gap-2"
          >
            {creatingFullTrack ? (
              <><Spinner size="sm" className="w-4 h-4" /><span>Creating...</span></>
            ) : (
              <><Wand2 className="w-4 h-4" /><span>Create Full Track</span></>
            )}
          </Button>
        )}
      </div>

      {/* Re-recording banner */}
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

      {/* Category Selection Bar */}
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

      {/* Recording Section */}
      {activeSessionSection && (
        <div>
          {/* Section Header Card */}
          <Card className="p-6 md:p-8 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary-500">
                  <Icon 
                    icon={activeSessionSection.icon} 
                    size="sm" 
                    color="#000000"
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-white">
                    {activeSessionSection.label}
                  </h2>
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
                <p className="text-neutral-400 mb-4">
                  No vision text for this section yet.
                </p>
                <Button
                  asChild
                  variant="primary"
                  size="md"
                >
                  <Link href={visionId ? `/life-vision/${visionId}` : '/life-vision'}>
                    Add your vision first
                  </Link>
                </Button>
              </div>
            ) : (
              /* Vision Text Display - Scrollable */
              <div className="mt-6">
                <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 p-4 pb-3 border-b border-neutral-700">
                    <span className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                      Your Vision Text:
                    </span>
                    <span className="text-xs text-neutral-400">
                      ({sectionText.length} characters)
                    </span>
                  </div>
                  <div className="p-4 max-h-[400px] overflow-y-auto">
                    <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {sectionText}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Recorder - Outside Card so sticky works */}
          {hasText && (
            <MediaRecorderComponent
                mode="audio"
                recordingPurpose="audioOnly"
                category={activeSection}
                storageFolder="lifeVisionAudioRecordings"
                onRecordingComplete={async (blob, transcript, shouldSave, s3Url) => {
                  if (s3Url && shouldSave) {
                    // Get duration from the blob using Promise to wait for metadata
                    try {
                      const blobUrl = URL.createObjectURL(blob)
                      const audio = new Audio(blobUrl)
                      
                      // Wait for metadata to load
                      await new Promise<void>((resolve, reject) => {
                        audio.addEventListener('loadedmetadata', () => resolve())
                        audio.addEventListener('error', () => reject(new Error('Failed to load audio metadata')))
                        audio.load()
                      })
                      
                      const duration = audio.duration
                      console.log('📊 Audio duration detected:', duration, 'seconds')
                      
                      // Clean up blob URL
                      URL.revokeObjectURL(blobUrl)
                      
                      await handleSaveRecording(activeSection, s3Url, duration)
                    } catch (error) {
                      console.error('❌ Error getting audio duration:', error)
                      // Fallback: save with 0 duration (better than not saving at all)
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

      {/* Completion CTA */}
      {completedCount === totalCount && (
        <Card className="mt-8 p-8 text-center bg-gradient-to-br from-primary-500/10 to-transparent border-2 border-primary-500/30">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-500/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">All Sections Recorded!</h3>
            <p className="text-neutral-400 mb-6">
              Your personal voice version is complete. Ready to listen?
            </p>
            <Button
              onClick={() => router.push('/audio/listen')}
              variant="primary"
              size="lg"
            >
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
    </Container>
  )
}
