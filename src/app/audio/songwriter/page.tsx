'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Container, Stack, Card, Button, Textarea, CategoryGrid } from '@/lib/design-system/components'
import { Music2, Sparkles, Loader2, Link2, X, Play, Pause, Target, Image, BookOpen, ChevronDown } from 'lucide-react'
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

  // Life Vision category state
  const [selectedCategories, setSelectedCategories] = useState<LifeCategoryKey[]>([])
  const [visionData, setVisionData] = useState<Record<string, string>>({})

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

  // Generation state
  const [generating, setGenerating] = useState(false)
  const [songId, setSongId] = useState<string | null>(null)

  // Refs
  const waveformRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<any>(null)

  // Load entities when source changes
  useEffect(() => {
    if (source === 'custom') {
      setEntities([])
      setSelectedEntity(null)
      return
    }
    loadEntities(source)
  }, [source])

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

  function handleEntitySelect(entity: any) {
    setSelectedEntity(entity)
    setEntityDropdownOpen(false)

    if (source === 'life_vision') {
      const catTexts: Record<string, string> = {}
      for (const key of LIFE_CATEGORY_KEYS) {
        if (entity[key]) catTexts[key] = entity[key]
      }
      setVisionData(catTexts)
      setSelectedCategories([])
      setContext('')
    } else if (source === 'vision_board_item') {
      const parts = [entity.name, entity.description].filter(Boolean)
      setContext(parts.join('\n\n'))
    } else if (source === 'journal_entry') {
      const parts = [entity.title, entity.content?.slice(0, 800)].filter(Boolean)
      setContext(parts.join('\n\n'))
    }
  }

  function handleCategoryToggle(key: string) {
    setSelectedCategories(prev => {
      const next = prev.includes(key as LifeCategoryKey)
        ? prev.filter(k => k !== key)
        : [...prev, key as LifeCategoryKey]

      const texts = next
        .map(k => visionData[k])
        .filter(Boolean)
        .join('\n\n')
      setContext(texts.slice(0, 1500))

      return next
    })
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
      const response = await fetch('/api/songs/extract-youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeUrl }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to extract audio')
      }

      const { audio_url, duration } = await response.json()
      setAudioUrl(audio_url)
      setAudioDuration(duration || 180)
      setRegionEnd(Math.min(30, duration || 30))
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

        regions.addRegion({
          start: 0,
          end: Math.min(30, duration),
          color: 'rgba(57, 255, 20, 0.15)',
          drag: true,
          resize: true,
        })
      })

      regions.on('region-updated', (region: any) => {
        let start = region.start
        let end = region.end

        if (end - start > 30) {
          end = start + 30
          region.end = end
        }
        if (end - start < 5) {
          end = start + 5
          region.end = end
        }

        setRegionStart(start)
        setRegionEnd(end)
        setReferenceId(null)
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

  // Preview the selected region
  const togglePreview = () => {
    if (!wavesurferRef.current) return
    if (isPlaying) {
      wavesurferRef.current.pause()
    } else {
      wavesurferRef.current.setTime(regionStart)
      wavesurferRef.current.play()
      setTimeout(() => {
        wavesurferRef.current?.pause()
      }, (regionEnd - regionStart) * 1000)
    }
  }

  // Upload reference and generate song
  const createTrack = async () => {
    if (!lyrics.trim()) return
    setGenerating(true)

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
          }),
        })
        if (!refResponse.ok) {
          const refErr = await refResponse.json().catch(() => ({}))
          throw new Error(refErr.error || 'Reference track upload failed')
        }
        const refData = await refResponse.json()
        refId = refData.reference_id
        setReferenceId(refId)
      }

      let currentSongId = songId
      if (!currentSongId) {
        const createRes = await fetch('/api/songs/generate-lyrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entity_type: source,
            entity_id: selectedEntity?.id,
            song_essence: {
              song_idea: songIdea || 'Custom song',
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
            title: `Song – ${(songIdea || 'Custom').slice(0, 40)}`,
          }),
        })
        currentSongId = createRes.headers.get('X-Song-Id')
        setSongId(currentSongId)
      }

      if (!currentSongId) throw new Error('No song record')

      const musicRes = await fetch('/api/songs/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          song_id: currentSongId,
          reference_id: refId || undefined,
        }),
      })

      if (!musicRes.ok) {
        const err = await musicRes.json()
        throw new Error(err.error || 'Failed to start music generation')
      }

      router.push(`/audio/songwriter/${currentSongId}`)
    } catch (err) {
      console.error('Create track failed:', err)
      setGenerating(false)
    }
  }

  const hasLyrics = lyrics.trim().length > 0

  return (
    <Container size="md" className="pt-2 pb-8">
      <Stack gap="lg">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Songwriter</h1>
          <p className="mt-1 text-sm text-neutral-400">Create original music from an idea.</p>
        </div>

        {/* Source Picker */}
        <Card variant="glass" className="p-5">
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
                  <div className="relative">
                    <button
                      onClick={() => setEntityDropdownOpen(!entityDropdownOpen)}
                      className="flex w-full items-center justify-between rounded-lg border border-neutral-700 bg-black/40 px-3 py-2.5 text-sm text-white"
                    >
                      <span className={selectedEntity ? 'text-white' : 'text-neutral-500'}>
                        {selectedEntity ? getEntityLabel(selectedEntity) : `Select a ${SOURCE_OPTIONS.find(s => s.type === source)?.label}...`}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-neutral-500 transition-transform ${entityDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {entityDropdownOpen && (
                      <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-neutral-700 bg-neutral-900 shadow-xl">
                        {entities.map(entity => (
                          <button
                            key={entity.id}
                            onClick={() => handleEntitySelect(entity)}
                            className="w-full px-3 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800"
                          >
                            {getEntityLabel(entity)}
                          </button>
                        ))}
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
              <Textarea
                value={songIdea}
                onChange={e => setSongIdea(e.target.value)}
                placeholder="A song about..."
                rows={4}
                className="mt-1.5"
              />
            </div>
          </Stack>
        </Card>

        {/* Lyrics */}
        <Card variant="glass" className="p-5">
          <Stack gap="sm">
            <label className="text-sm font-medium text-neutral-200">Lyrics</label>

            {lyricsMode === 'none' && (
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={generateLyrics}
                  disabled={!songIdea.trim()}
                  className="flex-1"
                >
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  Write My Song
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setLyricsMode('paste')}
                  className="flex-1"
                >
                  Paste Lyrics
                </Button>
              </div>
            )}

            {lyricsMode === 'generating' && (
              <div className="rounded-lg border border-neutral-700 bg-black/40 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs text-[#39FF14]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  VIVA is writing...
                </div>
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-neutral-200">
                  {lyrics}
                </pre>
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
        <Card variant="glass" className="p-5">
          <Stack gap="sm">
            <label className="text-sm font-medium text-neutral-200">Reference Track</label>
            <p className="text-xs text-neutral-500">Paste a YouTube URL. Pick 30 seconds to set the musical vibe.</p>

            <div className="flex gap-2">
              <div className="relative flex-1">
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

            {audioError && (
              <p className="text-xs text-red-400">{audioError}</p>
            )}

            {audioUrl && (
              <div className="space-y-2">
                <div
                  ref={waveformRef}
                  className="rounded-lg border border-neutral-700 bg-black/40 p-2"
                />
                <div className="flex items-center justify-between">
                  <button
                    onClick={togglePreview}
                    className="flex items-center gap-1.5 rounded-full border border-neutral-600 px-3 py-1 text-xs text-neutral-300 transition-colors hover:border-neutral-400"
                  >
                    {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    Preview
                  </button>
                  <span className="text-xs text-neutral-500">
                    {regionStart.toFixed(1)}s – {regionEnd.toFixed(1)}s ({(regionEnd - regionStart).toFixed(1)}s selected)
                  </span>
                  <button
                    onClick={() => { setAudioUrl(null); setYoutubeUrl(''); setReferenceId(null) }}
                    className="text-neutral-500 hover:text-neutral-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </Stack>
        </Card>

        {/* Generate Button */}
        <Button
          variant="primary"
          size="lg"
          onClick={createTrack}
          disabled={!hasLyrics || generating}
          className="w-full py-4 text-base font-semibold"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Music2 className="mr-2 h-5 w-5" />
              Create My Track
            </>
          )}
        </Button>
      </Stack>
    </Container>
  )
}
