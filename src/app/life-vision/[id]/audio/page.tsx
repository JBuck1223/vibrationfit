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
      // Fetch vision text sections (simplified: get latest version content)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load structure for 14 sections from existing vision record
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
              <h3 className="text-lg font-semibold text-white mb-2">Audio Versions</h3>
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
            </Stack>
          </Card>
        )}

        {/* Quick Generate Another Version */}
        {audioSets.length > 0 && audioSets.some(s => s.isReady) && (
          <Card variant="elevated" className="border-[#8B5CF6]/30">
            <div className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">Want a different version?</h3>
                  <p className="text-sm text-neutral-400">
                    Generate additional audio versions with different voices or background mixes
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    // Scroll to generation section
                    document.getElementById('generate-section')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  size="md"
                  className="whitespace-nowrap"
                >
                  Create New Version
                </Button>
              </div>
            </div>
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
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
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
              
              <div className="flex gap-2">
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
                <Button 
                  variant="primary" 
                  onClick={handleGenerate} 
                  disabled={generating}
                  size="sm"
                  className="flex-1 md:flex-none"
                >
                  {generating ? 'Generating…' : `Generate ${selectedVariants.length} Version${selectedVariants.length > 1 ? 's' : ''}`}
                </Button>
              </div>
            </div>
          </Stack>
        </Card>

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


