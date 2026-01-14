"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Container, Stack, Badge, Spinner, VersionBadge, StatusBadge, TrackingMilestoneCard, DeleteConfirmationDialog, Input, PageHero, Toggle } from '@/lib/design-system/components'
import { PlaylistPlayer, type AudioTrack as BaseAudioTrack } from '@/lib/design-system'
import { createClient } from '@/lib/supabase/client'
import { assessmentToVisionKey } from '@/lib/design-system/vision-categories'
import { Play, Clock, CalendarDays, Moon, Zap, Sparkles, Headphones, Plus, ArrowRight, Trash2, Eye, Music, Wand2, Mic, Edit2, Check, X, AudioLines } from 'lucide-react'
import Link from 'next/link'

// Extend AudioTrack with sectionKey for Life Vision audio
interface AudioTrack extends BaseAudioTrack {
  sectionKey: string
}

interface AudioSet {
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
  frequencyTrack?: string  // Can be pure solfeggio or binaural beats
  frequencyType?: 'pure' | 'solfeggio_binaural' | 'binaural'  // pure=solfeggio tone, solfeggio_binaural=solfeggio+brainwave, binaural=non-solfeggio
}

export default function AudioSetsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [visionId, setVisionId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [audioSets, setAudioSets] = useState<AudioSet[]>([])
  const [vision, setVision] = useState<any>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [selectedAudioSetId, setSelectedAudioSetId] = useState<string | null>(null)
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([])
  const [loadingTracks, setLoadingTracks] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [setToDelete, setSetToDelete] = useState<{ id: string, name: string } | null>(null)
  const [editingSetId, setEditingSetId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [playMode, setPlayMode] = useState<'sections' | 'full'>('sections')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

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

    // Load audio sets
    const { data: sets, error } = await supabase
      .from('audio_sets')
      .select(`
        *,
        audio_tracks(count)
      `)
      .eq('vision_id', visionId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading audio sets:', error)
      setLoading(false)
      return
    }

    // Check mix status for each set
    const setsWithStatus = await Promise.all((sets || []).map(async (set: any) => {
      // Check status
      const { data: tracks } = await supabase
        .from('audio_tracks')
        .select('mix_status, status')
        .eq('audio_set_id', set.id)
        .limit(1)

      const hasCompletedVoice = tracks?.some((t: any) => t.status === 'completed')
      const hasCompletedMixing = tracks?.some((t: any) => t.mix_status === 'completed')
      const isMixing = tracks?.some((t: any) => t.mix_status === 'mixing' || t.mix_status === 'pending')

      // Read mix metadata directly from the audio set (no batch lookup needed)
      let mixRatio = undefined
      let backgroundTrack = undefined
      let frequencyTrack = undefined
      let frequencyType = undefined

      if (set.metadata) {
        const metadata = set.metadata as any
        const voiceVol = metadata.voice_volume
        const bgVol = metadata.bg_volume
        // Support both old (binaural_volume) and new (frequency_volume) naming
        const freqVol = metadata.frequency_volume ?? metadata.binaural_volume
        
        if (voiceVol !== undefined && bgVol !== undefined) {
          if (freqVol && freqVol > 0) {
            mixRatio = `${voiceVol}% / ${bgVol}% / ${freqVol}%`
          } else {
            mixRatio = `${voiceVol}% / ${bgVol}%`
          }
        }

        // Get track names directly from metadata (support old and new naming)
        backgroundTrack = metadata.background_track_name
        frequencyTrack = metadata.frequency_track_name ?? metadata.binaural_track_name
        frequencyType = metadata.frequency_type // 'pure' or 'binaural', null for legacy
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
        // Personal recordings and standard (voice-only) are ready if they have completed tracks
        // Other variants need completed mixing
        isReady: !!(hasCompletedVoice && (set.variant === 'standard' || set.variant === 'personal' || hasCompletedMixing)),
        isMixing: !!isMixing,
        mixRatio,
        backgroundTrack,
        frequencyTrack, // Can be pure solfeggio or binaural beats
        frequencyType,  // 'pure' or 'binaural' (null for legacy data)
      }
    }))

    setAudioSets(setsWithStatus)
    
    // Check for saved selection in localStorage
    const savedSelectionKey = `audioSetSelection_${visionId}`
    const savedSelection = localStorage.getItem(savedSelectionKey)
    
    // Try to use saved selection if it exists and is ready
    let selectedSet = null
    if (savedSelection) {
      selectedSet = setsWithStatus.find(s => s.id === savedSelection && s.isReady)
    }
    
    // Fall back to first ready set if no saved selection or saved set not available
    if (!selectedSet) {
      selectedSet = setsWithStatus.find(s => s.isReady)
    }
    
    if (selectedSet) {
      setSelectedAudioSetId(selectedSet.id)
      await loadAudioTracks(selectedSet.id)
    }
    
    setLoading(false)
  }

  async function loadAudioTracks(audioSetId: string) {
    setLoadingTracks(true)
    const supabase = createClient()

    // Get the audio set to check variant
    const { data: audioSet } = await supabase
      .from('audio_sets')
      .select('variant')
      .eq('id', audioSetId)
      .single()

    // Load audio tracks for this set
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

    // Build section map for titles
    const sectionMap = new Map<string, string>()
    sectionMap.set('forward', 'Forward')
    sectionMap.set('fun', 'Fun')
    sectionMap.set('health', 'Health')
    sectionMap.set('travel', 'Travel')
    sectionMap.set('love', 'Love')
    sectionMap.set('family', 'Family')
    sectionMap.set('social', 'Social')
    sectionMap.set('home', 'Home')
    sectionMap.set('work', 'Work')
    sectionMap.set('money', 'Money')
    sectionMap.set('stuff', 'Stuff')
    sectionMap.set('giving', 'Giving')
    sectionMap.set('spirituality', 'Spirituality')
    sectionMap.set('conclusion', 'Conclusion')

    const canonicalOrder = [
      'forward',
      'fun',
      'health',
      'travel',
      'love',
      'family',
      'social',
      'home',
      'work',
      'money',
      'stuff',
      'giving',
      'spirituality',
      'conclusion'
    ]
    
    const formattedTracks: AudioTrack[] = tracks
      .map(track => {
        // For "standard" (Voice Only) and "personal" (User Recording) variants, ALWAYS use audio_url
        // For other variants (mixed versions), use mixed_audio_url if available and completed
        const useDirectAudio = audioSet?.variant === 'standard' || audioSet?.variant === 'personal'
        const url = !useDirectAudio && track.mixed_audio_url && track.mix_status === 'completed' 
          ? track.mixed_audio_url 
          : track.audio_url
        
        // Ensure duration is a valid number (handle null, undefined, NaN, Infinity)
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
      .sort((a: any, b: any) => {
        const indexA = canonicalOrder.indexOf(a.sectionKey)
        const indexB = canonicalOrder.indexOf(b.sectionKey)
        if (indexA === -1) return 1
        if (indexB === -1) return -1
        return indexA - indexB
      })

    setAudioTracks(formattedTracks)
    setLoadingTracks(false)
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
        // Remove from local state
        setAudioSets(audioSets.filter(s => s.id !== setToDelete.id))
        
        // If deleted set was selected, clear selection
        if (selectedAudioSetId === setToDelete.id) {
          setSelectedAudioSetId(null)
          setAudioTracks([])
          // Auto-select next available set
          const remainingSets = audioSets.filter(s => s.id !== setToDelete.id && s.isReady)
          if (remainingSets.length > 0) {
            setSelectedAudioSetId(remainingSets[0].id)
            await loadAudioTracks(remainingSets[0].id)
            // Update localStorage with new selection
            if (visionId) {
              localStorage.setItem(`audioSetSelection_${visionId}`, remainingSets[0].id)
            }
          } else {
            // No more sets, clear localStorage
            if (visionId) {
              localStorage.removeItem(`audioSetSelection_${visionId}`)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error deleting audio set:', error)
      alert('Failed to delete audio version. Please try again.')
    } finally {
      setDeleting(null)
      setSetToDelete(null)
    }
  }

  const handleSelectSet = async (setId: string) => {
    setSelectedAudioSetId(setId)
    await loadAudioTracks(setId)
    
    // Save selection to localStorage
    if (visionId) {
      localStorage.setItem(`audioSetSelection_${visionId}`, setId)
    }
  }

  const handleStartEdit = (setId: string, currentName: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setEditingSetId(setId)
    setEditingName(currentName)
  }

  const handleCancelEdit = () => {
    setEditingSetId(null)
    setEditingName('')
  }

  const handleSaveName = async (setId: string) => {
    const supabase = createClient()
    
    try {
      const { error } = await supabase
        .from('audio_sets')
        .update({ name: editingName })
        .eq('id', setId)
      
      if (error) throw error
      
      // Update local state
      setAudioSets(audioSets.map(s => s.id === setId ? { ...s, name: editingName } : s))
      setEditingSetId(null)
      setEditingName('')
    } catch (error) {
      console.error('Error updating audio set name:', error)
      alert('Failed to update name. Please try again.')
    }
  }

  const getVariantIcon = (set: AudioSet) => {
    const iconClass = "w-6 h-6"
    
    // Personal recordings use Mic icon
    if (set.variant === 'personal') {
      return <Mic className={iconClass} />
    }
    
    // Extract voice/background volumes from mix ratio
    let voiceVolume = 100
    let bgVolume = 0
    
    if (set.mixRatio) {
      const ratioMatch = set.mixRatio.match(/(\d+)%\s*\/\s*(\d+)%/)
      if (ratioMatch) {
        voiceVolume = parseInt(ratioMatch[1])
        bgVolume = parseInt(ratioMatch[2])
      }
    }
    
    // Determine icon based on mix ratio (same logic as generate page)
    if (bgVolume === 0 || set.variant === 'standard') {
      // Voice Only
      return <Headphones className={iconClass} />
    } else if (voiceVolume <= 30) {
      // Sleep: Low voice (10-30%)
      return <Moon className={iconClass} />
    } else if (voiceVolume >= 40 && voiceVolume <= 60) {
      // Meditation: Balanced (40-60%)
      return <Sparkles className={iconClass} />
    } else {
      // Power: High voice (70%+)
      return <Zap className={iconClass} />
    }
  }

  const getVariantColor = (set: AudioSet) => {
    // Personal recordings use secondary teal color to distinguish from generated voice
    if (set.variant === 'personal') {
      return 'bg-secondary-500/20 text-secondary-500'
    }
    
    // Extract voice/background volumes from mix ratio
    let voiceVolume = 100
    let bgVolume = 0
    
    if (set.mixRatio) {
      const ratioMatch = set.mixRatio.match(/(\d+)%\s*\/\s*(\d+)%/)
      if (ratioMatch) {
        voiceVolume = parseInt(ratioMatch[1])
        bgVolume = parseInt(ratioMatch[2])
      }
    }
    
    // Determine color based on mix ratio (same logic as generate page)
    if (bgVolume === 0 || set.variant === 'standard') {
      // Voice Only - Primary Green
      return 'bg-primary-500/20 text-primary-500'
    } else if (voiceVolume <= 30) {
      // Sleep - Blue
      return 'bg-blue-500/20 text-blue-400'
    } else if (voiceVolume >= 40 && voiceVolume <= 60) {
      // Meditation - Purple
      return 'bg-purple-500/20 text-purple-400'
    } else {
      // Power - Yellow
      return 'bg-yellow-500/20 text-yellow-400'
    }
  }

  const getVariantDisplayInfo = (set: AudioSet) => {
    // Personal recordings have their own display
    if (set.variant === 'personal') {
      return {
        title: 'Personal Recording',
        description: 'Your own voice'
      }
    }
    
    // Extract voice/background volumes from mix ratio
    let voiceVolume = 100
    let bgVolume = 0
    
    if (set.mixRatio) {
      const ratioMatch = set.mixRatio.match(/(\d+)%\s*\/\s*(\d+)%/)
      if (ratioMatch) {
        voiceVolume = parseInt(ratioMatch[1])
        bgVolume = parseInt(ratioMatch[2])
      }
    }
    
    // Determine display info based on mix ratio (same logic as generate page)
    if (bgVolume === 0 || set.variant === 'standard') {
      return {
        title: 'Voice Only',
        description: 'Pure voice narration'
      }
    } else if (voiceVolume <= 30) {
      return {
        title: 'Sleep',
        description: `${voiceVolume}% voice, ${bgVolume}% background`
      }
    } else if (voiceVolume >= 40 && voiceVolume <= 60) {
      return {
        title: 'Meditation',
        description: `${voiceVolume}% voice, ${bgVolume}% background`
      }
    } else {
      return {
        title: 'Power',
        description: `${voiceVolume}% voice, ${bgVolume}% background`
      }
    }
  }

  const getVoiceDisplayName = (voiceId: string) => {
    const voiceMap: { [key: string]: string } = {
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

  const totalSets = audioSets.length
  const readySets = audioSets.filter(s => s.isReady).length
  const totalTracks = audioSets.reduce((sum, s) => sum + s.track_count, 0)

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Hero Header */}
        <PageHero
          eyebrow={vision?.household_id ? "THE LIFE WE CHOOSE" : "THE LIFE I CHOOSE"}
          title="Life Vision Audio Sets"
        >
          {/* Version Badge */}
          {vision && (
            <div className="flex justify-center">
              <div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-neutral-900/60 border border-neutral-700/50 backdrop-blur-sm">
                <VersionBadge 
                  versionNumber={vision.version_number} 
                  status={vision.is_active ? 'active' : (vision.is_draft ? 'draft' : 'complete')}
                  isHouseholdVision={!!vision.household_id}
                />
                <StatusBadge 
                  status={vision.is_active ? 'active' : (vision.is_draft ? 'draft' : 'complete')} 
                  subtle={!vision.is_active} 
                  className="uppercase tracking-[0.25em]" 
                />
                <div className="flex items-center gap-1.5 text-neutral-300 text-xs md:text-sm">
                  <CalendarDays className="w-4 h-4 text-neutral-500" />
                  <span className="font-medium">Created:</span>
                  <span>{new Date(vision.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 max-w-5xl mx-auto">
            <Button
              onClick={() => router.push(`/life-vision/${visionId}/audio/generate`)}
              variant="outline"
              size="sm"
              className="w-full col-span-2 lg:col-span-1 flex items-center justify-center gap-2"
            >
              <AudioLines className="w-4 h-4" />
              <span>Generate</span>
            </Button>
            
            <Button
              onClick={() => router.push(`/life-vision/${visionId}/audio/record`)}
              variant="outline"
              size="sm"
              className="w-full flex items-center justify-center gap-2"
            >
              <Mic className="w-4 h-4" />
              <span>Record</span>
            </Button>
            
            <Button
              onClick={() => router.push(`/life-vision/${visionId}/audio/queue`)}
              variant="outline"
              size="sm"
              className="w-full flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4" />
              <span>Queue</span>
            </Button>
            
            <Button
              onClick={() => router.push(`/life-vision/audio`)}
              variant="outline"
              size="sm"
              className="w-full flex items-center justify-center gap-2"
            >
              <Headphones className="w-4 h-4" />
              <span>All Audios</span>
            </Button>
            
            <Button
              onClick={() => router.push(`/life-vision/${visionId}`)}
              variant="outline"
              size="sm"
              className="w-full flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              <span className="lg:hidden">Vision</span>
              <span className="hidden lg:inline">View Vision</span>
            </Button>
          </div>
        </PageHero>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4 md:gap-6">
          <TrackingMilestoneCard
            label="Audio Sets"
            value={totalSets}
            theme="accent"
          />
          <TrackingMilestoneCard
            label="Total Tracks"
            value={totalTracks}
            theme="secondary"
          />
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Generate Card */}
          <Link href={`/life-vision/${visionId}/audio/generate`}>
            <Card variant="elevated" hover className="bg-gradient-to-br from-[#199D67]/20 via-[#14B8A6]/10 to-[#8B5CF6]/20 border-[#39FF14]/30 cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#39FF14]/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Plus className="w-6 h-6 text-[#39FF14]" />
                </div>
                <div>
                  <p className="text-white text-lg">Generate more audio sets</p>
                </div>
              </div>
            </Card>
          </Link>

          {/* Record Card */}
          <Link href={`/life-vision/${visionId}/audio/record`}>
            <Card variant="elevated" hover className="bg-gradient-to-br from-[#D03739]/20 via-[#8B5CF6]/10 to-[#14B8A6]/20 border-[#D03739]/30 cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#D03739]/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mic className="w-6 h-6 text-[#D03739]" />
                </div>
                <div>
                  <p className="text-white text-lg">Record life vision in your voice</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Audio Sets Grid */}
        {audioSets.length === 0 ? (
          <Card variant="elevated" className="p-8 md:p-12 text-center">
            <Music className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Audio Sets Yet</h3>
            <p className="text-neutral-400 mb-6">Create your first audio set to bring your vision to life through sound.</p>
            <Button variant="primary" asChild>
              <Link href={`/life-vision/${visionId}/audio/generate`}>
                <Plus className="w-4 h-4 mr-2" />
                Create Audio Set
              </Link>
            </Button>
          </Card>
        ) : (
          <Card variant="elevated" className="bg-[#0A0A0A]">
            {/* Audio Set Selector */}
            <div className="mb-8">
              <h2 className="text-xl md:text-2xl font-semibold text-white mb-6 text-center">Select Audio Set</h2>
              
              <div className="relative max-w-2xl mx-auto">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full px-4 md:px-6 py-3 md:py-3.5 rounded-full bg-[#1F1F1F] text-white border-2 border-[#333] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {selectedAudioSetId ? (
                      <>
                        {(() => {
                          const selectedSet = audioSets.find(s => s.id === selectedAudioSetId)
                          if (!selectedSet) return null
                          return (
                            <>
                              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getVariantColor(selectedSet)}`}>
                                {getVariantIcon(selectedSet)}
                              </div>
                              <div className="text-left flex-1 min-w-0">
                                <div className="font-semibold truncate">
                                  {selectedSet.name && !selectedSet.name.includes('Version') && !selectedSet.name.includes(':') 
                                    ? selectedSet.name 
                                    : getVariantDisplayInfo(selectedSet).title}
                                </div>
                              </div>
                            </>
                          )
                        })()}
                      </>
                    ) : (
                      <span className="text-neutral-400">Select an audio set...</span>
                    )}
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <svg className={`w-5 h-5 text-neutral-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div className="absolute z-20 w-full mt-2 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-[60vh] overflow-y-auto">
                      {[...audioSets].sort((a, b) => {
                        // Pin currently playing set to top
                        if (a.id === selectedAudioSetId) return -1
                        if (b.id === selectedAudioSetId) return 1
                        // Otherwise maintain original order (by created_at desc)
                        return 0
                      }).map((set) => (
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
                            {/* Icon */}
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getVariantColor(set)}`}>
                              {getVariantIcon(set)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-white pr-2">
                                  {set.name && !set.name.includes('Version') && !set.name.includes(':') 
                                    ? set.name 
                                    : getVariantDisplayInfo(set).title}
                                </h4>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {/* Playing Badge - Desktop Only (in header row) */}
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
                                      setIsDropdownOpen(false)
                                    }}
                                    className="p-1 hover:bg-[#FF0040]/20 rounded transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4 text-[#FF0040]" />
                                  </button>
                                </div>
                              </div>
                              
                              {/* Playing Badge - Mobile Only (below title) */}
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
                                  <div>
                                    <span className="text-neutral-500">Background:</span> {set.backgroundTrack}
                                  </div>
                                )}
                                {set.mixRatio && (
                                  <div>
                                    <span className="text-neutral-500">Ratio:</span>{' '}
                                    <span className="text-primary-400">
                                      {(() => {
                                        const ratioMatch = set.mixRatio.match(/(\d+)%\s*\/\s*(\d+)%/)
                                        if (ratioMatch) {
                                          return `${ratioMatch[1]}% Voice / ${ratioMatch[2]}% Background`
                                        }
                                        return set.mixRatio
                                      })()}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 pt-1">
                                  <span>{set.track_count} tracks</span>
                                  <span>•</span>
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

            {/* Audio Player */}
            {selectedAudioSetId && (
              <div className="mt-8">
                {/* Playlist Player */}
                <div className="max-w-2xl mx-auto">
                  {loadingTracks ? (
                    <div className="flex items-center justify-center py-12">
                      <Spinner size="lg" />
                    </div>
                  ) : audioTracks.length > 0 ? (
                    <>
                      {(() => {
                        const sectionTracks = audioTracks.filter(t => t.sectionKey !== 'full')
                        const fullTrack = audioTracks.find(t => t.sectionKey === 'full')
                        const hasFullTrack = !!fullTrack
                        const displayTracks = playMode === 'sections' ? sectionTracks : (fullTrack ? [fullTrack] : [])

                        const formatDuration = (seconds: number) => {
                          // Handle invalid values
                          if (!seconds || !isFinite(seconds) || isNaN(seconds)) {
                            return '0:00'
                          }
                          const mins = Math.floor(seconds / 60)
                          const secs = Math.floor(seconds % 60)
                          return `${mins}:${secs.toString().padStart(2, '0')}`
                        }

                        return (
                          <>
                            {/* Play Mode Toggle */}
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
                                (() => {
                                  const selectedSet = audioSets.find(s => s.id === selectedAudioSetId)
                                  if (!selectedSet) return null
                                  return (
                                    <div className={`p-2 rounded-lg ${getVariantColor(selectedSet)}`}>
                                      {getVariantIcon(selectedSet)}
                                    </div>
                                  )
                                })()
                              }
                              setName={(() => {
                                const selectedSet = audioSets.find(s => s.id === selectedAudioSetId)
                                if (!selectedSet) return 'Audio Set'
                                // Use the actual audio set name if it exists and is not a generic version name
                                if (selectedSet.name && !selectedSet.name.includes('Version') && !selectedSet.name.includes(':')) {
                                  return selectedSet.name
                                }
                                // Otherwise fall back to variant display info
                                return getVariantDisplayInfo(selectedSet).title
                              })()}
                              voiceName={(() => {
                                const selectedSet = audioSets.find(s => s.id === selectedAudioSetId)
                                if (!selectedSet) return undefined
                                return selectedSet.variant === 'personal' 
                                  ? 'Personal Recording' 
                                  : getVoiceDisplayName(selectedSet.voice_id)
                              })()}
                              backgroundTrack={(() => {
                                const selectedSet = audioSets.find(s => s.id === selectedAudioSetId)
                                return selectedSet?.backgroundTrack
                              })()}
                              mixRatio={(() => {
                                const selectedSet = audioSets.find(s => s.id === selectedAudioSetId)
                                if (!selectedSet?.mixRatio) return undefined
                                const ratioMatch = selectedSet.mixRatio.match(/(\d+)%\s*\/\s*(\d+)%/)
                                if (ratioMatch) {
                                  return `${ratioMatch[1]}% Voice / ${ratioMatch[2]}% Background`
                                }
                                return selectedSet.mixRatio
                              })()}
                              trackCount={displayTracks.length}
                              createdDate={new Date(audioSets.find(s => s.id === selectedAudioSetId)?.created_at || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              onRename={async (newName: string) => {
                                const selectedSet = audioSets.find(s => s.id === selectedAudioSetId)
                                if (!selectedSet) return
                                
                                const supabase = createClient()
                                try {
                                  const { error } = await supabase
                                    .from('audio_sets')
                                    .update({ name: newName })
                                    .eq('id', selectedSet.id)
                                  
                                  if (error) throw error
                                  
                                  // Update local state
                                  setAudioSets(audioSets.map(s => s.id === selectedSet.id ? { ...s, name: newName } : s))
                                } catch (error) {
                                  console.error('Error updating audio set name:', error)
                                  alert('Failed to update name. Please try again.')
                                }
                              }}
                            />
                          </>
                        )
                      })()}
                    </>
                  ) : (
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
      </Stack>

      {/* Delete Confirmation Dialog */}
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
