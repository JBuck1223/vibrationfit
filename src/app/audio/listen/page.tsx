'use client'

import React, { useEffect, useState } from 'react'
import { Container, Stack, Card, Button, Spinner, DeleteConfirmationDialog, Toggle } from '@/lib/design-system/components'
import { PlaylistPlayer, type AudioTrack as BaseAudioTrack } from '@/lib/design-system'
import { useAreaStats } from '@/hooks/useAreaStats'
import { createClient } from '@/lib/supabase/client'
import { Play, Moon, Zap, Sparkles, Headphones, Plus, Mic, Music, Trash2, Flame, Shield, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useAudioStudio, type AudioSetItem } from '@/components/audio-studio'

interface AudioTrack extends BaseAudioTrack {
  sectionKey: string
}

export default function AudioListenPage() {
  const { visionId, vision, visionLoading, audioSets, audioSetsLoading, refreshAudioSets } = useAudioStudio()
  const { stats: practiceStats } = useAreaStats('vision-audio')

  const [selectedAudioSetId, setSelectedAudioSetId] = useState<string | null>(null)
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([])
  const [loadingTracks, setLoadingTracks] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [setToDelete, setSetToDelete] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [playMode, setPlayMode] = useState<'sections' | 'full'>('sections')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [totalPlays, setTotalPlays] = useState(0)
  const [freezeOpen, setFreezeOpen] = useState(false)
  const [statsExpanded, setStatsExpanded] = useState(false)
  const freezeRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!freezeOpen) return
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (freezeRef.current && !freezeRef.current.contains(e.target as Node)) {
        setFreezeOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [freezeOpen])

  // Auto-select first ready set when audio sets load
  useEffect(() => {
    if (audioSetsLoading || audioSets.length === 0) return

    const savedKey = visionId ? `audioSetSelection_${visionId}` : null
    const saved = savedKey ? localStorage.getItem(savedKey) : null
    let target = saved ? audioSets.find(s => s.id === saved && s.isReady) : null
    if (!target) target = audioSets.find(s => s.isReady) || null

    if (target) {
      setSelectedAudioSetId(target.id)
      loadAudioTracks(target.id)
    }
  }, [audioSets, audioSetsLoading, visionId])

  // Load total plays
  useEffect(() => {
    if (!visionId) return
    ;(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: playsData } = await supabase.rpc('get_user_total_audio_plays', { p_user_id: user.id })
        setTotalPlays(playsData ?? 0)
      }
    })()
  }, [visionId])

  async function loadAudioTracks(audioSetId: string) {
    setLoadingTracks(true)
    const supabase = createClient()

    const { data: audioSet } = await supabase
      .from('audio_sets')
      .select('variant')
      .eq('id', audioSetId)
      .single()

    const { data: tracks, error } = await supabase
      .from('audio_tracks')
      .select('*')
      .eq('audio_set_id', audioSetId)
      .eq('status', 'completed')
      .not('audio_url', 'is', null)
      .order('section_key')

    if (error) {
      setLoadingTracks(false)
      return
    }

    const sectionMap = new Map<string, string>([
      ['forward', 'Forward'], ['fun', 'Fun'], ['health', 'Health'],
      ['travel', 'Travel'], ['love', 'Love'], ['family', 'Family'],
      ['social', 'Social'], ['home', 'Home'], ['work', 'Work'],
      ['money', 'Money'], ['stuff', 'Stuff'], ['giving', 'Giving'],
      ['spirituality', 'Spirituality'], ['conclusion', 'Conclusion'],
      ['full', 'Full Life Vision'],
    ])

    const canonicalOrder = [
      'forward', 'fun', 'health', 'travel', 'love', 'family',
      'social', 'home', 'work', 'money', 'stuff', 'giving',
      'spirituality', 'conclusion',
    ]

    const formatted: AudioTrack[] = (tracks || [])
      .map(track => {
        const useDirectAudio = audioSet?.variant === 'standard' || audioSet?.variant === 'personal'
        const url = !useDirectAudio && track.mixed_audio_url && track.mix_status === 'completed'
          ? track.mixed_audio_url
          : track.audio_url

        const rawDuration = track.duration_seconds
        const validDuration = typeof rawDuration === 'number' && isFinite(rawDuration) && rawDuration > 0
          ? rawDuration : 0

        return {
          id: track.id,
          title: sectionMap.get(track.section_key) || track.section_key,
          artist: '',
          duration: validDuration,
          url: url || '',
          thumbnail: '',
          sectionKey: track.section_key,
        }
      })
      .filter(t => t.url.length > 0)
      .sort((a, b) => {
        const ia = canonicalOrder.indexOf(a.sectionKey)
        const ib = canonicalOrder.indexOf(b.sectionKey)
        if (ia === -1) return 1
        if (ib === -1) return -1
        return ia - ib
      })

    setAudioTracks(formatted)
    setLoadingTracks(false)
  }

  const handleSelectSet = async (setId: string) => {
    setSelectedAudioSetId(setId)
    await loadAudioTracks(setId)
    if (visionId) localStorage.setItem(`audioSetSelection_${visionId}`, setId)
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
      const { error } = await supabase.from('audio_sets').delete().eq('id', setToDelete.id)
      if (error) {
        alert('Failed to delete audio set. Please try again.')
      } else {
        await refreshAudioSets()
        if (selectedAudioSetId === setToDelete.id) {
          setSelectedAudioSetId(null)
          setAudioTracks([])
        }
      }
    } catch {
      alert('Failed to delete audio set. Please try again.')
    } finally {
      setDeleting(null)
      setSetToDelete(null)
    }
  }

  // Display helpers
  const getVariantIcon = (set: AudioSetItem) => {
    const cls = 'w-6 h-6'
    if (set.variant === 'personal') return <Mic className={cls} />
    let voiceVol = 100, bgVol = 0
    if (set.mixRatio) {
      const m = set.mixRatio.match(/(\d+)%\s*\/\s*(\d+)%/)
      if (m) { voiceVol = parseInt(m[1]); bgVol = parseInt(m[2]) }
    }
    if (bgVol === 0 || set.variant === 'standard') return <Headphones className={cls} />
    if (voiceVol <= 30) return <Moon className={cls} />
    if (voiceVol >= 40 && voiceVol <= 60) return <Sparkles className={cls} />
    return <Zap className={cls} />
  }

  const getVariantColor = (set: AudioSetItem) => {
    if (set.variant === 'personal') return 'bg-secondary-500/20 text-secondary-500'
    let voiceVol = 100, bgVol = 0
    if (set.mixRatio) {
      const m = set.mixRatio.match(/(\d+)%\s*\/\s*(\d+)%/)
      if (m) { voiceVol = parseInt(m[1]); bgVol = parseInt(m[2]) }
    }
    if (bgVol === 0 || set.variant === 'standard') return 'bg-primary-500/20 text-primary-500'
    if (voiceVol <= 30) return 'bg-blue-500/20 text-blue-400'
    if (voiceVol >= 40 && voiceVol <= 60) return 'bg-purple-500/20 text-purple-400'
    return 'bg-yellow-500/20 text-yellow-400'
  }

  const getVariantDisplayInfo = (set: AudioSetItem) => {
    if (set.variant === 'personal') return { title: 'Personal Recording', description: 'Your own voice' }
    let voiceVol = 100, bgVol = 0
    if (set.mixRatio) {
      const m = set.mixRatio.match(/(\d+)%\s*\/\s*(\d+)%/)
      if (m) { voiceVol = parseInt(m[1]); bgVol = parseInt(m[2]) }
    }
    if (bgVol === 0 || set.variant === 'standard') return { title: 'Voice Only', description: 'Pure voice narration' }
    if (voiceVol <= 30) return { title: 'Sleep', description: `${voiceVol}% voice, ${bgVol}% background` }
    if (voiceVol >= 40 && voiceVol <= 60) return { title: 'Meditation', description: `${voiceVol}% voice, ${bgVol}% background` }
    return { title: 'Power', description: `${voiceVol}% voice, ${bgVol}% background` }
  }

  const getVoiceDisplayName = (voiceId: string) => {
    const map: Record<string, string> = {
      alloy: 'Clear & Professional', shimmer: 'Gentle & Soothing (Female)',
      ash: 'Warm & Friendly (Male)', coral: 'Bright & Energetic (Female)',
      echo: 'Deep & Authoritative (Male)', fable: 'Storytelling & Expressive (Male)',
      onyx: 'Strong & Confident (Male)', nova: 'Fresh & Modern (Female)',
      sage: 'Excited & Firm (Female)',
    }
    return map[voiceId] || voiceId
  }

  const getSetDisplayName = (set: AudioSetItem) => {
    if (set.name && !set.name.includes('Version') && !set.name.includes(':')) return set.name
    return getVariantDisplayInfo(set).title
  }

  const totalSets = audioSets.length
  const totalTracks = audioSets.reduce((sum, s) => sum + s.track_count, 0)

  if (visionLoading || audioSetsLoading) {
    return (
      <Container size="xl" className="py-8">
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl" className="py-6">
      <Stack gap="lg">
        {/* Stats Row */}
        <div className="relative rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#39FF14]/[0.04] via-[#111] to-[#111]">
          <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_top_left,_rgba(57,255,20,0.08)_0%,_transparent_50%)] pointer-events-none" />
          <div className="relative p-5 md:p-6">
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <Headphones className="w-4 h-4 text-[#39FF14]" />
              <h3 className="text-neutral-300 font-medium text-sm tracking-wide uppercase">Vision Audio</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3.5 py-3">
                <p className="text-neutral-500 text-[11px] leading-tight mb-1.5">Current Streak</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-white font-semibold text-lg leading-none flex items-center gap-1.5">
                    {(practiceStats?.currentStreak ?? 0) >= 1 && <Flame className="w-4 h-4 text-orange-400" />}
                    {practiceStats?.currentStreak ?? 0}
                    <span className="font-normal text-neutral-500">{(practiceStats?.currentStreak ?? 0) === 1 ? 'day' : 'days'}</span>
                  </p>
                  {(practiceStats?.streakFreezeAvailable || practiceStats?.streakFreezeUsedThisWeek) && (
                    <div className="relative ml-auto flex items-center" ref={freezeRef}>
                      <button type="button" className="flex items-center" onClick={() => setFreezeOpen(prev => !prev)}>
                        <Shield className={`w-3.5 h-3.5 cursor-help ${practiceStats?.streakFreezeUsedThisWeek ? 'text-blue-500/40' : 'text-blue-400'}`} />
                      </button>
                      <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 rounded-xl bg-neutral-900 border border-blue-500/20 p-3 shadow-xl transition-all duration-200 z-[100] ${freezeOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                        <p className="text-sm font-semibold text-blue-400 mb-1">
                          Streak Freeze <span className="font-normal text-blue-400/70">({practiceStats?.streakFreezeUsedThisWeek ? 'Used this week' : 'Available'})</span>
                        </p>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          {practiceStats?.streakFreezeUsedThisWeek
                            ? 'Your streak was saved this week. You get 1 free grace day per week for each habit.'
                            : 'You get 1 free grace day per week. If you miss a day, your streak stays alive so one off-day doesn\'t wipe out your progress.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3.5 py-3">
                <p className="text-neutral-500 text-[11px] leading-tight mb-1.5">Reps this Week</p>
                <p className="text-white font-semibold text-lg leading-none">{practiceStats?.countLast7 ?? 0}<span className="font-normal text-neutral-500">/7</span></p>
              </div>
              {[
                { label: 'Reps this Month', value: <>{practiceStats?.countLast30 ?? 0}<span className="font-normal text-neutral-500">/30</span></> },
                { label: 'Total Rep Days', value: (practiceStats?.countAllTime ?? 0).toLocaleString() },
                { label: 'Sets Generated', value: totalSets.toLocaleString() },
                { label: 'Tracks Generated', value: totalTracks.toLocaleString() },
                { label: 'All-Time Plays', value: totalPlays.toLocaleString() },
              ].map(stat => (
                <div key={stat.label} className={`rounded-xl bg-white/[0.03] border border-white/[0.06] px-3.5 py-3 ${statsExpanded ? '' : 'hidden'} sm:block`}>
                  <p className="text-neutral-500 text-[11px] leading-tight mb-1.5">{stat.label}</p>
                  <p className="text-white font-semibold text-lg leading-none">{stat.value}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setStatsExpanded(prev => !prev)}
              className="flex items-center justify-center gap-1.5 w-full mt-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-300 transition-colors sm:hidden"
            >
              {statsExpanded ? 'Show less' : 'View all stats'}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${statsExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Audio Sets + Player */}
        {audioSets.length === 0 ? (
          <Card variant="elevated" className="p-8 md:p-12 text-center">
            <Music className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Audio Sets Yet</h3>
            <p className="text-neutral-400 mb-6">Create your first audio set to bring your vision to life through sound.</p>
            <Button variant="primary" asChild>
              <Link href="/audio/generate">
                <Plus className="w-4 h-4 mr-2" />
                Create Audio Set
              </Link>
            </Button>
          </Card>
        ) : (
          <Card variant="elevated" className="bg-[#0A0A0A]">
            {/* Set Selector */}
            <div className="mb-8">
              <h2 className="text-xl md:text-2xl font-semibold text-white mb-6 text-center">Select Audio Set</h2>
              <div className="relative max-w-2xl mx-auto">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full px-4 md:px-6 py-3 md:py-3.5 rounded-full bg-[#1F1F1F] text-white border-2 border-[#333] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {selectedAudioSetId ? (() => {
                      const set = audioSets.find(s => s.id === selectedAudioSetId)
                      if (!set) return <span className="text-neutral-400">Select an audio set...</span>
                      return (
                        <>
                          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getVariantColor(set)}`}>
                            {getVariantIcon(set)}
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <div className="font-semibold truncate">{getSetDisplayName(set)}</div>
                          </div>
                        </>
                      )
                    })() : (
                      <span className="text-neutral-400">Select an audio set...</span>
                    )}
                  </div>
                  <svg className={`w-5 h-5 text-neutral-400 transition-transform flex-shrink-0 ml-2 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                    <div className="absolute z-20 w-full mt-2 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-[60vh] overflow-y-auto">
                      {[...audioSets].sort((a, b) => {
                        if (a.id === selectedAudioSetId) return -1
                        if (b.id === selectedAudioSetId) return 1
                        return 0
                      }).map(set => (
                        <div
                          key={set.id}
                          onClick={() => {
                            if (set.isReady) {
                              handleSelectSet(set.id)
                              setIsDropdownOpen(false)
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
                                    onClick={e => {
                                      e.stopPropagation()
                                      handleDelete(set.id, set.name)
                                      setIsDropdownOpen(false)
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
                                <div>
                                  <span className="text-neutral-500">Voice:</span> {set.variant === 'personal' ? 'Personal Recording' : getVoiceDisplayName(set.voice_id)}
                                </div>
                                {set.backgroundTrack && (
                                  <div><span className="text-neutral-500">Background:</span> {set.backgroundTrack}</div>
                                )}
                                {set.mixRatio && (
                                  <div>
                                    <span className="text-neutral-500">Ratio:</span>{' '}
                                    <span className="text-primary-400">
                                      {(() => {
                                        const m = set.mixRatio!.match(/(\d+)%\s*\/\s*(\d+)%/)
                                        return m ? `${m[1]}% Voice / ${m[2]}% Background` : set.mixRatio
                                      })()}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 pt-1">
                                  <span>{set.track_count} {set.track_count === 1 ? 'track' : 'tracks'}</span>
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
            {selectedAudioSetId && (
              <div className="mt-8">
                <div className="max-w-2xl mx-auto">
                  {loadingTracks ? (
                    <div className="flex items-center justify-center py-12"><Spinner size="lg" /></div>
                  ) : audioTracks.length > 0 ? (() => {
                    const sectionTracks = audioTracks.filter(t => t.sectionKey !== 'full')
                    const fullTrack = audioTracks.find(t => t.sectionKey === 'full')
                    const hasFullTrack = !!fullTrack
                    const effectivePlayMode = (playMode === 'sections' && sectionTracks.length === 0 && hasFullTrack) ? 'full' : playMode
                    const displayTracks = effectivePlayMode === 'sections' ? sectionTracks : (fullTrack ? [fullTrack] : [])
                    const selectedSet = audioSets.find(s => s.id === selectedAudioSetId)

                    const formatDuration = (seconds: number) => {
                      if (!seconds || !isFinite(seconds)) return '0:00'
                      return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`
                    }

                    return (
                      <>
                        {hasFullTrack && sectionTracks.length > 0 && (
                          <div className="flex justify-center mb-6">
                            <Toggle
                              value={playMode}
                              onChange={setPlayMode}
                              options={[
                                { value: 'sections', label: `${sectionTracks.length} Sections` },
                                { value: 'full', label: `Full Life Vision (${fullTrack!.duration ? formatDuration(fullTrack!.duration) : '~15 min'})` },
                              ]}
                            />
                          </div>
                        )}
                        <PlaylistPlayer
                          tracks={displayTracks}
                          setIcon={selectedSet ? (
                            <div className={`p-2 rounded-lg ${getVariantColor(selectedSet)}`}>
                              {getVariantIcon(selectedSet)}
                            </div>
                          ) : null}
                          setName={selectedSet ? getSetDisplayName(selectedSet) : 'Audio Set'}
                          voiceName={selectedSet ? (selectedSet.variant === 'personal' ? 'Personal Recording' : getVoiceDisplayName(selectedSet.voice_id)) : undefined}
                          backgroundTrack={selectedSet?.backgroundTrack}
                          mixRatio={(() => {
                            if (!selectedSet?.mixRatio) return undefined
                            const m = selectedSet.mixRatio.match(/(\d+)%\s*\/\s*(\d+)%/)
                            return m ? `${m[1]}% Voice / ${m[2]}% Background` : selectedSet.mixRatio
                          })()}
                          trackCount={displayTracks.length}
                          createdDate={selectedSet ? new Date(selectedSet.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined}
                          onRename={async (newName: string) => {
                            if (!selectedSet) return
                            const supabase = createClient()
                            try {
                              const { error } = await supabase.from('audio_sets').update({ name: newName }).eq('id', selectedSet.id)
                              if (error) throw error
                              await refreshAudioSets()
                            } catch {
                              alert('Failed to update name. Please try again.')
                            }
                          }}
                        />
                      </>
                    )
                  })() : (
                    <Card variant="glass" className="p-8 text-center">
                      <Music className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                      <p className="text-neutral-400">No audio tracks available for this set</p>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/audio/generate">
            <Card variant="elevated" hover className="bg-gradient-to-br from-[#199D67]/20 via-[#14B8A6]/10 to-[#8B5CF6]/20 border-[#39FF14]/30 cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#39FF14]/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Plus className="w-6 h-6 text-[#39FF14]" />
                </div>
                <p className="text-white text-lg">Generate more audio sets</p>
              </div>
            </Card>
          </Link>
          <Link href="/audio/record">
            <Card variant="elevated" hover className="bg-gradient-to-br from-[#D03739]/20 via-[#8B5CF6]/10 to-[#14B8A6]/20 border-[#D03739]/30 cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#D03739]/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mic className="w-6 h-6 text-[#D03739]" />
                </div>
                <p className="text-white text-lg">Record life vision in your voice</p>
              </div>
            </Card>
          </Link>
        </div>
      </Stack>

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => { setShowDeleteDialog(false); setSetToDelete(null) }}
        onConfirm={confirmDelete}
        itemName={setToDelete?.name || ''}
        itemType="Audio Set"
        isLoading={deleting === setToDelete?.id}
        loadingText="Deleting audio set..."
      />
    </Container>
  )
}
