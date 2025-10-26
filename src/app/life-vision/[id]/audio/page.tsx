"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Spinner, Badge, Container, Stack } from '@/lib/design-system/components'
import { getVisionCategoryKeys } from '@/lib/design-system'
import { PlaylistPlayer, type AudioTrack } from '@/lib/design-system'
import { createClient } from '@/lib/supabase/client'
import { Headphones, Download, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Voice = { id: string; name: string }

export default function VisionAudioPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [visionId, setVisionId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [tracks, setTracks] = useState<{ sectionKey: string; title: string; url: string; status?: 'pending' | 'processing' | 'completed' | 'failed'; createdAt?: string; voiceId?: string; contentHash?: string }[]>([])
  const [voices, setVoices] = useState<Voice[]>([])
  const [voice, setVoice] = useState<string>('alloy')
  const [workingOn, setWorkingOn] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false)
  const [previewProgress, setPreviewProgress] = useState<number>(0)
  const previewAudioRef = React.useRef<HTMLAudioElement | null>(null)
  const PREVIEW_TEXT = "This is a sample of the voice you will hear for your life vision audio. This voice will read your vision and create audio tracks for you to listen to for multi-layered vision activation!"
  const [audioSets, setAudioSets] = useState<Array<{id: string; name: string; variant: string; voiceId?: string; trackCount: number; isReady: boolean; isMixing: boolean}>>([])
  const [selectedAudioSetId, setSelectedAudioSetId] = useState<string | null>(null)
  const [selectedVariants, setSelectedVariants] = useState<string[]>(['standard']) // Multi-select for variants to generate
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

  // Listen for per-track retry events (depends on visionId and voice)
  useEffect(() => {
    if (!visionId) return
    const onRetry = async (e: any) => {
      const key = e?.detail?.sectionKey
      if (!key) return
      const supabase = createClient()
      const { data: vv } = await supabase
        .from('vision_versions')
        .select('*')
        .eq('id', visionId)
        .single()
      const allSections = buildFourteenSectionsFromVision(vv)
      const section = allSections.find(s => s.sectionKey === key)
      if (!section) return
      setGenerating(true)
      setWorkingOn(`retrying ${key}`)
      try {
        await fetch('/api/audio/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visionId, sections: [section], voice, force: true }),
        })
        await refreshStatus()
      } finally {
        setGenerating(false)
        setWorkingOn(null)
      }
    }
    window.addEventListener('audio:retry-track', onRetry)
    return () => window.removeEventListener('audio:retry-track', onRetry)
  }, [visionId, voice])

  useEffect(() => {
    if (!visionId) return
    ;(async () => {
      await loadAudioSets()
      await refreshStatus()
      setLoading(false)
    })()
  }, [visionId])

  // Reload tracks when selected audio set changes
  useEffect(() => {
    if (selectedAudioSetId) {
      refreshStatus()
    }
  }, [selectedAudioSetId])

  // Auto-uncheck "standard" if voice-only tracks already exist (user wants to generate mixing variants only)
  useEffect(() => {
    ;(async () => {
      if (!visionId || loading) return
      
      // Check if we have existing voice-only audio sets
      const supabase = createClient()
      const { data: existingStandardSets } = await supabase
        .from('audio_sets')
        .select('id')
        .eq('vision_id', visionId)
        .eq('variant', 'standard')
        .limit(1)
      
      // If voice-only exists and standard is the only selected variant, uncheck it
      // so user can generate mixing variants without regenerating voice
      if (existingStandardSets && existingStandardSets.length > 0 && 
          selectedVariants.length === 1 && selectedVariants[0] === 'standard') {
        setSelectedVariants([])
      }
    })()
  }, [visionId, loading]) // Only run when visionId or loading state changes, not on every selectedVariants change

  async function loadAudioSets() {
    const supabase = createClient()
    const { data: sets } = await supabase
      .from('audio_sets')
      .select(`
        id, 
        name, 
        variant,
        voice_id,
        audio_tracks(count)
      `)
      .eq('vision_id', visionId)
      .order('created_at', { ascending: false })
    
    // Check mix status for each set
    const setsWithStatus = await Promise.all((sets || []).map(async (set: any) => {
      const { data: tracks } = await supabase
        .from('audio_tracks')
        .select('mix_status, status')
        .eq('audio_set_id', set.id)
        .limit(1)
      
      const hasCompletedVoice = tracks?.some((t: any) => t.status === 'completed')
      const hasCompletedMixing = tracks?.some((t: any) => t.mix_status === 'completed')
      const isMixing = tracks?.some((t: any) => t.mix_status === 'mixing' || t.mix_status === 'pending')
      
      return {
        id: set.id,
        name: set.name,
        variant: set.variant,
        voiceId: set.voice_id,
        trackCount: set.audio_tracks?.[0]?.count || 0,
        isReady: !!(hasCompletedVoice && (set.variant === 'standard' || hasCompletedMixing)),
        isMixing: !!isMixing
      }
    }))
    
    setAudioSets(setsWithStatus)
    
    // Set selected to first ready set, or most recent
    const readySet = setsWithStatus.find((s: any) => s.isReady)
    if (readySet) {
      setSelectedAudioSetId(readySet.id)
    } else if (setsWithStatus.length > 0) {
      setSelectedAudioSetId(setsWithStatus[0].id)
    }

    // Also load all jobs across all audio sets
    await loadAllJobs(sets || [])
  }

  async function loadAllJobs(sets: any[]) {
    const supabase = createClient()
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
    
    // Flatten and deduplicate by section_key per set
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
    
    // Sort by creation date, most recent first
    jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    setAllJobs(jobs)
  }

  // Poll status while there are processing tracks or while generating
  useEffect(() => {
    if (!visionId) return
    const hasProcessing = tracks.some(t => t.status === 'processing' || t.status === 'pending')
    if (!generating && !hasProcessing) return
    const id = setInterval(() => {
      refreshStatus().catch(() => {})
    }, 5000)
    return () => clearInterval(id)
  }, [visionId, generating, tracks])

  async function refreshStatus() {
    if (!visionId) return
    
    // If we have a selected audio set, query its tracks
    if (selectedAudioSetId) {
      const supabase = createClient()
      const { data: tracks } = await supabase
        .from('audio_tracks')
        .select('section_key, audio_url, mixed_audio_url, mix_status, status, voice_id, content_hash, created_at')
        .eq('vision_id', visionId)
        .eq('audio_set_id', selectedAudioSetId)
        .order('section_key')
      
      const mapped = (tracks || []).map((t: any) => ({
        sectionKey: t.section_key,
        title: prettySectionTitle(t.section_key),
        // Use mixed_audio_url if available and completed, otherwise use voice-only audio_url
        url: t.mixed_audio_url && t.mix_status === 'completed' ? t.mixed_audio_url : (t.audio_url || ''),
        status: t.status,
        createdAt: t.created_at,
        voiceId: t.voice_id,
        contentHash: t.content_hash,
        mixStatus: t.mix_status,
      }))
      
      // Remove duplicates by sectionKey (keep the most recent one)
      const uniqueMap = new Map<string, any>()
      mapped.forEach((track: any) => {
        const existing = uniqueMap.get(track.sectionKey)
        if (!existing || new Date(track.createdAt) > new Date(existing.createdAt)) {
          uniqueMap.set(track.sectionKey, track)
        }
      })
      const uniqueTracks = Array.from(uniqueMap.values())
      
      const order = canonicalOrder()
      uniqueTracks.sort((a: any, b: any) => order.indexOf(a.sectionKey) - order.indexOf(b.sectionKey))
      setTracks(uniqueTracks)
    } else {
      // Fallback: use API endpoint
      const resp = await fetch(`/api/audio/generate?visionId=${visionId}`, { cache: 'no-store' })
      const data = await resp.json()
      const mapped = (data.tracks || []).map((t: any) => ({
        sectionKey: t.section_key,
        title: prettySectionTitle(t.section_key),
        url: t.audio_url || '',
        status: t.status,
        createdAt: t.created_at,
        voiceId: t.voice_id,
        contentHash: t.content_hash,
      }))
      const order = canonicalOrder()
      mapped.sort((a: any, b: any) => order.indexOf(a.sectionKey) - order.indexOf(b.sectionKey))
      setTracks(mapped)
    }
  }

  async function retryFailed() {
    if (!visionId) return
    // Pull latest content and rebuild sections, but only include those with failed status
    const supabase = createClient()
    const { data: vv } = await supabase
      .from('vision_versions')
      .select('*')
      .eq('id', visionId)
      .single()
    const allSections = buildFourteenSectionsFromVision(vv)
    const failedKeys = tracks.filter(t => t.status === 'failed').map(t => t.sectionKey)
    const sections = allSections.filter(s => failedKeys.includes(s.sectionKey))
    if (sections.length === 0) return
    setGenerating(true)
    setWorkingOn('retrying failed')
    try {
      await fetch('/api/audio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visionId, sections, voice }),
      })
      await refreshStatus()
    } finally {
      setGenerating(false)
      setWorkingOn(null)
    }
  }

  async function handleGenerate() {
    setGenerating(true)
    setWorkingOn('triggered')
    try {
      const supabase = createClient()
      
      // Check if we have existing voice-only audio sets
      const { data: existingStandardSets } = await supabase
        .from('audio_sets')
        .select('id, name, voice_id')
        .eq('vision_id', visionId)
        .eq('variant', 'standard')
        .order('created_at', { ascending: false })
        .limit(1)
      
      // For mixing-only variants (no voice regeneration needed)
      // Check if selectedVariants include only non-standard variants
      const needsVoiceGeneration = selectedVariants.includes('standard')
      
      if (needsVoiceGeneration && !voice) {
        alert('Please select a voice for the standard version')
        setGenerating(false)
        setWorkingOn(null)
        return
      }

      // If we have existing voice tracks and only mixing variants, reuse them
      if (!needsVoiceGeneration && existingStandardSets && existingStandardSets.length > 0) {
        setWorkingOn('creating mixed versions')
        
        // Create new audio sets for mixing variants using existing voice tracks
        for (const variant of selectedVariants.filter(v => v !== 'standard')) {
          const variantName = variant === 'sleep' ? 'Sleep Edition' :
                             variant === 'energy' ? 'Energy Mix' :
                             variant === 'meditation' ? 'Meditation' :
                             'Audio Version'

          // Get the first existing standard set to copy voice tracks from
          const sourceSet = existingStandardSets[0]
          
          // Create new audio set for this variant
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
            // Copy audio tracks from standard set
            const { data: sourceTracks } = await supabase
              .from('audio_tracks')
              .select('*')
              .eq('audio_set_id', sourceSet.id)

            if (sourceTracks) {
              // Insert copies with new audio_set_id and trigger mixing
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
                    mix_status: 'pending', // Will trigger Lambda mixing
                  })
                  .select()
                  .single()

                // Trigger Lambda mixing
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
        
        await loadAudioSets()
        await refreshStatus()
        setWorkingOn(null)
        setGenerating(false)
        return
      }

      // Original generation flow for new voice tracks
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: vv } = await supabase
        .from('vision_versions')
        .select('*')
        .eq('id', visionId)
        .single()

      const sections = buildFourteenSectionsFromVision(vv)

      // Generate for each selected variant
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
            force: false 
          }),
        })
      }
      
      await loadAudioSets()
      await refreshStatus()
    } catch (e) {
      console.error(e)
    } finally {
      setGenerating(false)
      setWorkingOn(null)
    }
  }

  // Get variant for selected audio set
  const selectedSet = audioSets.find(set => set.id === selectedAudioSetId)
  
  // Convert tracks to AudioTrack format for PlaylistPlayer
  const audioTracks: AudioTrack[] = tracks
    .filter(t => t.status === 'completed' && t.url)
    .map((t, index) => ({
      id: selectedAudioSetId ? `${selectedAudioSetId}-${t.sectionKey}` : `track-${index}`, // Unique ID combining audio set and section
      title: t.title,
      artist: 'VibrationFit AI',
      duration: 180, // Default duration
      url: t.url,
      thumbnail: '',
      variant: selectedSet?.variant || 'standard'
    }))

  const hasCompletedTracks = audioTracks.length > 0
  const hasIncompleteTracks = tracks.some(t => t.status !== 'completed')
  
  // Check if selected variants include standard (which requires voice)
  const includesStandard = selectedVariants.includes('standard')
  const needsVoice = includesStandard && !voice

  return (
    <Container size="lg">
      <Stack gap="lg">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-2">
          <Button 
            variant="ghost" 
            size="sm"
            asChild
          >
            <Link href={`/life-vision/${visionId}`}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <h1 className="text-2xl md:text-4xl font-bold text-white">Life Vision Audio</h1>
        </div>

        {/* Audio Version Selector */}
        {audioSets.length > 0 && (
          <Card variant="default" className="p-4">
            <Stack gap="sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Audio Versions</h3>
                <Button
                  variant="outline"
                  asChild
                  size="sm"
                >
                  <Link href={`/life-vision/${visionId}/audio-sets`}>
                    Manage All
                  </Link>
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedAudioSetId || ''}
                  onChange={(e) => setSelectedAudioSetId(e.target.value)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 text-white text-sm border-2 border-neutral-700 h-[48px] flex-1"
                >
                  {audioSets.map(set => (
                    <option key={set.id} value={set.id}>
                      {set.isReady ? '✓ ' : set.isMixing ? '⏳ ' : '○ '}
                      {set.name} ({set.trackCount} tracks) - {set.variant} {set.voiceId ? `- ${set.voiceId}` : ''}
                    </option>
                  ))}
                </select>
                <Button
                  variant="primary"
                  asChild
                  size="sm"
                >
                  <Link href={`/life-vision/${visionId}/audio-sets/${selectedAudioSetId}`}>
                    Play Selected
                  </Link>
                </Button>
              </div>
            </Stack>
          </Card>
        )}

            {/* Hero Card */}
        <Card id="generate-section" variant="elevated" className="bg-gradient-to-br from-[#199D67]/20 via-[#14B8A6]/10 to-[#8B5CF6]/20 border-[#39FF14]/30">
          <Stack gap="md" className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <Headphones className="w-6 h-6 md:w-8 md:h-8 text-[#39FF14]" />
              <h2 className="text-xl md:text-3xl font-bold text-white">
                {audioSets.length > 0 ? 'Generate New Audio Version' : 'Generate Your Vision Audio'}
              </h2>
            </div>
            <p className="text-sm md:text-lg text-neutral-300">
              Transform your written vision into immersive audio tracks for daily activation
            </p>
            
            {/* Info about regeneration */}
            {hasCompletedTracks && (
              <Card variant="glass" className="p-3 bg-[#39FF14]/10 border-[#39FF14]/20">
                <p className="text-xs md:text-sm text-neutral-300">
                  <strong className="text-[#39FF14]">Note:</strong> Existing audio tracks with the same content will be skipped. 
                  Changed sections will be regenerated with the new voice.
                </p>
              </Card>
            )}

            {/* Variant Selection - Multi-Select */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-white">Which audio versions would you like?</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: 'standard', label: 'Voice Only', desc: 'Pure voice narration' },
                  { id: 'sleep', label: 'Ocean Waves (Sleep)', desc: '30% voice, 70% ocean' },
                  { id: 'meditation', label: 'Ocean Waves (Meditation)', desc: '50% voice, 50% ocean' },
                  { id: 'energy', label: 'Ocean Waves (Energy)', desc: '80% voice, 20% ocean' },
                ].map(v => (
                  <label
                    key={v.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedVariants.includes(v.id)
                        ? 'border-[#39FF14] bg-[#39FF14]/10'
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
                          // Don't allow unchecking if it's the last one
                          if (selectedVariants.length > 1) {
                            setSelectedVariants(selectedVariants.filter(vid => vid !== v.id))
                          }
                        }
                      }}
                      disabled={selectedVariants.length === 1 && selectedVariants.includes(v.id)}
                      className="mt-1 w-5 h-5 rounded border-2 border-neutral-600 bg-transparent text-[#39FF14] focus:ring-[#39FF14] disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{v.label}</div>
                      <div className="text-xs text-neutral-400">{v.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-xs text-neutral-400">
                Voice tracks generate first, then background mixing happens automatically. Selected versions will appear as separate playlists.
              </p>
            </div>
            
            {/* Voice Selection & Generate */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col md:flex-row gap-3 md:items-center">
                {/* Only show voice selector if standard variant is selected */}
                {selectedVariants.includes('standard') && (
                  <select
                    value={voice}
                    onChange={(e) => {
                      if (previewAudioRef.current) {
                        previewAudioRef.current.pause()
                        setIsPreviewing(false)
                        setPreviewProgress(0)
                      }
                      setVoice(e.target.value)
                    }}
                    className="px-4 md:px-6 py-3 rounded-full bg-black/30 text-white text-sm border-2 border-white/30 h-[48px] flex-1"
                  >
                    {voices.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                )}
                
                <div className="flex gap-2">
                  {/* Only show preview button when standard variant is selected */}
                  {selectedVariants.includes('standard') && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/audio/voices?preview=${voice}`, { cache: 'no-store' })
                          const data = await res.json()
                          if (previewAudioRef.current) {
                            previewAudioRef.current.pause()
                            previewAudioRef.current = null
                          }
                          const audio = new Audio(data.url)
                          previewAudioRef.current = audio
                          setIsPreviewing(true)
                          setPreviewProgress(0)
                          
                          audio.addEventListener('timeupdate', () => {
                            if (!audio.duration) return
                            setPreviewProgress((audio.currentTime / audio.duration) * 100)
                          })
                          audio.addEventListener('ended', () => {
                            setIsPreviewing(false)
                            setPreviewProgress(100)
                          })
                          audio.addEventListener('error', () => {
                            setIsPreviewing(false)
                          })
                          audio.play().catch(() => setIsPreviewing(false))
                        } catch (e) {
                          setIsPreviewing(false)
                        }
                      }}
                      disabled={isPreviewing}
                      className="flex-1 md:flex-none"
                    >
                      {isPreviewing ? 'Playing...' : 'Preview'}
                    </Button>
                  )}
                  <Button 
                    variant="primary" 
                    onClick={handleGenerate} 
                    disabled={generating || needsVoice || selectedVariants.length === 0}
                    size="sm"
                    className={`${selectedVariants.includes('standard') ? 'flex-1 md:flex-none' : 'w-full'}`}
                  >
                    {generating ? 'Generating…' : `Generate ${selectedVariants.length} Version${selectedVariants.length > 1 ? 's' : ''}`}
                  </Button>
                </div>
              </div>
              {/* Help text when disabled */}
              {(needsVoice || selectedVariants.length === 0) && !generating && (
                <p className="text-xs text-neutral-400 text-center md:text-left">
                  {needsVoice && "⚠️ Please select a voice for the standard version"}
                  {!needsVoice && selectedVariants.length === 0 && "⚠️ Please select at least one audio version"}
                </p>
              )}
              {/* Info text when only mixing variants are selected */}
              {!needsVoice && selectedVariants.length > 0 && !selectedVariants.includes('standard') && (
                <p className="text-xs text-[#39FF14] text-center md:text-left">
                  ✓ Using existing voice tracks. Only mixing will be generated.
                </p>
              )}
            </div>
          </Stack>
        </Card>

        {/* Job Queue Dropdown */}
        {allJobs.length > 0 && (
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

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner variant="primary" size="lg" />
          </div>
        ) : (
          <Stack gap="md">
            {/* Status Messages */}
            {workingOn === 'triggered' && (
              <Card variant="glass" className="p-4 bg-gradient-to-r from-[#199D67]/20 to-[#8B5CF6]/20 border-[#39FF14]/30">
                <div className="flex items-center gap-3">
                  <div className="animate-pulse">
                    <div className="w-3 h-3 bg-[#39FF14] rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="text-[#39FF14] font-semibold text-sm md:text-base">VIVA is creating your custom audios!</h4>
                    <p className="text-neutral-300 text-xs md:text-sm">Voice tracks are generating first, then background mixing will happen automatically. They will appear here when complete.</p>
                  </div>
                </div>
              </Card>
            )}
            {workingOn && workingOn !== 'triggered' && (
              <Card variant="glass" className="p-4">
                <div className="flex items-center gap-2 text-center">
                  <Spinner variant="primary" size="sm" />
                  <span className="text-sm text-neutral-300">Working on: <span className="text-[#39FF14]">{workingOn}</span></span>
                </div>
              </Card>
            )}

            {/* Voice Preview Card */}
            {isPreviewing && (
              <Card variant="default" className="p-4">
                <Stack gap="sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium text-sm">Voice Preview</span>
                    <span className="text-neutral-400 text-xs">{Math.round(previewProgress)}%</span>
                  </div>
                  <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-[#199D67]" style={{ width: `${previewProgress}%` }} />
                  </div>
                  <p className="text-neutral-300 text-sm mt-3 whitespace-pre-wrap">{PREVIEW_TEXT}</p>
                </Stack>
              </Card>
            )}

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Only show Retry Failed button when there are failed tracks */}
              {tracks.some(t => t.status === 'failed') && (
                <Button 
                  variant="secondary" 
                  onClick={() => retryFailed()} 
                  disabled={generating}
                  size="sm"
                  className="flex-1"
                >
                  Retry Failed
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => refreshStatus()} 
                disabled={generating}
                size="sm"
                className="flex-1"
              >
                Refresh Status
              </Button>
            </div>

            {/* Playlist Player */}
            {hasCompletedTracks ? (
              <Card variant="elevated" className="p-4 md:p-6">
                <PlaylistPlayer tracks={audioTracks} />
              </Card>
            ) : (
              <Card variant="outlined" className="p-8 text-center">
                <Stack gap="md" align="center">
                  <Headphones className="w-12 h-12 md:w-16 md:h-16 text-neutral-600" />
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold text-white mb-2">No Audio Generated Yet</h3>
                    <p className="text-sm md:text-base text-neutral-400 mb-4">
                      Generate your first audio track to start listening to your vision
                    </p>
                  </div>
                  <Button 
                    variant="primary" 
                    onClick={handleGenerate} 
                    disabled={generating}
                  >
                    {generating ? 'Generating…' : 'Generate Your First Track'}
                  </Button>
                </Stack>
              </Card>
            )}

            {/* Track Status List */}
            {tracks.length > 0 && (
              <Card variant="default" className="p-4">
                <Stack gap="sm">
                  <h3 className="text-lg font-semibold text-white mb-2">Track Status</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {tracks.map((track, index) => (
                      <div
                        key={`track-status-${index}`}
                        className="p-3 rounded-lg border-2 border-neutral-800 bg-neutral-900/50"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-white truncate">{track.title}</span>
                          <Badge 
                            variant={
                              track.status === 'completed' ? 'success' : 
                              track.status === 'failed' ? 'error' : 
                              'info'
                            }
                          >
                            {track.status}
                          </Badge>
                        </div>
                        {track.status === 'failed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              window.dispatchEvent(new CustomEvent('audio:retry-track', { 
                                detail: { sectionKey: track.sectionKey } 
                              }))
                            }}
                            className="mt-2 text-xs"
                          >
                            Retry
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </Stack>
              </Card>
            )}
          </Stack>
        )}
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
  // Use global category order and map to our 14 sequence with intro/outro
  const middle = getVisionCategoryKeys() // forward..conclusion in correct order per DS
  // Ensure forward and conclusion positions wrap intro/outro mapping
  return ['meta_intro', ...middle.filter(k => k !== 'forward' && k !== 'conclusion'), 'meta_outro']
}

function mapFieldForKey(key: string): string | undefined {
  const mapping: Record<string, string> = {
    meta_intro: 'forward',
    meta_outro: 'conclusion',
    health: 'health',
    family: 'family',
    romance: 'romance',
    social: 'social',
    fun: 'fun',
    travel: 'travel',
    home: 'home',
    money: 'money',
    business: 'business',
    possessions: 'possessions',
    giving: 'giving',
    spirituality: 'spirituality',
  }
  return mapping[key]
}

function prettySectionTitle(sectionKey: string): string {
  if (sectionKey === 'meta_intro') return 'Forward'
  if (sectionKey === 'meta_outro') return 'Conclusion'
  // Map to global labels when possible
  const map: Record<string, string> = {
    forward: 'Forward',
    fun: 'Fun / Recreation',
    travel: 'Travel / Adventure',
    home: 'Home / Environment',
    family: 'Family / Parenting',
    romance: 'Love / Romance',
    health: 'Health / Vitality',
    money: 'Money / Wealth',
    business: 'Business / Career',
    social: 'Social / Friends',
    possessions: 'Possessions / Stuff',
    giving: 'Giving / Legacy',
    spirituality: 'Spirituality',
    conclusion: 'Conclusion',
  }
  return map[sectionKey] || sectionKey.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
}


