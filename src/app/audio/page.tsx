'use client'

import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Container, Stack, Card, Button, Spinner, Toggle, DeleteConfirmationDialog } from '@/lib/design-system/components'
import { PlaylistPlayer, type AudioTrack as BaseAudioTrack } from '@/lib/design-system'
import { createClient } from '@/lib/supabase/client'
import {
  Headphones, Moon, Zap, Flame, Shield,
  Sparkles, Mic, Music, Trash2, BookOpen, Image,
  Volume2, Plus, Music2, ChevronDown, CheckCircle, Target, Lightbulb,
  Clock, ChevronRight, Library,
} from 'lucide-react'
import { useAudioStudio, type AudioSetItem } from '@/components/audio-studio'
import { useAreaStats } from '@/hooks/useAreaStats'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'

interface AudioTrack extends BaseAudioTrack {
  sectionKey: string
}

const ENTITY_META: Record<string, { label: string; badgeColor: string; icon: React.ElementType }> = {
  life_vision: { label: 'Life Vision', badgeColor: 'text-purple-400 bg-purple-500/20 border-purple-500/30', icon: Target },
  vision_board_item: { label: 'Vision Board', badgeColor: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30', icon: Image },
  journal_entry: { label: 'Journal', badgeColor: 'text-teal-400 bg-teal-500/20 border-teal-500/30', icon: BookOpen },
  custom: { label: 'Custom', badgeColor: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30', icon: Lightbulb },
  goal: { label: 'Goal', badgeColor: 'text-green-400 bg-green-500/20 border-green-500/30', icon: BookOpen },
  schedule_block: { label: 'Schedule', badgeColor: 'text-orange-400 bg-orange-500/20 border-orange-500/30', icon: Clock },
}

export default function AudioListenPage() {
  const {
    visionId, visionLoading,
    audioSets, audioSetsLoading, refreshAudioSets,
    listenContentType: contentType,
    listenStoryFilter,
    storiesWithAudio: stories, storiesWithAudioLoading: storiesLoading,
    playTracks, player, pausePlayer, resumePlayer, currentTime: playerCurrentTime, duration: playerDuration,
  } = useAudioStudio()

  // Vision state
  const [selectedAudioSetId, setSelectedAudioSetId] = useState<string | null>(null)
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([])
  const [loadingTracks, setLoadingTracks] = useState(false)
  const [playMode, setPlayMode] = useState<'sections' | 'full'>('sections')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [setToDelete, setSetToDelete] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Story audio state
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null)
  const [storyAudioTracks, setStoryAudioTracks] = useState<{ id: string; label: string; sublabel: string; url: string; icon: React.ElementType; iconColor: string }[]>([])
  const [storyAudioLoading, setStoryAudioLoading] = useState(false)
  const [selectedStoryAudioId, setSelectedStoryAudioId] = useState<string | null>(null)
  const [storyDropdownOpen, setStoryDropdownOpen] = useState(false)
  const storyDropdownRef = useRef<HTMLDivElement>(null)

  // Stats
  const [totalPlays, setTotalPlays] = useState(0)
  const [statsExpanded, setStatsExpanded] = useState(false)
  const [freezeOpen, setFreezeOpen] = useState(false)
  const freezeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!freezeOpen) return
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (freezeRef.current && !freezeRef.current.contains(e.target as Node)) setFreezeOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => { document.removeEventListener('mousedown', handleOutside); document.removeEventListener('touchstart', handleOutside) }
  }, [freezeOpen])

  useEffect(() => { loadTotalPlays() }, [])

  useEffect(() => {
    if (audioSetsLoading || audioSets.length === 0) return
    const saved = visionId ? localStorage.getItem(`audioSetSelection_${visionId}`) : null
    let target = saved ? audioSets.find(s => s.id === saved && s.isReady) : null
    if (!target) target = audioSets.find(s => s.isReady) || null
    if (target) { setSelectedAudioSetId(target.id); loadAudioTracks(target.id) }
  }, [audioSets, audioSetsLoading, visionId])

  const VOICE_NAMES: Record<string, string> = { alloy: 'Alloy', shimmer: 'Shimmer', ash: 'Ash', coral: 'Coral', echo: 'Echo', fable: 'Fable', onyx: 'Onyx', nova: 'Nova', sage: 'Sage' }

  useEffect(() => {
    if (storiesLoading) return
    const visible = listenStoryFilter === 'all'
      ? stories
      : stories.filter(s => s.entity_type === listenStoryFilter)
    if (visible.length === 0) { setSelectedStoryId(null); return }
    if (!selectedStoryId || !visible.some(s => s.id === selectedStoryId)) {
      setSelectedStoryId(visible[0].id)
    }
  }, [stories, storiesLoading, listenStoryFilter])

  useEffect(() => {
    if (selectedStoryId) loadStoryAudio(selectedStoryId)
  }, [selectedStoryId])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (storyDropdownRef.current && !storyDropdownRef.current.contains(e.target as Node)) setStoryDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function loadStoryAudio(storyId: string) {
    setStoryAudioLoading(true)
    setStoryAudioTracks([])
    setSelectedStoryAudioId(null)
    const supabase = createClient()
    const story = stories.find(s => s.id === storyId)
    if (!story) { setStoryAudioLoading(false); return }
    const options: typeof storyAudioTracks = []

    // Find audio set: prefer direct link, fall back to content_id lookup
    let audioSetId = story.audio_set_id
    if (!audioSetId) {
      const { data: linkedSet } = await supabase
        .from('audio_sets')
        .select('id')
        .eq('content_type', 'story')
        .eq('content_id', storyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (linkedSet) audioSetId = linkedSet.id
    }

    if (audioSetId) {
      const { data: tracks } = await supabase
        .from('audio_tracks').select('id, audio_url, voice_id, section_key')
        .eq('audio_set_id', audioSetId).eq('status', 'completed')
        .order('created_at', { ascending: false })
      if (tracks && tracks.length > 0) {
        const storyTitle = story.title || 'Untitled Story'
        tracks.forEach((track, idx) => {
          options.push({
            id: `generated-${track.id}`,
            label: tracks.length > 1 ? `${storyTitle} (${idx + 1}/${tracks.length})` : storyTitle,
            sublabel: '',
            url: track.audio_url,
            icon: Headphones,
            iconColor: 'bg-primary-500/20 text-primary-500',
          })
        })
      }
    }
    if (story.user_audio_url) {
      options.push({
        id: 'user-recording',
        label: 'Personal Recording',
        sublabel: 'Your voice',
        url: story.user_audio_url,
        icon: Mic,
        iconColor: 'bg-teal-500/20 text-teal-400',
      })
    }
    setStoryAudioTracks(options)
    if (options.length > 0) setSelectedStoryAudioId(options[0].id)
    setStoryAudioLoading(false)
  }

  const selectedStory = stories.find(s => s.id === selectedStoryId)
  const selectedStoryAudio = storyAudioTracks.find(t => t.id === selectedStoryAudioId)

  async function loadTotalPlays() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: playsData } = await supabase.rpc('get_user_total_audio_plays', { p_user_id: user.id })
    setTotalPlays(playsData ?? 0)
  }

  async function loadAudioTracks(audioSetId: string) {
    setLoadingTracks(true)
    const supabase = createClient()
    const { data: audioSet } = await supabase.from('audio_sets').select('variant').eq('id', audioSetId).single()
    const { data: tracks } = await supabase
      .from('audio_tracks').select('*').eq('audio_set_id', audioSetId).eq('status', 'completed')
      .not('audio_url', 'is', null).order('section_key')

    const sectionMap = new Map<string, string>([
      ['forward', 'Forward'], ['fun', 'Fun'], ['health', 'Health'], ['travel', 'Travel'],
      ['love', 'Love'], ['family', 'Family'], ['social', 'Social'], ['home', 'Home'],
      ['work', 'Work'], ['money', 'Money'], ['stuff', 'Stuff'], ['giving', 'Giving'],
      ['spirituality', 'Spirituality'], ['conclusion', 'Conclusion'], ['full', 'Full Life Vision'],
    ])
    const canonicalOrder = ['forward', 'fun', 'health', 'travel', 'love', 'family', 'social', 'home', 'work', 'money', 'stuff', 'giving', 'spirituality', 'conclusion']
    const formatted: AudioTrack[] = (tracks || [])
      .map(t => {
        const useDirectAudio = audioSet?.variant === 'standard' || audioSet?.variant === 'personal'
        const url = !useDirectAudio && t.mixed_audio_url && t.mix_status === 'completed' ? t.mixed_audio_url : t.audio_url
        const dur = typeof t.duration_seconds === 'number' && isFinite(t.duration_seconds) && t.duration_seconds > 0 ? t.duration_seconds : 0
        return { id: t.id, title: sectionMap.get(t.section_key) || t.section_key, artist: '', duration: dur, url: url || '', thumbnail: '', sectionKey: t.section_key }
      })
      .filter(t => t.url.length > 0)
      .sort((a, b) => {
        const ia = canonicalOrder.indexOf(a.sectionKey), ib = canonicalOrder.indexOf(b.sectionKey)
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
      })
    setAudioTracks(formatted)
    setLoadingTracks(false)
  }

  const handleSelectSet = async (setId: string) => {
    setSelectedAudioSetId(setId)
    await loadAudioTracks(setId)
    if (visionId) localStorage.setItem(`audioSetSelection_${visionId}`, setId)
  }

  const handleDelete = (setId: string, setName: string) => { setSetToDelete({ id: setId, name: setName }); setShowDeleteDialog(true) }

  const confirmDelete = async () => {
    if (!setToDelete) return
    setDeleting(setToDelete.id); setShowDeleteDialog(false)
    const supabase = createClient()
    const { error } = await supabase.from('audio_sets').delete().eq('id', setToDelete.id)
    if (!error) { await refreshAudioSets(); if (selectedAudioSetId === setToDelete.id) { setSelectedAudioSetId(null); setAudioTracks([]) } }
    setDeleting(null); setSetToDelete(null)
  }

  const getVariantIcon = (set: AudioSetItem) => {
    const cls = 'w-5 h-5'
    if (set.variant === 'personal') return <Mic className={cls} />
    let vv = 100, bv = 0
    if (set.mixRatio) { const m = set.mixRatio.match(/(\d+)%\s*\/\s*(\d+)%/); if (m) { vv = parseInt(m[1]); bv = parseInt(m[2]) } }
    if (bv === 0 || set.variant === 'standard') return <Headphones className={cls} />
    if (vv <= 30) return <Moon className={cls} />
    if (vv >= 40 && vv <= 60) return <Sparkles className={cls} />
    return <Zap className={cls} />
  }
  const getVariantColor = (set: AudioSetItem) => {
    if (set.variant === 'personal') return 'bg-secondary-500/20 text-secondary-500'
    let vv = 100, bv = 0
    if (set.mixRatio) { const m = set.mixRatio.match(/(\d+)%\s*\/\s*(\d+)%/); if (m) { vv = parseInt(m[1]); bv = parseInt(m[2]) } }
    if (bv === 0 || set.variant === 'standard') return 'bg-primary-500/20 text-primary-500'
    if (vv <= 30) return 'bg-blue-500/20 text-blue-400'
    if (vv >= 40 && vv <= 60) return 'bg-purple-500/20 text-purple-400'
    return 'bg-yellow-500/20 text-yellow-400'
  }
  const getSetDisplayName = (set: AudioSetItem) => {
    if (set.name && !set.name.includes('Version') && !set.name.includes(':')) return set.name
    if (set.variant === 'personal') return 'Personal Recording'
    let vv = 100, bv = 0
    if (set.mixRatio) { const m = set.mixRatio.match(/(\d+)%\s*\/\s*(\d+)%/); if (m) { vv = parseInt(m[1]); bv = parseInt(m[2]) } }
    if (bv === 0 || set.variant === 'standard') return 'Voice Only'
    if (vv <= 30) return 'Sleep'
    if (vv >= 40 && vv <= 60) return 'Meditation'
    return 'Power'
  }
  const getVoiceDisplayName = (voiceId: string) => {
    const map: Record<string, string> = { alloy: 'Alloy', shimmer: 'Shimmer', ash: 'Ash', coral: 'Coral', echo: 'Echo', fable: 'Fable', onyx: 'Onyx', nova: 'Nova', sage: 'Sage' }
    return map[voiceId] || voiceId
  }

  const filteredStories = listenStoryFilter === 'all'
    ? stories
    : stories.filter(s => s.entity_type === listenStoryFilter)

  const { stats: practiceStats } = useAreaStats('vision-audio')
  const totalSets = audioSets.length
  const totalTracks = audioSets.reduce((sum, s) => sum + s.track_count, 0)
  const selectedSet = audioSets.find(s => s.id === selectedAudioSetId)

  if (visionLoading) {
    return <Container size="xl" className="py-8"><div className="flex min-h-[40vh] items-center justify-center"><Spinner size="lg" /></div></Container>
  }

  return (
    <Container size="xl" className="py-6">
      <Stack gap="lg">

        {/* ── Vision Audio Stats (shown for life-vision) ── */}
        {contentType === 'life-vision' && (
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
                ].map((stat) => (
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
        )}

        {/* ── Life Vision Player ── */}
        {contentType === 'life-vision' && (audioSets.length > 0 ? (
          <Card variant="elevated" className="bg-[#0A0A0A]">
            <div className="mb-6">
              <h2 className="text-lg md:text-xl font-semibold text-white mb-4 text-center">Play My Vision</h2>
              <div className="relative max-w-2xl mx-auto">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full px-4 md:px-6 py-3 rounded-full bg-[#1F1F1F] text-white border-2 border-[#333] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {selectedSet ? (
                      <>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getVariantColor(selectedSet)}`}>
                          {getVariantIcon(selectedSet)}
                        </div>
                        <span className="font-semibold truncate">{getSetDisplayName(selectedSet)}</span>
                      </>
                    ) : (
                      <span className="text-neutral-400">Select an audio set...</span>
                    )}
                  </div>
                  <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform flex-shrink-0 ml-2 ${isDropdownOpen ? 'rotate-180' : ''}`} />
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
                          onClick={() => { if (set.isReady) { handleSelectSet(set.id); setIsDropdownOpen(false) } }}
                          className={`px-4 py-3 transition-colors border-b border-[#333] last:border-b-0 ${
                            selectedAudioSetId === set.id ? 'bg-primary-500/10' : ''
                          } ${set.isReady ? 'hover:bg-[#2A2A2A] cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getVariantColor(set)}`}>
                              {getVariantIcon(set)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-white truncate">{getSetDisplayName(set)}</h4>
                              <p className="text-xs text-neutral-500">
                                {set.variant === 'personal' ? 'Personal' : getVoiceDisplayName(set.voice_id)} &middot; {set.track_count} tracks &middot; {new Date(set.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {selectedAudioSetId === set.id && <CheckCircle className="w-5 h-5 text-[#39FF14]" />}
                              <button onClick={e => { e.stopPropagation(); handleDelete(set.id, set.name); setIsDropdownOpen(false) }} className="p-1 hover:bg-[#FF0040]/20 rounded transition-colors">
                                <Trash2 className="w-4 h-4 text-[#FF0040]" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {selectedAudioSetId && selectedSet && (
              <div className="max-w-2xl mx-auto">
                {loadingTracks ? (
                  <div className="flex items-center justify-center py-12"><Spinner size="lg" /></div>
                ) : audioTracks.length > 0 ? (() => {
                  const sectionTracks = audioTracks.filter(t => t.sectionKey !== 'full')
                  const fullTrack = audioTracks.find(t => t.sectionKey === 'full')
                  const hasFullTrack = !!fullTrack
                  const effectivePlayMode = (playMode === 'sections' && sectionTracks.length === 0 && hasFullTrack) ? 'full' : playMode
                  const displayTracks = effectivePlayMode === 'sections' ? sectionTracks : (fullTrack ? [fullTrack] : [])
                  const fmtDur = (s: number) => !s || !isFinite(s) ? '0:00' : `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`
                  return (
                    <>
                      {hasFullTrack && sectionTracks.length > 0 && (
                        <div className="flex justify-center mb-6">
                          <Toggle value={playMode} onChange={setPlayMode} options={[
                            { value: 'sections', label: `${sectionTracks.length} Sections` },
                            { value: 'full', label: `Full (${fullTrack!.duration ? fmtDur(fullTrack!.duration) : '~15 min'})` },
                          ]} />
                        </div>
                      )}
                      <PlaylistPlayer
                        tracks={displayTracks}
                        setIcon={<div className={`p-2 rounded-lg ${getVariantColor(selectedSet)}`}>{getVariantIcon(selectedSet)}</div>}
                        setName={getSetDisplayName(selectedSet)}
                        voiceName={selectedSet.variant === 'personal' ? 'Personal Recording' : getVoiceDisplayName(selectedSet.voice_id)}
                        backgroundTrack={selectedSet.backgroundTrack}
                        mixRatio={(() => { if (!selectedSet.mixRatio) return undefined; const m = selectedSet.mixRatio.match(/(\d+)%\s*\/\s*(\d+)%/); return m ? `${m[1]}% Voice / ${m[2]}% Background` : selectedSet.mixRatio })()}
                        trackCount={displayTracks.length}
                        createdDate={new Date(selectedSet.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        onRename={async (newName: string) => {
                          const supabase = createClient()
                          const { error } = await supabase.from('audio_sets').update({ name: newName }).eq('id', selectedSet.id)
                          if (!error) await refreshAudioSets()
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
            )}
          </Card>
        ) : !audioSetsLoading ? (
          <Card variant="elevated" className="p-8 md:p-12 text-center">
            <Headphones className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Vision Audio Yet</h3>
            <p className="text-neutral-400 mb-6">Create your first audio set to bring your vision to life through sound.</p>
            <Button variant="primary" asChild>
              <Link href="/audio/create"><Plus className="w-4 h-4 mr-2" />Create Vision Audio</Link>
            </Button>
          </Card>
        ) : null)}

        {/* ── Stories ── */}
        {contentType === 'stories' && (
          <section>
            {storiesLoading ? (
              <div className="flex items-center justify-center py-8"><Spinner size="md" /></div>
            ) : filteredStories.length === 0 ? (
              <Card variant="glass" className="p-6 text-center">
                <BookOpen className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
                <p className="text-neutral-400 mb-4">
                  {stories.length === 0 ? 'No stories with audio yet. Create one to immerse in your vision.' : 'No stories match this filter.'}
                </p>
                {stories.length === 0 && (
                  <Button variant="primary" size="sm" asChild>
                    <Link href="/story/new"><Plus className="w-4 h-4 mr-2" />Create Story</Link>
                  </Button>
                )}
              </Card>
            ) : (
              <Stack gap="md">
                {/* Story audio player */}
                <div className="rounded-2xl bg-[#0A0A0A] border border-neutral-800 p-4 md:p-6 lg:p-8">
                  <div className="mb-6">
                    <h2 className="text-lg md:text-xl font-semibold text-white mb-4 text-center">Play My Stories</h2>
                    <div className="relative max-w-2xl mx-auto" ref={storyDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setStoryDropdownOpen(prev => !prev)}
                        className="w-full px-4 md:px-6 py-3 rounded-full bg-[#1F1F1F] text-white border-2 border-[#333] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {selectedStory ? (
                            <>
                              {(() => {
                                const meta = ENTITY_META[selectedStory.entity_type] || ENTITY_META.custom!
                                return (
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.badgeColor.split(' ').slice(0, 2).join(' ')}`}>
                                    <meta.icon className="w-5 h-5" />
                                  </div>
                                )
                              })()}
                              <span className="font-semibold truncate">{selectedStory.title || 'Untitled Story'}</span>
                              {(() => {
                                const meta = ENTITY_META[selectedStory.entity_type] || ENTITY_META.custom!
                                return (
                                  <span className={`hidden md:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-semibold flex-shrink-0 ${meta.badgeColor}`}>
                                    <meta.icon className="w-3 h-3" />
                                    {meta.label}
                                  </span>
                                )
                              })()}
                            </>
                          ) : (
                            <span className="text-neutral-400">Select a story...</span>
                          )}
                        </div>
                        <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform flex-shrink-0 ml-2 ${storyDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {storyDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setStoryDropdownOpen(false)} />
                          <div className="absolute z-20 w-full mt-2 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-[60vh] overflow-y-auto">
                            {filteredStories.map(story => {
                              const isSelected = story.id === selectedStoryId
                              const meta = ENTITY_META[story.entity_type] || ENTITY_META.custom!
                              const cats = (story.metadata?.selected_categories || []) as string[]
                              return (
                                <div
                                  key={story.id}
                                  onClick={() => { setSelectedStoryId(story.id); setStoryDropdownOpen(false) }}
                                  className={`px-4 py-3 transition-colors border-b border-[#333] last:border-b-0 hover:bg-[#2A2A2A] cursor-pointer ${isSelected ? 'bg-primary-500/10' : ''}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.badgeColor.split(' ').slice(0, 2).join(' ')}`}>
                                      <meta.icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                        <h4 className="font-semibold text-white truncate">{story.title || 'Untitled Story'}</h4>
                                        <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-semibold flex-shrink-0 ${meta.badgeColor}`}>
                                          <meta.icon className="w-3 h-3" />
                                          {meta.label}
                                        </span>
                                        {cats.map(key => {
                                          const cat = VISION_CATEGORIES.find(c => c.key === key)
                                          if (!cat) return null
                                          return (
                                            <span key={key} className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full border border-neutral-600/50 text-neutral-300 bg-neutral-800/50 font-medium flex-shrink-0">
                                              {cat.label}
                                            </span>
                                          )
                                        })}
                                      </div>
                                      <p className="text-xs text-neutral-500">
                                        {story.word_count ? `${story.word_count} words` : ''} &middot; {new Date(story.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </p>
                                    </div>
                                    {isSelected && <CheckCircle className="w-5 h-5 text-[#39FF14] flex-shrink-0" />}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {selectedStoryId && (
                    storyAudioLoading ? (
                      <div className="flex items-center justify-center py-8"><Spinner size="md" /></div>
                    ) : storyAudioTracks.length === 0 ? (
                      <div className="text-center py-6">
                        <Volume2 className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                        <p className="text-sm text-neutral-400">No audio available for this story</p>
                        <Button variant="primary" size="sm" className="mt-3" asChild>
                          <Link href="/audio/create">Create Audio</Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="max-w-2xl mx-auto">
                        <PlaylistPlayer
                          tracks={storyAudioTracks.map(t => ({
                            id: t.id,
                            title: t.label,
                            artist: t.sublabel,
                            duration: 0,
                            url: t.url,
                            thumbnail: '',
                          }))}
                          setName={selectedStory?.title || 'Story Audio'}
                          trackCount={storyAudioTracks.length}
                          createdDate={selectedStory ? new Date(selectedStory.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                          hideCurrentTrack
                        />
                        {selectedStory && (
                          <div className="flex justify-center mt-6">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/story/${selectedStory.id}`}>
                                <Library className="w-4 h-4 mr-2" />
                                View Story
                                <ChevronRight className="w-4 h-4 ml-1" />
                              </Link>
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </Stack>
            )}
          </section>
        )}

        {/* ── Music (placeholder) ── */}
        {contentType === 'music' && (
          <section>
            <Card variant="glass" className="p-6 text-center">
              <Music2 className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
              <p className="text-sm text-neutral-400">Curated high-vibe music playlists are coming soon.</p>
              <p className="text-xs text-neutral-500 mt-1">Conscious music, frequency tracks, and more.</p>
            </Card>
          </section>
        )}

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
