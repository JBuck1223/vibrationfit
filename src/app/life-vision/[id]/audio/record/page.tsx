"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Container, Badge, StatusBadge } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { MediaRecorderComponent } from '@/components/MediaRecorder'
import { CheckCircle, Eye, Headphones, Mic } from 'lucide-react'
import Link from 'next/link'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'

// Add meta sections (intro/outro) to the vision categories for audio recording
const VISION_SECTIONS = [
  { key: 'forward', label: 'Forward', description: 'Your opening vision statement', order: 0 },
  ...VISION_CATEGORIES.filter(c => c.order > 0 && c.order < 13).map(c => ({
    key: c.key,
    label: c.label,
    description: c.description,
    order: c.order,
    icon: c.icon
  })),
  { key: 'conclusion', label: 'Conclusion', description: 'Your vision conclusion', order: 14 },
]

export default function RecordVisionAudioPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [visionId, setVisionId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [vision, setVision] = useState<any>(null)
  const [recordings, setRecordings] = useState<Map<string, { url: string; duration: number }>>(new Map())
  const [saving, setSaving] = useState<string | null>(null)
  const [audioSetId, setAudioSetId] = useState<string | null>(null)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

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

      // Collapse the card after successful save
      setExpandedCategory(null)

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
  const progressPercent = Math.round((completedCount / totalCount) * 100)

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
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
                    <StatusBadge status="active" subtle={false} showIcon={false} />
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs md:text-sm font-semibold border bg-[#39FF14]/20 text-[#39FF14] border-[#39FF14]/30">
                      <Mic className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1" />
                      {completedCount} of {totalCount} recorded
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-row flex-wrap md:flex-nowrap gap-2 md:gap-4 max-w-2xl mx-auto">
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

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {VISION_SECTIONS.map((section) => {
          const sectionText = getSectionText(section.key)
          const hasText = sectionText.trim().length > 0
          const isRecorded = recordings.has(section.key)
          const isSaving = saving === section.key
          const isExpanded = expandedCategory === section.key

          return (
            <Card 
              key={section.key} 
              className={`relative transition-all ${isExpanded ? 'md:col-span-2 lg:col-span-3' : ''}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{section.label}</h3>
                  <p className="text-sm text-neutral-400">{section.description}</p>
                </div>
                {isRecorded && (
                  <div className="ml-2">
                    <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-black" />
                    </div>
                  </div>
                )}
              </div>

              {!hasText ? (
                <div className="p-4 bg-neutral-800/30 border border-neutral-700 border-dashed rounded-lg text-center">
                  <p className="text-sm text-neutral-400 mb-2">
                    No vision text for this section yet.
                  </p>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                  >
                    <Link href={`/life-vision/${visionId}`}>
                      Add your vision first →
                    </Link>
                  </Button>
                </div>
              ) : (
                <>
                  {/* Vision Text Display - Like /life-vision/[id] */}
                  {!isExpanded && (
                    <div className="mb-4">
                      <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4">
                        <p className="text-neutral-300 text-sm leading-relaxed line-clamp-3 whitespace-pre-wrap">
                          {sectionText}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Expanded View with Full Text */}
                  {isExpanded && (
                    <div className="mb-4">
                      <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-2">
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

                      {/* Recorder */}
                      <MediaRecorderComponent
                        mode="audio"
                        recordingPurpose="audioOnly"
                        category={section.key}
                        storageFolder="lifeVisionAudioRecordings"
                        onRecordingComplete={async (blob, transcript, shouldSave, s3Url) => {
                          if (s3Url && shouldSave) {
                            // Get duration from the blob
                            const audio = new Audio(URL.createObjectURL(blob))
                            audio.addEventListener('loadedmetadata', async () => {
                              const duration = audio.duration
                              await handleSaveRecording(section.key, s3Url, duration)
                            })
                          }
                        }}
                        enableEditor={true}
                        instanceId={section.key}
                        className="w-full"
                      />
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="flex gap-2">
                    {!isExpanded ? (
                      <Button
                        onClick={() => setExpandedCategory(section.key)}
                        variant={isRecorded ? "outline" : "primary"}
                        size="sm"
                        className="flex-1"
                        disabled={isSaving}
                      >
                        <Mic className="w-4 h-4 mr-2" />
                        {isRecorded ? 'Re-record' : 'Record'}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setExpandedCategory(null)}
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                      >
                        Close
                      </Button>
                    )}
                  </div>
                </>
              )}
            </Card>
          )
        })}
      </div>

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
