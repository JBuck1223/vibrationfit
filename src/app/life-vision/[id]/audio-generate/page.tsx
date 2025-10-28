"use client"

import React, { useEffect, useState } from 'react'
import { Button, Card, Spinner, Badge, Container, Stack } from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { Headphones } from 'lucide-react'
import Link from 'next/link'
import { getVisionCategoryKeys } from '@/lib/design-system'

type Voice = { id: string; name: string }

export default function AudioGeneratePage({ params }: { params: Promise<{ id: string }> }) {
  const [visionId, setVisionId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [voices, setVoices] = useState<Voice[]>([])
  const [voice, setVoice] = useState<string>('alloy')
  const [selectedVariants, setSelectedVariants] = useState<string[]>(['standard'])
  const [audioVariants, setAudioVariants] = useState<Array<{id: string; name: string; voice_volume: number; bg_volume: number; background_track: string | null}>>([])
  const [workingOn, setWorkingOn] = useState<string | null>(null)
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false)
  const previewAudioRef = React.useRef<HTMLAudioElement | null>(null)
  const [showJobQueue, setShowJobQueue] = useState(false)
  const [allJobs, setAllJobs] = useState<Array<{id: string; sectionKey: string; title: string; variant: string; status: string; mixStatus?: string; setName: string}>>([])

  useEffect(() => {
    ;(async () => {
      const p = await params
      setVisionId(p.id)
    })()
  }, [params])

  // Load voices once
  useEffect(() => {
    ;(async () => {
      try {
        const resp = await fetch('/api/audio/voices', { cache: 'no-store' })
        const data = await resp.json()
        setVoices((data.voices || []).map((v: any) => ({ id: v.id, name: `${v.brandName || v.name} (${v.gender})` })))
      } catch {}
    })()
  }, [])

  // Load audio variants from database
  useEffect(() => {
    ;(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('audio_variants')
        .select('*')
        .order('id')
      if (data) {
        const sorted = [...data].sort((a, b) => {
          if (a.id === 'standard') return -1
          if (b.id === 'standard') return 1
          return 0
        })
        setAudioVariants(sorted)
      }
      setLoading(false)
    })()
  }, [])

  // Poll for job status while generating
  useEffect(() => {
    if (!visionId || !generating) return
    const interval = setInterval(async () => {
      await loadJobQueue()
    }, 5000)
    return () => clearInterval(interval)
  }, [visionId, generating])

  async function loadJobQueue() {
    const supabase = createClient()
    const { data: sets } = await supabase
      .from('audio_sets')
      .select('id, name, variant')
      .eq('vision_id', visionId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (!sets) return

    const allTracks = await Promise.all(sets.map(async (set: any) => {
      const { data: tracks } = await supabase
        .from('audio_tracks')
        .select('id, section_key, status, mix_status, created_at')
        .eq('audio_set_id', set.id)
        .order('created_at', { ascending: false })
      
      return (tracks || []).map((t: any) => ({
        ...t,
        setName: set.name,
        variant: set.variant
      }))
    }))

    const jobs = allTracks.flat().map((track: any) => ({
      id: track.id,
      sectionKey: track.section_key,
      title: prettySectionTitle(track.section_key),
      variant: track.variant,
      status: track.status,
      mixStatus: track.mix_status,
      setName: track.setName,
      createdAt: track.created_at
    }))

    jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    setAllJobs(jobs)

    // Check if all jobs are complete
    const allComplete = jobs.every(j => 
      j.status === 'completed' && (j.mixStatus === 'completed' || j.mixStatus === 'not_required')
    )
    
    if (allComplete && jobs.length > 0 && generating) {
      // Redirect to the latest audio set
      const latestSet = sets[0]
      setGenerating(false)
      setWorkingOn(null)
      setTimeout(() => {
        window.location.href = `/life-vision/${visionId}/audio-sets/${latestSet.id}`
      }, 2000)
    }
  }

  function prettySectionTitle(sectionKey: string): string {
    if (sectionKey === 'meta_intro') return 'Forward'
    if (sectionKey === 'meta_outro') return 'Conclusion'
    const map: Record<string, string> = {
      forward: 'Forward',
      fun: 'Fun / Recreation',
      travel: 'Travel / Adventure',
      home: 'Home / Environment',
      family: 'Family / Parenting',
      love: 'Love / Romance',
      health: 'Health / Vitality',
      money: 'Money / Wealth',
      work: 'Work / Career',
      social: 'Social / Friends',
      stuff: 'Possessions / Stuff',
      giving: 'Giving / Legacy',
      spirituality: 'Spirituality',
      conclusion: 'Conclusion',
    }
    return map[sectionKey] || sectionKey.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
  }

  async function handleGenerate() {
    setGenerating(true)
    setWorkingOn('triggered')
    try {
      const supabase = createClient()
      
      const { data: existingStandardSets } = await supabase
        .from('audio_sets')
        .select('id, name, voice_id')
        .eq('vision_id', visionId)
        .eq('variant', 'standard')
        .order('created_at', { ascending: false })
        .limit(1)
      
      const needsVoiceGeneration = selectedVariants.includes('standard')
      
      if (needsVoiceGeneration && !voice) {
        alert('Please select a voice for the standard version')
        setGenerating(false)
        setWorkingOn(null)
        return
      }

      // Reuse existing tracks for mixing-only variants
      if (!needsVoiceGeneration && existingStandardSets && existingStandardSets.length > 0) {
        setWorkingOn('creating mixed versions')
        
        for (const variant of selectedVariants.filter(v => v !== 'standard')) {
          const variantName = variant === 'sleep' ? 'Sleep Edition' :
                             variant === 'energy' ? 'Energy Mix' :
                             variant === 'meditation' ? 'Meditation' :
                             'Audio Version'

          const sourceSet = existingStandardSets[0]
          
          const { data: newSet } = await supabase
            .from('audio_sets')
            .insert({
              vision_id: visionId,
              user_id: (await supabase.auth.getUser()).data.user?.id,
              name: variantName,
              description: `Mixed version using existing voice with background`,
              variant: variant,
              voice_id: sourceSet.voice_id,
            })
            .select()
            .single()

          if (newSet) {
            const { data: sourceTracks } = await supabase
              .from('audio_tracks')
              .select('*')
              .eq('audio_set_id', sourceSet.id)

            if (sourceTracks) {
              for (const track of sourceTracks) {
                const { data: newTrack } = await supabase
                  .from('audio_tracks')
                  .insert({
                    user_id: track.user_id,
                    vision_id: track.vision_id,
                    audio_set_id: newSet.id,
                    section_key: track.section_key,
                    content_hash: track.content_hash,
                    text_content: track.text_content,
                    voice_id: track.voice_id,
                    s3_bucket: track.s3_bucket,
                    s3_key: track.s3_key,
                    audio_url: track.audio_url,
                    status: 'completed',
                    mix_status: 'pending',
                  })
                  .select()
                  .single()

                if (newTrack) {
                  await fetch('/api/audio/mix', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      trackId: newTrack.id,
                      voiceUrl: newTrack.audio_url,
                      variant: variant,
                      outputKey: track.s3_key?.replace('.mp3', '-mixed.mp3'),
                    }),
                  }).catch(err => console.error('Failed to trigger mixing:', err))
                }
              }
            }
          }
        }
        
        // Start polling for completion
        await loadJobQueue()
        return
      }

      // Generate new voice tracks
      const { data: vv } = await supabase
        .from('vision_versions')
        .select('*')
        .eq('id', visionId)
        .single()

      const sections = buildFourteenSectionsFromVision(vv)

      for (const variant of selectedVariants) {
        const variantName = variant === 'standard' ? 'Standard Version' :
                           variant === 'sleep' ? 'Sleep Edition' :
                           variant === 'energy' ? 'Energy Mix' :
                           variant === 'meditation' ? 'Meditation' :
                           'Audio Version'

        await fetch('/api/audio/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            visionId, 
            sections, 
            voice, 
            variant,
            audioSetName: variantName,
          }),
        })
      }
      
      // Start polling for completion
      await loadJobQueue()
    } catch (error) {
      console.error('Generation error:', error)
      setGenerating(false)
      setWorkingOn(null)
    }
  }

  if (loading) {
    return (
      <Container size="xl" className="py-8">
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Generate Audio</h1>
          <p className="text-neutral-400 mt-2">Create custom audio versions of your life vision</p>
        </div>

        {/* Variant Selection */}
        <Card variant="elevated" className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Select Audio Versions</h2>
          <div className="space-y-3">
            {audioVariants.map(v => {
              const desc = v.id === 'standard' 
                ? 'Pure voice narration'
                : v.background_track
                  ? `${v.voice_volume}% voice, ${v.bg_volume}% background`
                  : `${v.voice_volume}% voice, ${v.bg_volume}% mixed`
              return (
                <label
                  key={v.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedVariants.includes(v.id)
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-neutral-700 bg-black/30 hover:border-neutral-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedVariants.includes(v.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedVariants([...selectedVariants, v.id])
                      } else {
                        if (selectedVariants.length > 1) {
                          setSelectedVariants(selectedVariants.filter(vid => vid !== v.id))
                        }
                      }
                    }}
                    disabled={selectedVariants.length === 1 && selectedVariants.includes(v.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="text-base font-medium text-white">{v.name}</div>
                    <div className="text-sm text-neutral-400">{desc}</div>
                  </div>
                </label>
              )
            })}
          </div>
        </Card>

        {/* Voice Selection */}
        {selectedVariants.includes('standard') && (
          <Card variant="elevated" className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Voice Selection</h2>
            <div className="flex flex-col md:flex-row gap-4">
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="px-4 py-3 rounded-full bg-black/30 text-white text-sm border-2 border-white/30 flex-1"
              >
                {voices.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
              <Button 
                variant="outline" 
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/audio/voices?preview=${voice}`, { cache: 'no-store' })
                    const data = await res.json()
                    if (previewAudioRef.current) {
                      previewAudioRef.current.pause()
                    }
                    const audio = new Audio(data.url)
                    previewAudioRef.current = audio
                    setIsPreviewing(true)
                    audio.play().then(() => {
                      audio.onended = () => setIsPreviewing(false)
                    }).catch(() => setIsPreviewing(false))
                  } catch (e) {
                    setIsPreviewing(false)
                  }
                }}
                disabled={isPreviewing}
              >
                {isPreviewing ? 'Playing...' : 'Preview'}
              </Button>
            </div>
          </Card>
        )}

        {/* Status Message */}
        {workingOn === 'triggered' && (
          <Card variant="glass" className="p-6 border-2 border-primary-500 bg-primary-500/10">
            <div className="flex items-start gap-3">
              <Spinner size="sm" />
              <div>
                <p className="text-white font-medium">Generation Started!</p>
                <p className="text-neutral-300 text-sm">Your custom audios are being created. They will appear in your audio library when complete.</p>
              </div>
            </div>
          </Card>
        )}

        {/* Job Queue Dropdown */}
        {allJobs.length > 0 && generating && (
          <Card variant="default" className="p-4">
            <button
              onClick={() => setShowJobQueue(!showJobQueue)}
              className="w-full flex items-center justify-between"
            >
              <span className="text-sm font-medium text-white">
                Job Queue ({allJobs.filter(j => j.status === 'processing' || j.status === 'pending' || j.mixStatus === 'pending' || j.mixStatus === 'mixing').length} in progress)
              </span>
              <span className="text-neutral-400">{showJobQueue ? '▲' : '▼'}</span>
            </button>
            
            {showJobQueue && (
              <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                {allJobs.slice(0, 20).map((job) => {
                  const isProcessing = job.status === 'processing' || job.status === 'pending'
                  const isMixing = job.mixStatus === 'pending' || job.mixStatus === 'mixing'
                  const isComplete = job.status === 'completed' && (job.mixStatus === 'completed' || job.mixStatus === 'not_required')
                  
                  return (
                    <div 
                      key={job.id}
                      className="p-3 rounded-lg border-2 border-neutral-700 bg-neutral-900/50"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white">{job.title}</div>
                          <div className="text-xs text-neutral-400">{job.setName} • {job.variant}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {isProcessing && (
                            <Badge variant="info" className="text-xs">Voice: {job.status}</Badge>
                          )}
                          {isMixing && !isProcessing && (
                            <Badge variant="info" className="text-xs">Mixing: {job.mixStatus}</Badge>
                          )}
                          {isComplete && (
                            <Badge variant="success" className="text-xs">✓ Ready</Badge>
                          )}
                          {job.status === 'failed' && (
                            <Badge variant="error" className="text-xs">✗ Failed</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        )}

        {/* Generate Button */}
        <div className="flex gap-4">
          <Button variant="secondary" asChild className="flex-1">
            <Link href={`/life-vision/${visionId}/audio`}>Cancel</Link>
          </Button>
          <Button 
            variant="primary" 
            onClick={handleGenerate} 
            disabled={generating || selectedVariants.length === 0 || (selectedVariants.includes('standard') && !voice)}
            className="flex-1"
          >
            {generating ? 'Generating…' : `Generate ${selectedVariants.length} Version${selectedVariants.length > 1 ? 's' : ''}`}
          </Button>
        </div>
      </Stack>
    </Container>
  )
}

function buildFourteenSectionsFromVision(v: any): { sectionKey: string; text: string }[] {
  if (!v) return []
  const sections: { sectionKey: string; text: string }[] = []
  const map = canonicalOrder().map((key) => ({ key, field: mapFieldForKey(key) }))
  for (const m of map) {
    const raw = m.field ? (v[m.field] as string) : ''
    const text = (raw || '').trim()
    if (!text) continue
    sections.push({ sectionKey: m.key, text })
  }
  return sections
}

function canonicalOrder(): string[] {
  const middle = getVisionCategoryKeys()
  return ['meta_intro', ...middle.filter(k => k !== 'forward' && k !== 'conclusion'), 'meta_outro']
}

function mapFieldForKey(key: string): string | undefined {
  const mapping: Record<string, string> = {
    meta_intro: 'forward',
    meta_outro: 'conclusion',
    health: 'health',
    family: 'family',
    love: 'love',
    social: 'social',
    fun: 'fun',
    travel: 'travel',
    home: 'home',
    money: 'money',
    work: 'work',
    stuff: 'stuff',
    giving: 'giving',
    spirituality: 'spirituality',
  }
  return mapping[key]
}
