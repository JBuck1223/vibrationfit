"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Container, Stack, Spinner, Toggle, DeleteConfirmationDialog, PageHero, TrackingMilestoneCard } from '@/lib/design-system/components'
import { PlaylistPlayer, type AudioTrack as BaseAudioTrack } from '@/lib/design-system'
import { createClient } from '@/lib/supabase/client'
import { Play, Clock, Moon, Zap, Sparkles, Headphones, Trash2, Music, Mic, BookOpen, Eye, Target } from 'lucide-react'

interface AudioTrack extends BaseAudioTrack {
  sectionKey: string
}

type AreaKey = 'story' | 'life_vision' | 'vision_board'

interface AreaOption {
  value: AreaKey
  label: string
}

const AREAS: AreaOption[] = [
  { value: 'story', label: 'Story' },
  { value: 'life_vision', label: 'Life Vision' },
  { value: 'vision_board', label: 'Vision Board' },
]

interface AudioSetItem {
  id: string
  name: string
  description: string
  variant: string
  voice_id: string
  is_active: boolean
  created_at: string
  track_count: number
  isReady: boolean
  isMixing: boolean
  mixRatio?: string
  backgroundTrack?: string
  frequencyTrack?: string
  frequencyType?: 'pure' | 'solfeggio_binaural' | 'binaural'
  area: AreaKey
  contextLabel?: string
  metadata?: any
}

export default function AudioHubPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [allSets, setAllSets] = useState<AudioSetItem[]>([])
  const [selectedArea, setSelectedArea] = useState<AreaKey>('story')
  const [selectedAudioSetId, setSelectedAudioSetId] = useState<string | null>(null)
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([])
  const [loadingTracks, setLoadingTracks] = useState(false)
  const [playMode, setPlayMode] = useState<'sections' | 'full'>('sections')
  const [isSetDropdownOpen, setIsSetDropdownOpen] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [setToDelete, setSetToDelete] = useState<{ id: string, name: string } | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const savedArea = localStorage.getItem('audioHub_area') as AreaKey | null
    if (savedArea && AREAS.some(a => a.value === savedArea)) {
      setSelectedArea(savedArea)
    }
  }, [])

  useEffect(() => {
    const setsForArea = allSets.filter(s => s.area === selectedArea)
    const savedSetId = localStorage.getItem(`audioHub_set_${selectedArea}`)
    const savedSet = savedSetId ? setsForArea.find(s => s.id === savedSetId && s.isReady) : null
    const firstReady = setsForArea.find(s => s.isReady)
    const targetSet = savedSet || firstReady

    if (targetSet) {
      setSelectedAudioSetId(targetSet.id)
      loadAudioTracks(targetSet.id)
    } else {
      setSelectedAudioSetId(null)
      setAudioTracks([])
    }
  }, [selectedArea, allSets])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    const [setsResp, storiesResp, visionsResp] = await Promise.all([
      supabase
        .from('audio_sets')
        .select('*, audio_tracks(count)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('stories')
        .select('id, entity_type, entity_id, title, audio_set_id')
        .eq('user_id', user.id)
        .not('audio_set_id', 'is', null),
      supabase
        .from('vision_versions')
        .select('id, is_active, is_draft, created_at')
        .eq('user_id', user.id)
    ])

    if (setsResp.error) {
      console.error('Error loading audio sets:', setsResp.error)
      setLoading(false)
      return
    }

    const storyMap = new Map<string, { entityType: string; title: string | null }>()
    for (const s of (storiesResp.data || [])) {
      if (s.audio_set_id) {
        storyMap.set(s.audio_set_id, { entityType: s.entity_type, title: s.title })
      }
    }

    const versionMap = new Map<string, { isActive: boolean; isDraft: boolean; number: number }>()
    const visions = visionsResp.data || []
    visions.forEach((v, idx) => {
      versionMap.set(v.id, {
        isActive: v.is_active,
        isDraft: v.is_draft,
        number: visions.length - idx
      })
    })

    const enriched = await Promise.all((setsResp.data || []).map(async (set: any) => {
      const { data: tracks } = await supabase
        .from('audio_tracks')
        .select('mix_status, status')
        .eq('audio_set_id', set.id)
        .limit(1)

      const hasCompletedVoice = tracks?.some((t: any) => t.status === 'completed')
      const hasCompletedMixing = tracks?.some((t: any) => t.mix_status === 'completed')
      const isMixing = tracks?.some((t: any) => t.mix_status === 'mixing' || t.mix_status === 'pending')

      let mixRatio: string | undefined
      let backgroundTrack: string | undefined
      let frequencyTrack: string | undefined
      let frequencyType: 'pure' | 'solfeggio_binaural' | 'binaural' | undefined

      if (set.metadata) {
        const md = set.metadata as any
        const voiceVol = md.voice_volume
        const bgVol = md.bg_volume
        const freqVol = md.frequency_volume ?? md.binaural_volume

        if (voiceVol !== undefined && bgVol !== undefined) {
          mixRatio = freqVol && freqVol > 0
            ? `${voiceVol}% / ${bgVol}% / ${freqVol}%`
            : `${voiceVol}% / ${bgVol}%`
        }

        backgroundTrack = md.background_track_name
        frequencyTrack = md.frequency_track_name ?? md.binaural_track_name
        frequencyType = md.frequency_type
      }

      const storyInfo = storyMap.get(set.id)
      let area: AreaKey
      let contextLabel: string | undefined

      if (storyInfo) {
        if (storyInfo.entityType === 'vision_board_item') {
          area = 'vision_board'
          contextLabel = storyInfo.title || 'Vision Board Story'
        } else {
          area = 'story'
          contextLabel = storyInfo.title || 'Focus Story'
        }
      } else if (set.vision_id) {
        area = 'life_vision'
        const vInfo = versionMap.get(set.vision_id)
        contextLabel = vInfo ? `Version ${vInfo.number}${vInfo.isActive ? ' (Active)' : ''}` : undefined
      } else {
        area = 'life_vision'
      }

      return {
        id: set.id,
        name: set.name,
        description: set.description || '',
        variant: set.variant,
        voice_id: set.voice_id,
        is_active: set.is_active,
        created_at: set.created_at,
        track_count: set.audio_tracks?.[0]?.count || 0,
        isReady: !!(hasCompletedVoice && (set.variant === 'standard' || set.variant === 'personal' || hasCompletedMixing)),
        isMixing: !!isMixing,
        mixRatio,
        backgroundTrack,
        frequencyTrack,
        frequencyType,
        area,
        contextLabel,
        metadata: set.metadata,
      } as AudioSetItem
    }))

    setAllSets(enriched)
    setLoading(false)
  }

  async function loadAudioTracks(audioSetId: string) {
    setLoadingTracks(true)
    const supabase = createClient()

    const { data: audioSet } = await supabase
      .from('audio_sets')
      .select('variant')
      .eq('id', audioSetId)
      .single()

    const { data: tracks, error: tracksError } = await supabase
      .from('audio_tracks')
      .select('*')
      .eq('audio_set_id', audioSetId)
      .eq('status', 'completed')
      .not('audio_url', 'is', null)
      .order('section_key')

    if (tracksError) {
      console.error('Error loading tracks:', tracksError)
      setLoadingTracks(false)
      return
    }

    const sectionMap = new Map<string, string>([
      ['forward', 'Forward'], ['fun', 'Fun'], ['health', 'Health'],
      ['travel', 'Travel'], ['love', 'Love'], ['family', 'Family'],
      ['social', 'Social'], ['home', 'Home'], ['work', 'Work'],
      ['money', 'Money'], ['stuff', 'Stuff'], ['giving', 'Giving'],
      ['spirituality', 'Spirituality'], ['conclusion', 'Conclusion'],
    ])

    const canonicalOrder = [
      'forward', 'fun', 'health', 'travel', 'love', 'family',
      'social', 'home', 'work', 'money', 'stuff', 'giving',
      'spirituality', 'conclusion'
    ]

    const formattedTracks: AudioTrack[] = (tracks || [])
      .map(track => {
        const useDirectAudio = audioSet?.variant === 'standard' || audioSet?.variant === 'personal'
        const url = !useDirectAudio && track.mixed_audio_url && track.mix_status === 'completed'
          ? track.mixed_audio_url
          : track.audio_url

        const rawDuration = track.duration_seconds
        const validDuration = typeof rawDuration === 'number' && isFinite(rawDuration) && rawDuration > 0
          ? rawDuration
          : 0

        return {
          id: track.id,
          title: sectionMap.get(track.section_key) || track.section_key,
          artist: '',
          duration: validDuration,
          url: url || '',
          thumbnail: '',
          sectionKey: track.section_key
        }
      })
      .filter(track => track.url && track.url.length > 0)
      .sort((a, b) => {
        const indexA = canonicalOrder.indexOf(a.sectionKey)
        const indexB = canonicalOrder.indexOf(b.sectionKey)
        if (indexA === -1) return 1
        if (indexB === -1) return -1
        return indexA - indexB
      })

    setAudioTracks(formattedTracks)
    setLoadingTracks(false)
  }

  const handleAreaChange = (area: AreaKey) => {
    setSelectedArea(area)
    localStorage.setItem('audioHub_area', area)
    setPlayMode('sections')
  }

  const handleSelectSet = async (setId: string) => {
    setSelectedAudioSetId(setId)
    setPlayMode('sections')
    await loadAudioTracks(setId)
    localStorage.setItem(`audioHub_set_${selectedArea}`, setId)
  }

  const handleDelete = (setId: string, setName: string) => {
    setSetToDelete({ id: setId, name: setName })
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!setToDelete) return

    setDeleting(setToDelete.id)
    setShowDeleteDialog(false)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('audio_sets')
        .delete()
        .eq('id', setToDelete.id)

      if (error) {
        console.error('Error deleting audio set:', error)
        alert('Failed to delete audio version. Please try again.')
      } else {
        const updated = allSets.filter(s => s.id !== setToDelete.id)
        setAllSets(updated)

        if (selectedAudioSetId === setToDelete.id) {
          setSelectedAudioSetId(null)
          setAudioTracks([])
          const remaining = updated.filter(s => s.area === selectedArea && s.isReady)
          if (remaining.length > 0) {
            setSelectedAudioSetId(remaining[0].id)
            await loadAudioTracks(remaining[0].id)
            localStorage.setItem(`audioHub_set_${selectedArea}`, remaining[0].id)
          } else {
            localStorage.removeItem(`audioHub_set_${selectedArea}`)
          }
        }
      }
    } catch (err) {
      console.error('Error deleting audio set:', err)
      alert('Failed to delete audio version. Please try again.')
    } finally {
      setDeleting(null)
      setSetToDelete(null)
    }
  }

  // --- Display helpers ---

  const getVariantIcon = (set: AudioSetItem) => {
    const iconClass = "w-6 h-6"
    if (set.variant === 'personal') return <Mic className={iconClass} />

    let voiceVolume = 100
    let bgVolume = 0
    if (set.mixRatio) {
      const m = set.mixRatio.match(/(\d+)%\s*\/\s*(\d+)%/)
      if (m) { voiceVolume = parseInt(m[1]); bgVolume = parseInt(m[2]) }
    }

    if (bgVolume === 0 || set.variant === 'standard') return <Headphones className={iconClass} />
    if (voiceVolume <= 30) return <Moon className={iconClass} />
    if (voiceVolume >= 40 && voiceVolume <= 60) return <Sparkles className={iconClass} />
    return <Zap className={iconClass} />
  }

  const getVariantColor = (set: AudioSetItem) => {
    if (set.variant === 'personal') return 'bg-secondary-500/20 text-secondary-500'

    let voiceVolume = 100
    let bgVolume = 0
    if (set.mixRatio) {
      const m = set.mixRatio.match(/(\d+)%\s*\/\s*(\d+)%/)
      if (m) { voiceVolume = parseInt(m[1]); bgVolume = parseInt(m[2]) }
    }

    if (bgVolume === 0 || set.variant === 'standard') return 'bg-primary-500/20 text-primary-500'
    if (voiceVolume <= 30) return 'bg-blue-500/20 text-blue-400'
    if (voiceVolume >= 40 && voiceVolume <= 60) return 'bg-purple-500/20 text-purple-400'
    return 'bg-yellow-500/20 text-yellow-400'
  }

  const getVariantDisplayInfo = (set: AudioSetItem) => {
    if (set.variant === 'personal') return { title: 'Personal Recording', description: 'Your own voice' }

    let voiceVolume = 100
    let bgVolume = 0
    if (set.mixRatio) {
      const m = set.mixRatio.match(/(\d+)%\s*\/\s*(\d+)%/)
      if (m) { voiceVolume = parseInt(m[1]); bgVolume = parseInt(m[2]) }
    }

    if (bgVolume === 0 || set.variant === 'standard') return { title: 'Voice Only', description: 'Pure voice narration' }
    if (voiceVolume <= 30) return { title: 'Sleep', description: `${voiceVolume}% voice, ${bgVolume}% background` }
    if (voiceVolume >= 40 && voiceVolume <= 60) return { title: 'Meditation', description: `${voiceVolume}% voice, ${bgVolume}% background` }
    return { title: 'Power', description: `${voiceVolume}% voice, ${bgVolume}% background` }
  }

  const getVoiceDisplayName = (voiceId: string) => {
    const voiceMap: Record<string, string> = {
      'alloy': 'Clear & Professional',
      'shimmer': 'Gentle & Soothing (Female)',
      'ash': 'Warm & Friendly (Male)',
      'coral': 'Bright & Energetic (Female)',
      'echo': 'Deep & Authoritative (Male)',
      'fable': 'Storytelling & Expressive (Male)',
      'onyx': 'Strong & Confident (Male)',
      'nova': 'Fresh & Modern (Female)',
      'sage': 'Excited & Firm (Female)',
    }
    return voiceMap[voiceId] || voiceId
  }

  const getSetDisplayName = (set: AudioSetItem) => {
    if (set.name && !set.name.includes('Version') && !set.name.includes(':'))
      return set.name
    return getVariantDisplayInfo(set).title
  }

  const areaIcon = (area: AreaKey) => {
    if (area === 'story') return <BookOpen className="w-5 h-5" />
    if (area === 'life_vision') return <Eye className="w-5 h-5" />
    return <Target className="w-5 h-5" />
  }

  // --- Derived data ---

  const filteredSets = allSets.filter(s => s.area === selectedArea)
  const selectedSet = allSets.find(s => s.id === selectedAudioSetId)

  const storySetsCount = allSets.filter(s => s.area === 'story').length
  const lvSetsCount = allSets.filter(s => s.area === 'life_vision').length
  const vbSetsCount = allSets.filter(s => s.area === 'vision_board').length

  if (loading) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          eyebrow="THE LIFE I CHOOSE"
          title="Audio Hub"
          subtitle="Listen to all your audio sets across Life Vision, Story, and Vision Board."
        />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <TrackingMilestoneCard label="Story" value={storySetsCount} theme="accent" />
          <TrackingMilestoneCard label="Life Vision" value={lvSetsCount} theme="primary" />
          <TrackingMilestoneCard label="Vision Board" value={vbSetsCount} theme="secondary" />
        </div>

        {/* Area Selector */}
        <div className="flex justify-center">
          <Toggle
            value={selectedArea}
            onChange={handleAreaChange}
            options={AREAS}
          />
        </div>

        {/* Audio Sets + Player */}
        {filteredSets.length === 0 ? (
          <Card variant="elevated" className="p-4 md:p-6 lg:p-8 text-center">
            <Music className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Audio Sets</h3>
            <p className="text-neutral-400">No audio sets found for this area yet.</p>
          </Card>
        ) : (
          <Card variant="elevated" className="bg-[#0A0A0A]">
            {/* Set Selector Dropdown */}
            <div className="mb-8">
              <h2 className="text-xl md:text-2xl font-semibold text-white mb-6 text-center">Select Audio Set</h2>

              <div className="relative max-w-2xl mx-auto">
                <button
                  type="button"
                  onClick={() => setIsSetDropdownOpen(!isSetDropdownOpen)}
                  className="w-full px-4 md:px-6 py-3 md:py-3.5 rounded-full bg-[#1F1F1F] text-white border-2 border-[#333] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {selectedSet ? (
                      <>
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getVariantColor(selectedSet)}`}>
                          {getVariantIcon(selectedSet)}
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <div className="font-semibold truncate">{getSetDisplayName(selectedSet)}</div>
                          {selectedSet.contextLabel && (
                            <div className="text-xs text-neutral-400 truncate">{selectedSet.contextLabel}</div>
                          )}
                        </div>
                      </>
                    ) : (
                      <span className="text-neutral-400">Select an audio set...</span>
                    )}
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <svg className={`w-5 h-5 text-neutral-400 transition-transform ${isSetDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isSetDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsSetDropdownOpen(false)} />
                    <div className="absolute z-20 w-full mt-2 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-[60vh] overflow-y-auto">
                      {[...filteredSets].sort((a, b) => {
                        if (a.id === selectedAudioSetId) return -1
                        if (b.id === selectedAudioSetId) return 1
                        return 0
                      }).map((set) => (
                        <div
                          key={set.id}
                          onClick={() => {
                            if (set.isReady) {
                              handleSelectSet(set.id)
                              setIsSetDropdownOpen(false)
                            }
                          }}
                          className={`px-4 py-3 transition-colors border-b border-[#333] last:border-b-0 ${
                            selectedAudioSetId === set.id ? 'bg-primary-500/10' : ''
                          } ${set.isReady ? 'hover:bg-[#2A2A2A] cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getVariantColor(set)}`}>
                              {getVariantIcon(set)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-white pr-2">{getSetDisplayName(set)}</h4>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {selectedAudioSetId === set.id && (
                                    <div className="hidden md:flex items-center gap-1 px-2 py-0.5 bg-primary-500 text-black text-xs font-semibold rounded-full">
                                      <Play className="w-3 h-3" fill="currentColor" />
                                      <span>Playing</span>
                                    </div>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDelete(set.id, set.name)
                                      setIsSetDropdownOpen(false)
                                    }}
                                    className="p-1 hover:bg-[#FF0040]/20 rounded transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4 text-[#FF0040]" />
                                  </button>
                                </div>
                              </div>

                              {selectedAudioSetId === set.id && (
                                <div className="flex md:hidden items-center gap-1 px-2 py-0.5 bg-primary-500 text-black text-xs font-semibold rounded-full mb-2 w-fit">
                                  <Play className="w-3 h-3" fill="currentColor" />
                                  <span>Playing</span>
                                </div>
                              )}

                              <div className="space-y-1 text-xs text-neutral-400">
                                {set.contextLabel && (
                                  <div>
                                    <span className="text-neutral-500">Source:</span> {set.contextLabel}
                                  </div>
                                )}
                                <div>
                                  <span className="text-neutral-500">Voice:</span> {set.variant === 'personal' ? 'Personal Recording' : getVoiceDisplayName(set.voice_id)}
                                </div>
                                {set.backgroundTrack && (
                                  <div>
                                    <span className="text-neutral-500">Background:</span> {set.backgroundTrack}
                                  </div>
                                )}
                                {set.mixRatio && (
                                  <div>
                                    <span className="text-neutral-500">Ratio:</span>{' '}
                                    <span className="text-primary-400">
                                      {(() => {
                                        const m = set.mixRatio.match(/(\d+)%\s*\/\s*(\d+)%/)
                                        return m ? `${m[1]}% Voice / ${m[2]}% Background` : set.mixRatio
                                      })()}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 pt-1">
                                  <span>{set.track_count} tracks</span>
                                  <span>&bull;</span>
                                  <span>{new Date(set.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Player */}
            {selectedAudioSetId && selectedSet && (
              <div className="mt-8">
                <div className="max-w-2xl mx-auto">
                  {loadingTracks ? (
                    <div className="flex items-center justify-center py-12">
                      <Spinner size="lg" />
                    </div>
                  ) : audioTracks.length > 0 ? (
                    (() => {
                      const sectionTracks = audioTracks.filter(t => t.sectionKey !== 'full')
                      const fullTrack = audioTracks.find(t => t.sectionKey === 'full')
                      const hasFullTrack = !!fullTrack
                      const displayTracks = playMode === 'sections' ? sectionTracks : (fullTrack ? [fullTrack] : [])

                      const formatDuration = (seconds: number) => {
                        if (!seconds || !isFinite(seconds) || isNaN(seconds)) return '0:00'
                        const mins = Math.floor(seconds / 60)
                        const secs = Math.floor(seconds % 60)
                        return `${mins}:${secs.toString().padStart(2, '0')}`
                      }

                      return (
                        <>
                          {hasFullTrack && (
                            <div className="flex justify-center mb-6">
                              <Toggle
                                value={playMode}
                                onChange={setPlayMode}
                                options={[
                                  { value: 'sections', label: `${sectionTracks.length} Sections` },
                                  { value: 'full', label: `Full Track (${fullTrack.duration ? formatDuration(fullTrack.duration) : '~15 min'})` }
                                ]}
                              />
                            </div>
                          )}

                          <PlaylistPlayer
                            tracks={displayTracks}
                            setIcon={
                              <div className={`p-2 rounded-lg ${getVariantColor(selectedSet)}`}>
                                {getVariantIcon(selectedSet)}
                              </div>
                            }
                            setName={getSetDisplayName(selectedSet)}
                            voiceName={selectedSet.variant === 'personal'
                              ? 'Personal Recording'
                              : getVoiceDisplayName(selectedSet.voice_id)}
                            backgroundTrack={selectedSet.backgroundTrack}
                            mixRatio={(() => {
                              if (!selectedSet.mixRatio) return undefined
                              const m = selectedSet.mixRatio.match(/(\d+)%\s*\/\s*(\d+)%/)
                              return m ? `${m[1]}% Voice / ${m[2]}% Background` : selectedSet.mixRatio
                            })()}
                            trackCount={displayTracks.length}
                            createdDate={new Date(selectedSet.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            onRename={async (newName: string) => {
                              const supabase = createClient()
                              try {
                                const { error } = await supabase
                                  .from('audio_sets')
                                  .update({ name: newName })
                                  .eq('id', selectedSet.id)
                                if (error) throw error
                                setAllSets(allSets.map(s => s.id === selectedSet.id ? { ...s, name: newName } : s))
                              } catch (err) {
                                console.error('Error updating audio set name:', err)
                                alert('Failed to update name. Please try again.')
                              }
                            }}
                          />
                        </>
                      )
                    })()
                  ) : (
                    <Card variant="glass" className="p-4 md:p-6 lg:p-8 text-center">
                      <Music className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                      <p className="text-neutral-400">No audio tracks available for this set</p>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </Card>
        )}
      </Stack>

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setSetToDelete(null)
        }}
        onConfirm={confirmDelete}
        itemName={setToDelete?.name || ''}
        itemType="Audio Set"
        isLoading={deleting === setToDelete?.id}
        loadingText="Deleting audio set..."
      />
    </Container>
  )
}
