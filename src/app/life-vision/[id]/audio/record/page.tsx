"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Container, StatusBadge, Icon, Spinner } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { MediaRecorderComponent } from '@/components/MediaRecorder'
import { CheckCircle, Eye, Headphones, Mic, Check } from 'lucide-react'
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

export default function RecordVisionAudioPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [visionId, setVisionId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [vision, setVision] = useState<any>(null)
  const [recordings, setRecordings] = useState<Map<string, { url: string; duration: number }>>(new Map())
  const [saving, setSaving] = useState<string | null>(null)
  const [audioSetId, setAudioSetId] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<string>('forward')

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

  async function loadData() {
    const supabase = createClient()

    // Load vision
    const { data: v } = await supabase
      .from('vision_versions')
      .select('*')
      .eq('id', visionId)
      .single()
    
    // Calculate correct version number
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

    // Check for existing "Personal Recording" audio set
    const { data: existingSet } = await supabase
      .from('audio_sets')
      .select('id')
      .eq('vision_id', visionId)
      .eq('variant', 'personal')
      .maybeSingle()

    if (existingSet) {
      setAudioSetId(existingSet.id)
      
      // Load existing recordings
      const { data: tracks } = await supabase
        .from('audio_tracks')
        .select('section_key, audio_url, duration_seconds')
        .eq('audio_set_id', existingSet.id)
        .eq('status', 'completed')

      if (tracks) {
        const recordingMap = new Map()
        tracks.forEach(track => {
          recordingMap.set(track.section_key, {
            url: track.audio_url,
            duration: track.duration_seconds || 0
          })
        })
        setRecordings(recordingMap)
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

      // Save to audio_tracks
      const { error: trackError } = await supabase
        .from('audio_tracks')
        .upsert({
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
          duration_seconds: Math.floor(duration),
          status: 'completed',
          mix_status: 'not_required'
        }, {
          onConflict: 'vision_id,audio_set_id,section_key,content_hash'
        })

      if (trackError) throw trackError

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

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl">
      {/* Header */}
      <div className="mb-8">
        <div className="relative p-[2px] rounded-2xl bg-gradient-to-br from-[#39FF14]/30 via-[#14B8A6]/20 to-[#BF00FF]/30">
          <div className="relative p-4 md:p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-[#39FF14]/10 via-[#14B8A6]/5 to-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="relative z-10">
              {/* Eyebrow */}
              <div className="text-center mb-4">
                <div className="text-[10px] md:text-xs uppercase tracking-[0.35em] text-primary-500/80 font-semibold">
                  RECORD YOUR VISION
                </div>
              </div>
              
              {/* Title Section */}
              <div className="text-center mb-4">
                <h1 className="text-2xl md:text-5xl font-bold leading-tight text-white">
                  Personal Voice Recording
                </h1>
                <p className="text-sm md:text-base text-neutral-400 mt-2">
                  Read your Life Vision in your own voice
                </p>
              </div>
              
              {/* Stats */}
              {vision && (
                <div className="flex justify-center mb-4">
                  <div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-neutral-900/60 border border-neutral-700/50 backdrop-blur-sm">
                    <span className="w-7 h-7 flex items-center justify-center bg-[#39FF14] text-black rounded-full text-xs font-semibold">
                      V{vision.version_number}
                    </span>
                    <StatusBadge status="active" subtle={false} showIcon={false} className="uppercase tracking-[0.25em]" />
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs md:text-sm font-semibold border bg-[#39FF14]/20 text-[#39FF14] border-[#39FF14]/30">
                      <Mic className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1" />
                      {completedCount} of {totalCount} recorded
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-row flex-wrap lg:flex-nowrap gap-2 md:gap-4 max-w-2xl mx-auto">
                <Button
                  onClick={() => router.push(`/life-vision/${visionId}`)}
                  variant="outline"
                  size="sm"
                  className="flex-1 flex items-center justify-center gap-1 md:gap-2"
                >
                  <Eye className="w-4 h-4 shrink-0" />
                  <span>View Vision</span>
                </Button>
                
                <Button
                  onClick={() => router.push(`/life-vision/${visionId}/audio`)}
                  variant="outline"
                  size="sm"
                  className="flex-1 flex items-center justify-center gap-1 md:gap-2"
                >
                  <Headphones className="w-4 h-4 shrink-0" />
                  <span>Audio Sets</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Selection Bar */}
      <div className="mb-6">
        <Card>
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

          {/* Category Grid */}
          <div className="grid grid-cols-4 md:grid-cols-7 lg:[grid-template-columns:repeat(14,minmax(0,1fr))] gap-1">
            {VISION_SECTIONS.map((section) => {
              const IconComponent = section.icon
              const isCompleted = recordings.has(section.key)
              const isActive = activeSection === section.key

              return (
                <Card 
                  key={section.key}
                  variant="outlined" 
                  hover 
                  className={`cursor-pointer aspect-square transition-all duration-300 relative ${
                    isActive 
                      ? '!bg-[rgba(57,255,20,0.2)] !border-[rgba(57,255,20,0.2)] hover:!bg-[rgba(57,255,20,0.1)]' 
                      : '!bg-transparent !border-2 !border-[#333]'
                  } ${isCompleted && !isActive ? 'bg-green-500/10' : ''}`}
                  onClick={() => setActiveSection(section.key)}
                >
                  {isCompleted && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#333] border-2 border-[#39FF14] flex items-center justify-center z-10">
                      <Check className="w-3 h-3 text-[#39FF14]" strokeWidth={3} />
                    </div>
                  )}
                  <div className="flex flex-col items-center gap-1 justify-center h-full">
                    <Icon 
                      icon={IconComponent} 
                      size="sm" 
                      color={isActive ? '#39FF14' : '#FFFFFF'} 
                    />
                    <span className="text-xs font-medium text-center leading-tight text-neutral-300 break-words hyphens-auto">
                      {section.label}
                    </span>
                  </div>
                </Card>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Recording Section */}
      {activeSessionSection && (
        <Card className="p-6 md:p-8">
          {/* Section Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {activeSessionSection.label}
              </h2>
              <p className="text-sm text-neutral-400">{activeSessionSection.description}</p>
            </div>
            {isRecorded && (
              <div className="ml-4">
                <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-black" />
                </div>
              </div>
            )}
          </div>

          {!hasText ? (
            <div className="p-8 bg-neutral-800/30 border border-neutral-700 border-dashed rounded-lg text-center">
              <p className="text-neutral-400 mb-4">
                No vision text for this section yet.
              </p>
              <Button
                asChild
                variant="primary"
                size="md"
              >
                <Link href={`/life-vision/${visionId}`}>
                  Add your vision first →
                </Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Vision Text Display */}
              <div className="mb-6">
                <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4 mb-2">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                      Your Vision Text:
                    </span>
                    <span className="text-xs text-neutral-400">
                      ({sectionText.length} characters)
                    </span>
                  </div>
                  <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {sectionText}
                  </p>
                </div>
              </div>

              {/* Recorder */}
              <MediaRecorderComponent
                mode="audio"
                recordingPurpose="audioOnly"
                category={activeSection}
                storageFolder="lifeVisionAudioRecordings"
                onRecordingComplete={async (blob, transcript, shouldSave, s3Url) => {
                  if (s3Url && shouldSave) {
                    // Get duration from the blob
                    const audio = new Audio(URL.createObjectURL(blob))
                    audio.addEventListener('loadedmetadata', async () => {
                      const duration = audio.duration
                      await handleSaveRecording(activeSection, s3Url, duration)
                    })
                  }
                }}
                enableEditor={true}
                instanceId={activeSection}
                className="w-full"
              />
            </>
          )}
        </Card>
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
              onClick={() => router.push(`/life-vision/${visionId}/audio`)}
              variant="primary"
              size="lg"
            >
              <Headphones className="w-5 h-5 mr-2" />
              Listen to Your Recording
            </Button>
          </div>
        </Card>
      )}
    </Container>
  )
}
