'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Container, Stack, Card, Button, Textarea, CategoryGrid, VIVALoadingOverlay } from '@/lib/design-system/components'
import { Music2, Sparkles, Loader2, Link2, X, Play, Pause, Target, Image, BookOpen, ChevronDown, Check, Search, Home, Save } from 'lucide-react'
import { ReferenceLibraryPicker, type ReferenceTrack } from '@/components/audio-studio/ReferenceLibraryPicker'
import { VibrationFitSongPicker, type VibrationFitSong } from '@/components/audio-studio/VibrationFitSongPicker'
import { stripLyricsTitleHeader } from '@/lib/utils/lyrics-alignment'
import { PublishAgreementModal } from '@/components/audio-studio/PublishAgreementModal'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { hasAcceptedSongPublishingAgreement } from '@/lib/songs/publishing-agreement'
import { extractYoutubeAudio } from '@/lib/songs/extract-youtube-client'
import {
  VISION_CATEGORIES,
  LIFE_CATEGORY_KEYS,
  type LifeCategoryKey,
} from '@/lib/design-system/vision-categories'

const LIFE_CATEGORIES = VISION_CATEGORIES.filter(
  c => LIFE_CATEGORY_KEYS.includes(c.key as LifeCategoryKey)
)

type SourceType = 'custom' | 'life_vision' | 'vision_board_item' | 'journal_entry'

interface SourceOption {
  type: SourceType
  label: string
  description: string
  icon: React.ElementType
  color: string
}

const SOURCE_OPTIONS: SourceOption[] = [
  { type: 'custom', label: 'Custom', description: 'Start with your own idea', icon: Music2, color: 'text-[#39FF14]' },
  { type: 'life_vision', label: 'Life Vision', description: 'Draw from your vision categories', icon: Target, color: 'text-purple-400' },
  { type: 'vision_board_item', label: 'Vision Board', description: 'Turn a vision board item into a song', icon: Image, color: 'text-cyan-400' },
  { type: 'journal_entry', label: 'Journal Entry', description: 'Transform a journal entry into music', icon: BookOpen, color: 'text-teal-400' },
]


export default function SongwriterPage() {
  const router = useRouter()
  const supabase = createClient()

  // Source state
  const [source, setSource] = useState<SourceType>('custom')
  const [entities, setEntities] = useState<any[]>([])
  const [entitiesLoading, setEntitiesLoading] = useState(false)
  const [selectedEntity, setSelectedEntity] = useState<any>(null)
  const [entityDropdownOpen, setEntityDropdownOpen] = useState(false)
  const [entitySearch, setEntitySearch] = useState('')
  const entityDropdownRef = useRef<HTMLDivElement>(null)

  // Life Vision category state
  const [selectedCategories, setSelectedCategories] = useState<LifeCategoryKey[]>([])
  const [visionData, setVisionData] = useState<Record<string, string>>({})

  // Life category tags for the song (source-agnostic; used for catalog filtering)
  const [categoryTags, setCategoryTags] = useState<LifeCategoryKey[]>([])

  // Form state
  const [songTitle, setSongTitle] = useState('')
  const [songIdea, setSongIdea] = useState('')
  const [context, setContext] = useState('')
  const [lyrics, setLyrics] = useState('')
  const [lyricsMode, setLyricsMode] = useState<'none' | 'generating' | 'paste' | 'done'>('none')

  // Reference track state
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [audioLoading, setAudioLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [regionStart, setRegionStart] = useState(0)
  const [regionEnd, setRegionEnd] = useState(30)
  const [audioDuration, setAudioDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [referenceId, setReferenceId] = useState<string | null>(null)
  const [referenceTitle, setReferenceTitle] = useState<string | null>(null)
  const [referenceClipUrl, setReferenceClipUrl] = useState<string | null>(null)
  const [refPickerOpen, setRefPickerOpen] = useState(false)
  const [songPickerOpen, setSongPickerOpen] = useState(false)

  // Generation state
  const [generating, setGenerating] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [songId, setSongId] = useState<string | null>(null)

  // One-time publishing agreement (gates the first time a user creates a song)
  const [agreementAccepted, setAgreementAccepted] = useState<boolean | null>(null)
  const [showAgreementModal, setShowAgreementModal] = useState(false)
  const pendingActionRef = useRef<(() => void) | null>(null)

  // Refs
  const waveformRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<any>(null)
  const regionRef = useRef<any>(null)

  // Load entities when source changes
  useEffect(() => {
    if (source === 'custom') {
      setEntities([])
      setSelectedEntity(null)
      return
    }
    loadEntities(source)
  }, [source])

  // Load the user's one-time publishing agreement acceptance status on mount
  useEffect(() => {
    async function checkAgreement() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: account } = await supabase
          .from('user_accounts')
          .select('song_publishing_agreement_accepted_at, song_publishing_agreement_version')
          .eq('id', user.id)
          .single()
        setAgreementAccepted(hasAcceptedSongPublishingAgreement(account))
      } catch {
        setAgreementAccepted(false)
      }
    }
    checkAgreement()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Runs `action` immediately if the agreement is accepted, otherwise prompts
  // for the one-time agreement first and runs it on acceptance.
  function withAgreement(action: () => void) {
    if (agreementAccepted) {
      action()
      return
    }
    pendingActionRef.current = action
    setShowAgreementModal(true)
  }

  async function loadEntities(entityType: SourceType) {
    setEntitiesLoading(true)
    setSelectedEntity(null)
    setEntities([])

    try {
      if (entityType === 'life_vision') {
        const response = await fetch('/api/vision?includeVersions=true')
        if (!response.ok) return
        const data = await response.json()
        const versions = (data.versions || []).filter((v: any) => !v.is_draft)
        if (data.vision?.id) {
          const exists = versions.some((v: any) => v.id === data.vision.id)
          if (!exists) versions.unshift(data.vision)
        }
        setEntities(versions)
      } else if (entityType === 'vision_board_item') {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return
        const { data } = await supabase
          .from('vision_board_items')
          .select('id, name, description, categories, image_url')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
        setEntities(data || [])
      } else if (entityType === 'journal_entry') {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return
        const { data } = await supabase
          .from('journal_entries')
          .select('id, title, content, categories, created_at')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(30)
        setEntities(data || [])
      }
    } catch (err) {
      console.error('Failed to load entities:', err)
    } finally {
      setEntitiesLoading(false)
    }
  }

  const filteredEntities = entitySearch.trim()
    ? entities.filter(e => {
        const q = entitySearch.toLowerCase()
        const label = getEntityLabel(e).toLowerCase()
        const dateStr = e.created_at ? new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase() : ''
        return label.includes(q) || dateStr.includes(q) || String(e.version_number || '').includes(q)
      })
    : entities

  useEffect(() => {
    if (!entityDropdownOpen) return
    function handler(e: MouseEvent | TouchEvent) {
      if (entityDropdownRef.current && !entityDropdownRef.current.contains(e.target as Node)) {
        setEntityDropdownOpen(false)
        setEntitySearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('touchstart', handler) }
  }, [entityDropdownOpen])

  function handleEntitySelect(entity: any) {
    setSelectedEntity(entity)
    setEntityDropdownOpen(false)
    setEntitySearch('')

    const validCategories = (entity.categories || []).filter((c: string) =>
      (LIFE_CATEGORY_KEYS as readonly string[]).includes(c)
    ) as LifeCategoryKey[]

    if (source === 'life_vision') {
      const catTexts: Record<string, string> = {}
      for (const key of LIFE_CATEGORY_KEYS) {
        if (entity[key]) catTexts[key] = entity[key]
      }
      setVisionData(catTexts)
      setSelectedCategories([])
      setCategoryTags([])
      setContext('')
    } else if (source === 'vision_board_item') {
      const parts = [entity.name, entity.description].filter(Boolean)
      setContext(parts.join('\n\n'))
      setCategoryTags(validCategories)
    } else if (source === 'journal_entry') {
      const parts = [entity.title, entity.content?.slice(0, 800)].filter(Boolean)
      setContext(parts.join('\n\n'))
      setCategoryTags(validCategories)
    }
  }

  function handleCategoryToggle(key: string) {
    setSelectedCategories(prev => {
      const next = prev.includes(key as LifeCategoryKey)
        ? prev.filter(k => k !== key)
        : [...prev, key as LifeCategoryKey]

      // Fill the full text of each selected category (ordered to match the
      // grid). VIVA only uses this as source material, so keep it complete
      // rather than truncating; the member can still trim it freely.
      const texts = LIFE_CATEGORY_KEYS
        .filter(k => next.includes(k as LifeCategoryKey))
        .map(k => {
          const body = visionData[k]
          if (!body) return ''
          const label = LIFE_CATEGORIES.find(c => c.key === k)?.label || k
          return `### ${label}\n${body.trim()}`
        })
        .filter(Boolean)
        .join('\n\n')
      setContext(texts)

      return next
    })
    // Mirror content-category picks into the song tags (still editable below).
    setCategoryError(null)
    setCategoryTags(prev =>
      prev.includes(key as LifeCategoryKey)
        ? prev.filter(k => k !== key)
        : [...prev, key as LifeCategoryKey]
    )
  }

  function handleCategoryTagToggle(key: string) {
    setCategoryError(null)
    setCategoryTags(prev =>
      prev.includes(key as LifeCategoryKey)
        ? prev.filter(k => k !== key)
        : [...prev, key as LifeCategoryKey]
    )
  }

  function getEntityLabel(entity: any): string {
    if (source === 'life_vision') return entity.title || entity.version_name || 'Life Vision'
    if (source === 'vision_board_item') return entity.name || 'Vision Board Item'
    if (source === 'journal_entry') return entity.title || 'Journal Entry'
    return 'Item'
  }

  // Generate lyrics with VIVA
  const generateLyrics = async () => {
    if (!songIdea.trim()) return
    setLyricsMode('generating')
    setLyrics('')

    try {
      const ideaWithContext = context
        ? `${songIdea}\n\n--- Context from my life ---\n${context}`
        : songIdea

      const essencePayload = {
        entity_type: source,
        entity_id: selectedEntity?.id,
        song_essence: {
          song_idea: ideaWithContext,
          song_title: songTitle || undefined,
          emotional_start: '',
          emotional_destination: '',
          core_message: '',
          imagery: [],
          energy_style: '',
          sliders: {
            emotional_intensity: 7,
            spiritual_depth: 4,
            energy: 'uplifting',
            lyrical_style: 'conversational',
            commercial_style: 'indie',
          },
        },
        title: songTitle || `Song – ${songIdea.slice(0, 40)}`,
      }

      const response = await fetch('/api/songs/generate-lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(essencePayload),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to generate lyrics')
      }

      const returnedSongId = response.headers.get('X-Song-Id')
      if (returnedSongId) setSongId(returnedSongId)

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        let done = false
        while (!done) {
          const { value, done: readerDone } = await reader.read()
          done = readerDone
          if (value) {
            const chunk = decoder.decode(value, { stream: true })
            setLyrics(prev => prev + chunk)
          }
        }
      }

      // Remove any leading title/"#" header the model may have prepended.
      setLyrics(prev => stripLyricsTitleHeader(prev))
      setLyricsMode('done')
    } catch (err) {
      console.error('Lyrics generation failed:', err)
      setLyricsMode('none')
    }
  }

  // Load YouTube audio
  const loadYoutubeAudio = async () => {
    if (!youtubeUrl.trim()) return
    setAudioLoading(true)
    setAudioError(null)
    setAudioUrl(null)
    setReferenceId(null)

    try {
      const { audio_url, duration, title } = await extractYoutubeAudio(youtubeUrl)
      setAudioUrl(audio_url)
      setAudioDuration(duration || 180)
      setRegionEnd(Math.min(30, duration || 30))
      setReferenceTitle(title || null)
    } catch (err) {
      setAudioError(err instanceof Error ? err.message : 'Failed to load audio')
    } finally {
      setAudioLoading(false)
    }
  }

  // Initialize wavesurfer when audio loads
  useEffect(() => {
    if (!audioUrl || !waveformRef.current) return

    let ws: any = null

    const initWavesurfer = async () => {
      const WaveSurfer = (await import('wavesurfer.js')).default
      const RegionsPlugin = (await import('wavesurfer.js/dist/plugins/regions.js')).default

      if (wavesurferRef.current) {
        wavesurferRef.current.destroy()
      }

      ws = WaveSurfer.create({
        container: waveformRef.current!,
        waveColor: '#555',
        progressColor: '#39FF14',
        cursorColor: '#39FF14',
        height: 80,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        url: audioUrl,
      })

      const regions = ws.registerPlugin(RegionsPlugin.create())

      ws.on('ready', () => {
        const duration = ws.getDuration()
        setAudioDuration(duration)

        const initialEnd = Math.min(30, duration)
        const region = regions.addRegion({
          start: 0,
          end: initialEnd,
          color: 'rgba(57, 255, 20, 0.15)',
          drag: true,
          resize: true,
        })
        regionRef.current = region
        setRegionStart(0)
        setRegionEnd(initialEnd)
      })

      regions.on('region-updated', (region: any) => {
        let start = region.start
        let end = region.end

        if (end - start > 30) {
          end = start + 30
          region.setOptions({ start, end })
        }
        if (end - start < 5) {
          end = start + 5
          region.setOptions({ start, end })
        }

        regionRef.current = region
        setRegionStart(start)
        setRegionEnd(end)
        setReferenceId(null)
      })

      // Pause automatically when playback leaves the selected region
      regions.on('region-out', () => {
        ws.pause()
      })

      ws.on('play', () => setIsPlaying(true))
      ws.on('pause', () => setIsPlaying(false))

      wavesurferRef.current = ws
    }

    initWavesurfer()

    return () => {
      if (ws) ws.destroy()
    }
  }, [audioUrl])

  // Preview the selected region (plays exactly the highlighted segment)
  const togglePreview = () => {
    const ws = wavesurferRef.current
    const region = regionRef.current
    if (!ws) return
    if (isPlaying) {
      ws.pause()
      return
    }
    if (region) {
      // Plays from region.start and stops at region.end automatically
      region.play(true)
    } else {
      ws.setTime(regionStart)
      ws.play()
    }
  }

  const createTrack = async () => {
    if (!lyrics.trim() || generating) return
    await runCreateTrack()
  }

  // Validates a life category is selected, then runs the agreement-gated create.
  const handleCreateClick = () => {
    if (categoryTags.length === 0) {
      setCategoryError('Please select at least one life category to generate your track.')
      return
    }
    setCategoryError(null)
    withAgreement(createTrack)
  }

  // Persists the current on-screen song (exact lyrics + title) without
  // generating music. Creates the record on first save (pasted lyrics are kept
  // as-is, never regenerated) or updates the existing one. Returns the song id.
  const saveSongRecord = async (): Promise<string> => {
    const cleanLyrics = lyrics.trim()
    let currentSongId = songId
    if (!currentSongId) {
      const createRes = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: source,
          entity_id: selectedEntity?.id,
          title: songTitle || undefined,
          lyrics: cleanLyrics,
          song_idea: songIdea || undefined,
          source: lyricsMode === 'paste' ? 'user_written' : 'ai_assisted',
          life_categories: categoryTags,
        }),
      })
      if (!createRes.ok) {
        const e = await createRes.json().catch(() => ({}))
        throw new Error(e.error || 'Failed to save song')
      }
      const created = await createRes.json()
      currentSongId = created.song?.id || null
      setSongId(currentSongId)
    } else {
      await fetch(`/api/songs/${currentSongId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lyrics: cleanLyrics, title: songTitle || undefined }),
      }).catch(() => {})
    }
    if (!currentSongId) throw new Error('No song record')
    return currentSongId
  }

  // Save the song to return to later, then open its page (Create More Versions).
  const handleSaveForLater = async () => {
    if (!lyrics.trim() || savingDraft || generating) return
    setSavingDraft(true)
    setCreateError(null)
    try {
      const id = await saveSongRecord()
      router.push(`/audio/songwriter/${id}`)
    } catch (err) {
      console.error('Save for later failed:', err)
      setCreateError(err instanceof Error ? err.message : 'Failed to save your song.')
      setSavingDraft(false)
    }
  }

  const runCreateTrack = async () => {
    if (!lyrics.trim() || generating) return
    setGenerating(true)
    setCreateError(null)

    try {
      let refId = referenceId

      if (audioUrl && !refId) {
        const refResponse = await fetch('/api/songs/upload-reference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: audioUrl,
            start: regionStart,
            end: regionEnd,
            title: referenceTitle || undefined,
            youtube_url: youtubeUrl || undefined,
          }),
        })
        if (!refResponse.ok) {
          const refErr = await refResponse.json().catch(() => ({}))
          throw new Error(refErr.error || 'Reference track upload failed')
        }
        const refData = await refResponse.json()
        refId = refData.reference_id
        setReferenceId(refId)
        setReferenceClipUrl(refData.clip_url || null)
      }

      // Persist the EXACT on-screen lyrics before generating so members never
      // generate against stale lyrics.
      const currentSongId = await saveSongRecord()

      const musicRes = await fetch('/api/songs/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          song_id: currentSongId,
          lyrics: lyrics.trim(),
          reference_id: refId || undefined,
          life_categories: categoryTags,
          reference_meta: refId ? {
            youtube_url: youtubeUrl || undefined,
            title: referenceTitle || undefined,
            clip_url: referenceClipUrl || undefined,
            start: regionStart,
            end: regionEnd,
            mureka_file_id: refId,
          } : undefined,
        }),
      })

      if (!musicRes.ok) {
        const err = await musicRes.json()
        throw new Error(err.error || 'Failed to start music generation')
      }

      // Auto-generate album art (VIVA + VF logo) for the song while music renders.
      // Fire-and-forget; the poll route applies the saved cover to each track.
      fetch(`/api/songs/${currentSongId}/cover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generate: true }),
      }).catch(() => {})

      router.push(`/audio/songwriter/${currentSongId}`)
    } catch (err) {
      console.error('Create track failed:', err)
      setCreateError(err instanceof Error ? err.message : 'Something went wrong creating your track.')
      setGenerating(false)
    }
  }

  const hasLyrics = lyrics.trim().length > 0

  return (
    <Container size="md" className="pt-2 pb-8">
      <Stack gap="lg">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Songwriter</h1>
          <p className="mt-1 text-sm text-neutral-400">Create original music from an idea.</p>
        </div>

        {/* Source Picker */}
        <Card variant="glass" className="relative z-10 p-5 overflow-visible">
          <Stack gap="sm">
            <label className="text-sm font-medium text-neutral-200">Source</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SOURCE_OPTIONS.map(opt => {
                const Icon = opt.icon
                const isActive = source === opt.type
                return (
                  <button
                    key={opt.type}
                    onClick={() => { setSource(opt.type); setSelectedEntity(null); setContext('') }}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                      isActive
                        ? 'border-[#39FF14]/40 bg-[#39FF14]/5'
                        : 'border-neutral-700 hover:border-neutral-600'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-[#39FF14]' : opt.color}`} />
                    <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-neutral-400'}`}>
                      {opt.label}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Entity Selector (non-custom sources) */}
            {source !== 'custom' && (
              <div className="mt-2">
                {entitiesLoading ? (
                  <div className="flex items-center gap-2 py-2 text-xs text-neutral-500">
                    <Loader2 className="h-3 w-3 animate-spin" /> Loading...
                  </div>
                ) : entities.length === 0 ? (
                  <p className="py-2 text-xs text-neutral-500">No items found.</p>
                ) : (
                  <div className="relative" ref={entityDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setEntityDropdownOpen(!entityDropdownOpen)}
                      className="w-full px-4 py-3 rounded-xl bg-neutral-900/80 border border-neutral-700/50 hover:border-neutral-600 transition-colors flex items-center gap-3 text-left"
                    >
                      {source === 'life_vision' && <Target className="w-4 h-4 text-purple-400 flex-shrink-0" />}
                      {source === 'vision_board_item' && <Image className="w-4 h-4 text-pink-400 flex-shrink-0" />}
                      {source === 'journal_entry' && <BookOpen className="w-4 h-4 text-teal-400 flex-shrink-0" />}
                      <span className="text-sm text-white font-medium flex-1 truncate">
                        {selectedEntity ? (
                          source === 'life_vision' ? (
                            <span className="flex items-center gap-1.5">
                              Version {selectedEntity.version_number || ''}
                              {selectedEntity.household_id && <Home className="w-3.5 h-3.5 text-secondary-500 inline-block" />}
                              {selectedEntity.is_active && (
                                <span className="text-[10px] font-semibold text-[#39FF14] bg-[#39FF14]/10 px-1.5 py-0.5 rounded">Active</span>
                              )}
                            </span>
                          ) : getEntityLabel(selectedEntity)
                        ) : `Select a ${SOURCE_OPTIONS.find(s => s.type === source)?.label}...`}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${entityDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {entityDropdownOpen && (
                      <div className="absolute z-50 left-0 right-0 mt-2 bg-[#1A1A1A] border border-neutral-700 rounded-xl shadow-2xl overflow-hidden">
                        {entities.length > 5 && (
                          <div className="p-2 border-b border-neutral-700/50">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                              <input
                                type="text"
                                value={entitySearch}
                                onChange={(e) => setEntitySearch(e.target.value)}
                                placeholder="Search..."
                                className="w-full pl-9 pr-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#39FF14]/50"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                        )}
                        <div className="py-1 max-h-64 overflow-y-auto">
                          {filteredEntities.length === 0 ? (
                            <div className="px-4 py-3 text-center">
                              <p className="text-sm text-neutral-500">No items match your search</p>
                            </div>
                          ) : (
                            filteredEntities.map(entity => {
                              const isSel = entity.id === selectedEntity?.id
                              return (
                                <button
                                  key={entity.id}
                                  type="button"
                                  onClick={() => handleEntitySelect(entity)}
                                  className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${
                                    isSel ? 'bg-[#39FF14]/10' : 'hover:bg-neutral-800'
                                  }`}
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate flex items-center gap-1.5">
                                      {source === 'life_vision' ? (
                                        <>
                                          Version {entity.version_number}
                                          {entity.household_id && <Home className="w-3.5 h-3.5 text-secondary-500 flex-shrink-0" />}
                                          {entity.is_active && (
                                            <span className="text-[10px] font-semibold text-[#39FF14] bg-[#39FF14]/10 px-1.5 py-0.5 rounded">Active</span>
                                          )}
                                        </>
                                      ) : (
                                        getEntityLabel(entity)
                                      )}
                                    </p>
                                    <p className="text-xs text-neutral-500">
                                      {source === 'life_vision' && (
                                        <>
                                          <span className="text-neutral-400">{entity.household_id ? 'Household' : 'Individual'}</span>
                                          {' · '}
                                        </>
                                      )}
                                      {source === 'vision_board_item' && entity.categories?.length > 0 && (
                                        <>
                                          <span className="text-neutral-400">{entity.categories.slice(0, 2).join(', ')}</span>
                                          {' · '}
                                        </>
                                      )}
                                      {entity.created_at && new Date(entity.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </p>
                                  </div>
                                  {isSel && <Check className="w-4 h-4 text-[#39FF14] flex-shrink-0" />}
                                </button>
                              )
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Life Vision Category Grid */}
            {source === 'life_vision' && selectedEntity && (
              <div className="mt-3">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-medium text-neutral-400">Pick categories to write about</label>
                  {selectedCategories.length > 0 && (
                    <span className="text-xs text-[#39FF14]">{selectedCategories.length} selected</span>
                  )}
                </div>
                <CategoryGrid
                  categories={LIFE_CATEGORIES}
                  selectedCategories={selectedCategories}
                  onCategoryClick={handleCategoryToggle}
                  mode="selection"
                  lifeVisionCategoryStrip
                  desktopColumnCount={6}
                />
              </div>
            )}
          </Stack>
        </Card>

        {/* Context (populated from source) */}
        {context && (
          <Card variant="glass" className="p-5">
            <Stack gap="sm">
              <label className="text-sm font-medium text-neutral-200">Context</label>
              <p className="text-xs text-neutral-500">VIVA uses this as emotional source material. Edit freely.</p>
              <Textarea
                value={context}
                onChange={e => setContext(e.target.value)}
                rows={5}
                className="text-sm"
              />
            </Stack>
          </Card>
        )}

        {/* Song Title + Idea */}
        <Card variant="glass" className="p-5">
          <Stack gap="sm">
            <div>
              <label className="text-sm font-medium text-neutral-200">Song Title</label>
              <input
                type="text"
                value={songTitle}
                onChange={e => setSongTitle(e.target.value)}
                placeholder="e.g. Wide Open, Let It Burn, Golden Hour"
                className="mt-1.5 w-full rounded-lg border border-neutral-700 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-[#39FF14]/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-200">What's this song about?</label>
              <div className="mt-1.5 [&_textarea]:!bg-black/40 [&_textarea]:!border-neutral-700">
                <RecordingTextarea
                  value={songIdea}
                  onChange={setSongIdea}
                  placeholder="A song about... Type or tap the mic to record."
                  rows={4}
                  storageFolder="customTracks"
                  recordingPurpose="quick"
                  category="songwriter"
                  instanceId="songwriter-song-idea"
                />
              </div>
            </div>
          </Stack>
        </Card>

        {/* Lyrics */}
        <Card variant="glass" className={`relative p-5 overflow-hidden ${lyricsMode === 'generating' ? 'min-h-[200px]' : ''}`}>
          <VIVALoadingOverlay
            isVisible={lyricsMode === 'generating'}
            className="!absolute !inset-0 !rounded-2xl !z-10"
            size="sm"
            messages={[
              'VIVA is writing your lyrics...',
              'Crafting verses and hooks...',
              'Shaping the emotional arc...',
              'Putting finishing touches...',
            ]}
            cycleDuration={4000}
            estimatedTime="This usually takes 10-20 seconds"
            estimatedDuration={20000}
          />
          <Stack gap="sm">
            <label className="text-sm font-medium text-neutral-200">Lyrics</label>

            {(lyricsMode === 'none' || lyricsMode === 'generating') && (
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={generateLyrics}
                  disabled={!songIdea.trim() || lyricsMode === 'generating'}
                  className="flex-1"
                >
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  Write My Song
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setLyricsMode('paste')}
                  disabled={lyricsMode === 'generating'}
                  className="flex-1"
                >
                  Paste Lyrics
                </Button>
              </div>
            )}

            {(lyricsMode === 'done' || lyricsMode === 'paste') && (
              <div>
                <Textarea
                  value={lyrics}
                  onChange={e => setLyrics(e.target.value)}
                  placeholder="[Verse 1]&#10;Your lyrics here..."
                  rows={12}
                  className="font-mono text-sm"
                />
                <div className="mt-2 flex gap-2">
                  {lyricsMode === 'done' && (
                    <Button variant="ghost" size="sm" onClick={generateLyrics}>
                      <Sparkles className="mr-1 h-3 w-3" />
                      Rewrite
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setLyrics(''); setLyricsMode('none') }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </Stack>
        </Card>

        {/* Reference Track */}
        <Card variant="glass" className="relative p-5 overflow-hidden">
          <VIVALoadingOverlay
            isVisible={audioLoading}
            className="!absolute !inset-0 !rounded-2xl"
            size="sm"
            messages={[
              'Extracting audio from YouTube...',
              'Processing the reference track...',
              'Almost ready...',
            ]}
            cycleDuration={5000}
            estimatedTime="This usually takes 10-30 seconds"
            estimatedDuration={30000}
          />
          <Stack gap="sm" className="min-w-0">
            <label className="text-sm font-medium text-neutral-200">Reference Track</label>
            <p className="text-xs text-neutral-500">Paste a YouTube URL, pick a Vibration Fit song, or reuse one from your library. Select 30 seconds to set the musical vibe.</p>

            <div className="grid min-w-0 grid-cols-1 gap-2 md:grid-cols-2">
              <ReferenceLibraryPicker
                className={`min-w-0${refPickerOpen ? ' md:col-span-2' : ''}`}
                onOpenChange={setRefPickerOpen}
                onSelect={(ref: ReferenceTrack) => {
                  if (ref.youtube_url) setYoutubeUrl(ref.youtube_url)
                  setAudioUrl(null)
                  if (ref.title) setReferenceTitle(ref.title)
                  if (ref.mureka_file_id) setReferenceId(ref.mureka_file_id)
                  if (ref.clip_url) setReferenceClipUrl(ref.clip_url)
                  setRegionStart(Number(ref.clip_start) || 0)
                  setRegionEnd(Number(ref.clip_end) || 30)
                }}
              />

              <VibrationFitSongPicker
                className={`min-w-0${songPickerOpen ? ' md:col-span-2' : ''}`}
                onOpenChange={setSongPickerOpen}
                onSelect={(song: VibrationFitSong) => {
                  setAudioError(null)
                  setYoutubeUrl('')
                  setReferenceId(null)
                  setReferenceClipUrl(null)
                  setReferenceTitle(song.title)
                  setRegionStart(0)
                  setRegionEnd(Math.min(30, song.duration_seconds || 30))
                  setAudioDuration(song.duration_seconds || 0)
                  setAudioUrl(song.preview_url)
                }}
              />
            </div>

            {referenceId && !audioUrl && referenceTitle && (
              <div className="flex min-w-0 flex-col gap-2 rounded-lg border border-[#39FF14]/20 bg-[#39FF14]/5 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#39FF14]/10">
                    <Music2 className="h-4 w-4 text-[#39FF14]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-200">{referenceTitle}</p>
                    <p className="text-[10px] text-neutral-500">
                      {regionStart.toFixed(0)}s – {regionEnd.toFixed(0)}s · Ready to use
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => { setReferenceId(null); setReferenceClipUrl(null); loadYoutubeAudio() }}
                    className="whitespace-nowrap rounded px-2 py-1 text-[10px] font-medium text-neutral-400 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    Change section
                  </button>
                  <button
                    type="button"
                    onClick={() => { setReferenceId(null); setReferenceTitle(null); setReferenceClipUrl(null); setYoutubeUrl('') }}
                    className="shrink-0 text-neutral-500 hover:text-neutral-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {!referenceId && (
              <div className="flex min-w-0 gap-2">
                <div className="relative min-w-0 flex-1">
                  <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={e => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full rounded-lg border border-neutral-700 bg-black/40 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-neutral-600 focus:border-[#39FF14]/50 focus:outline-none"
                    onKeyDown={e => { if (e.key === 'Enter') loadYoutubeAudio() }}
                  />
                </div>
                <Button
                  variant="ghost"
                  onClick={loadYoutubeAudio}
                  disabled={!youtubeUrl.trim() || audioLoading}
                >
                  {audioLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Load'}
                </Button>
              </div>
            )}

            {audioError && (
              <p className="text-xs text-red-400">{audioError}</p>
            )}

            {audioUrl && (
              <div className="space-y-2">
                {referenceTitle && (
                  <p className="truncate text-xs font-medium text-neutral-300">
                    {referenceTitle}
                  </p>
                )}
                <div
                  ref={waveformRef}
                  className="min-w-0 overflow-hidden rounded-lg border border-neutral-700 bg-black/40 p-2"
                />
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1">
                  <button
                    onClick={togglePreview}
                    className="flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-600 px-3 py-1 text-xs text-neutral-300 transition-colors hover:border-neutral-400"
                  >
                    {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    Preview
                  </button>
                  <span className="min-w-0 truncate text-xs text-neutral-500">
                    {regionStart.toFixed(1)}s – {regionEnd.toFixed(1)}s ({(regionEnd - regionStart).toFixed(1)}s selected)
                  </span>
                  <button
                    onClick={() => { setAudioUrl(null); setYoutubeUrl(''); setReferenceId(null) }}
                    className="shrink-0 text-neutral-500 hover:text-neutral-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </Stack>
        </Card>

        {/* Life Categories (source-agnostic tagging for filtering) */}
        <Card variant="glass" className="p-5">
          <Stack gap="sm">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-200">Life Categories</label>
              {categoryTags.length > 0 && (
                <span className="text-xs text-[#39FF14]">{categoryTags.length} tagged</span>
              )}
            </div>
            <p className="text-xs text-neutral-500">
              Tag as many life categories as this song speaks to. A song made from one area can still apply to others — this makes it easy to filter and find later.
            </p>
            <CategoryGrid
              categories={LIFE_CATEGORIES}
              selectedCategories={categoryTags}
              onCategoryClick={handleCategoryTagToggle}
              mode="selection"
              lifeVisionCategoryStrip
              desktopColumnCount={6}
            />
          </Stack>
        </Card>

        {/* Full-page VIVA overlay for track creation */}
        <VIVALoadingOverlay
          isVisible={generating}
          className="!fixed !inset-0 !rounded-none"
          size="lg"
          messages={[
            'VIVA is composing your track...',
            'Laying down the beat and melody...',
            'Mixing vocals and instrumentation...',
            'Putting the finishing touches on your song...',
          ]}
          cycleDuration={5000}
          estimatedTime="This usually takes 30-60 seconds"
          estimatedDuration={60000}
        />

        {/* Generate Button / Error */}
        {createError ? (
          <Card variant="glass" className="flex flex-col items-center gap-4 p-6 text-center">
            <p className="text-sm text-red-400">{createError}</p>
            <div className="flex gap-3">
              <Button variant="primary" onClick={handleCreateClick} disabled={!hasLyrics}>
                <Music2 className="mr-1.5 h-4 w-4" />
                Try Again
              </Button>
              <Button variant="ghost" onClick={() => setCreateError(null)}>
                Dismiss
              </Button>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Button
              variant="primary"
              size="lg"
              onClick={handleCreateClick}
              disabled={!hasLyrics || generating || savingDraft}
              className="w-full py-4 text-base font-semibold"
            >
              <Music2 className="mr-2 h-5 w-5" />
              Create My Track
            </Button>
            {categoryError && (
              <p className="text-sm text-[#FF0040]">{categoryError}</p>
            )}
            <Button
              variant="ghost"
              onClick={handleSaveForLater}
              disabled={!hasLyrics || generating || savingDraft}
            >
              {savingDraft ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
              Save for later
            </Button>
            <p className="text-xs text-neutral-500">Saved songs live in My Songs — return anytime to generate.</p>
          </div>
        )}
      </Stack>

      <PublishAgreementModal
        isOpen={showAgreementModal}
        onClose={() => { setShowAgreementModal(false); pendingActionRef.current = null }}
        onSuccess={() => {
          setAgreementAccepted(true)
          setShowAgreementModal(false)
          const action = pendingActionRef.current
          pendingActionRef.current = null
          action?.()
        }}
      />
    </Container>
  )
}
