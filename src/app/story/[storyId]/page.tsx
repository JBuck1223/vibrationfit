'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  Mic,
  Trash2,
  Image,
  FileText,
  Target,
  Clock,
  BookOpen,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Headphones,
  Check,
  Edit,
  Save,
  X,
} from 'lucide-react'
import {
  Container,
  Stack,
  Card,
  Button,
  Spinner,
  Input,
  AutoResizeTextarea,
} from '@/lib/design-system/components'
import { createClient } from '@/lib/supabase/client'
import { useStory } from '@/lib/stories'
import type { UpdateStoryPayload } from '@/lib/stories'

const ENTITY_META: Record<string, { label: string; icon: React.ElementType; badgeColor: string }> = {
  life_vision: { label: 'Life Vision', icon: Target, badgeColor: 'text-purple-400 bg-purple-500/20 border-purple-500/30' },
  vision_board_item: { label: 'Vision Board', icon: Image, badgeColor: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30' },
  journal_entry: { label: 'Journal', icon: BookOpen, badgeColor: 'text-teal-400 bg-teal-500/20 border-teal-500/30' },
  custom: { label: 'Custom', icon: Lightbulb, badgeColor: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30' },
  goal: { label: 'Goal', icon: BookOpen, badgeColor: 'text-green-400 bg-green-500/20 border-green-500/30' },
  schedule_block: { label: 'Schedule', icon: Clock, badgeColor: 'text-orange-400 bg-orange-500/20 border-orange-500/30' },
}

const VOICE_DISPLAY_NAMES: Record<string, string> = {
  alloy: 'Alloy', shimmer: 'Shimmer', ash: 'Ash', coral: 'Coral',
  echo: 'Echo', fable: 'Fable', onyx: 'Onyx', nova: 'Nova', sage: 'Sage',
}

interface AudioOption {
  id: string
  label: string
  sublabel: string
  url: string
  icon: React.ElementType
  iconColor: string
}

export default function StoryDetailPage({
  params,
}: {
  params: Promise<{ storyId: string }>
}) {
  const router = useRouter()
  const supabase = createClient()
  const [storyId, setStoryId] = useState<string>('')
  const [deleting, setDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showSourceInput, setShowSourceInput] = useState(false)
  const [visionVersionLabel, setVisionVersionLabel] = useState<string | null>(null)

  // Audio state
  const [audioOptions, setAudioOptions] = useState<AudioOption[]>([])
  const [selectedAudioId, setSelectedAudioId] = useState<string | null>(null)
  const [isAudioDropdownOpen, setIsAudioDropdownOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ;(async () => {
      const p = await params
      setStoryId(p.storyId)
    })()
  }, [params])

  const { story, loading, error, saving, updateStory, deleteStory } = useStory(storyId)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsAudioDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Resolve vision version label for life_vision stories
  useEffect(() => {
    if (!story || story.entity_type !== 'life_vision' || !story.entity_id) return
    supabase
      .from('vision_versions')
      .select('version_number, is_active')
      .eq('id', story.entity_id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setVisionVersionLabel(`Version ${data.version_number}${data.is_active ? ' (active)' : ''}`)
        }
      })
  }, [story?.id, story?.entity_type, story?.entity_id, supabase])

  // Load audio options when story is available
  useEffect(() => {
    if (!story) return
    loadAudioOptions()
  }, [story?.id, story?.audio_set_id, story?.user_audio_url])

  async function loadAudioOptions() {
    if (!story) return
    const options: AudioOption[] = []

    if (story.audio_set_id) {
      const { data: tracks } = await supabase
        .from('audio_tracks')
        .select('id, audio_url, voice_id, section_key')
        .eq('audio_set_id', story.audio_set_id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })

      if (tracks && tracks.length > 0) {
        const { data: audioSet } = await supabase
          .from('audio_sets')
          .select('name, voice_id, variant')
          .eq('id', story.audio_set_id)
          .maybeSingle()

        const voiceName = audioSet?.voice_id ? (VOICE_DISPLAY_NAMES[audioSet.voice_id] || audioSet.voice_id) : 'VIVA'
        const setName = audioSet?.name || 'Generated Audio'

        tracks.forEach((track, idx) => {
          options.push({
            id: `generated-${track.id}`,
            label: tracks.length > 1 ? `${setName} (${idx + 1}/${tracks.length})` : setName,
            sublabel: `${voiceName} narration`,
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

    setAudioOptions(options)
    if (options.length > 0 && !selectedAudioId) {
      setSelectedAudioId(options[0].id)
    }
  }

  // Wire up audio element
  useEffect(() => {
    if (typeof window === 'undefined') return
    audioRef.current = new Audio()
    const audio = audioRef.current

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onLoadedMetadata = () => setDuration(audio.duration)
    const onEnded = () => { setIsPlaying(false); setCurrentTime(0) }
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.pause()
      audio.src = ''
    }
  }, [])

  function handleSelectAudio(optionId: string) {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)
    }
    setSelectedAudioId(optionId)
    setIsAudioDropdownOpen(false)
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    if (!audioRef.current) return
    const time = parseFloat(e.target.value)
    audioRef.current.currentTime = time
    setCurrentTime(time)
  }

  function formatTime(time: number) {
    if (isNaN(time) || !isFinite(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  function togglePlayPause() {
    if (!audioRef.current || !selectedAudioId) return
    const selectedOption = audioOptions.find(o => o.id === selectedAudioId)
    if (!selectedOption) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      if (audioRef.current.src !== selectedOption.url) {
        audioRef.current.src = selectedOption.url
      }
      audioRef.current.play().catch(() => setIsPlaying(false))
    }
  }

  function startEditing() {
    if (!story) return
    setEditTitle(story.title || '')
    setEditContent(story.content || '')
    setIsEditing(true)
  }

  function cancelEditing() {
    setIsEditing(false)
    setEditTitle('')
    setEditContent('')
  }

  async function handleSave() {
    if (!story) return
    setIsSaving(true)
    const payload: UpdateStoryPayload = { content: editContent }
    if (editTitle !== story.title) payload.title = editTitle
    if (story.status === 'draft' && editContent.trim().length > 0) {
      payload.status = 'completed'
    }
    const success = await updateStory(payload)
    setIsSaving(false)
    if (success) setIsEditing(false)
  }

  async function handleMarkComplete() {
    if (!story) return
    await updateStory({ status: 'completed' })
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this story? This cannot be undone.')) return
    setDeleting(true)
    const success = await deleteStory()
    if (success) router.push('/story')
    setDeleting(false)
  }

  if (loading || !storyId) {
    return (
      <Container size="xl">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    )
  }

  if (error || !story) {
    return (
      <Container size="xl">
        <Card className="text-center p-4 md:p-6 lg:p-8">
          <p className="text-red-400 mb-4">{error || 'Story not found'}</p>
          <Button asChild variant="outline">
            <Link href="/story">
              <ChevronLeft className="w-4 h-4 mr-2" />
              All Stories
            </Link>
          </Button>
        </Card>
      </Container>
    )
  }

  const meta = ENTITY_META[story.entity_type] || ENTITY_META.custom
  const EntityIcon = meta.icon
  const wordCount = story.word_count || 0
  const readTime = Math.max(1, Math.ceil(wordCount / 200))
  const focusAreas = (story.metadata?.selected_categories as string[] | undefined) || []
  const selectedOption = audioOptions.find(o => o.id === selectedAudioId)
  const SelectedAudioIcon = selectedOption?.icon || Headphones

  return (
    <Container size="xl">
      <Stack gap="md">
        <Card
          variant="outlined"
          className="!p-0 md:!p-6 lg:!p-8 !bg-transparent !border-transparent !rounded-none md:!rounded-2xl md:!bg-[#101010] md:!border-[#1F1F1F]"
        >
          <Stack gap="lg">
            <div className="flex justify-between items-center gap-4 flex-wrap">
              <Button variant="ghost" size="sm" asChild className="text-neutral-400 hover:text-white -ml-2">
                <Link href="/story" className="inline-flex items-center gap-1.5">
                  <ChevronLeft className="w-4 h-4 shrink-0" />
                  All stories
                </Link>
              </Button>
              <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                {new Date(story.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            {!isEditing && (
              <>
                <section className="space-y-3 text-center">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-[#2A2A2A]" />
                    <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Story title</p>
                    <div className="h-px flex-1 bg-[#2A2A2A]" />
                  </div>
                  <p className="text-base font-medium text-white text-center rounded-xl border border-[#282828] bg-[#1A1A1A] px-4 py-3">
                    {story.title || 'Untitled Story'}
                  </p>
                </section>

                <section className="space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 text-center">Details</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] md:text-xs font-semibold border ${meta.badgeColor}`}>
                      <EntityIcon className="w-3 h-3 shrink-0" />
                      {meta.label}
                    </span>
                    {focusAreas.length > 0 && focusAreas.map((cat: string) => (
                      <span key={cat} className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] md:text-xs font-medium border border-[#282828] text-neutral-300 bg-[#1A1A1A]">
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </span>
                    ))}
                    {wordCount > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] md:text-xs text-neutral-300 border border-[#282828] bg-[#1A1A1A]">
                        <FileText className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                        <span className="font-medium">{wordCount.toLocaleString()}</span>
                        <span>words</span>
                        <span className="text-neutral-600">·</span>
                        <span>{readTime} min read</span>
                      </span>
                    )}
                  </div>
                </section>
              </>
            )}

            {story.status === 'draft' && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10">
                <p className="text-sm text-amber-400 leading-relaxed">
                  This story is a draft. Edit and save to mark it complete, or click the button.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkComplete}
                  disabled={saving || !story.content?.trim()}
                  className="shrink-0 border-amber-500/50 text-amber-400 hover:bg-amber-500/10 self-start sm:self-auto"
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  Mark Complete
                </Button>
              </div>
            )}

            {isEditing ? (
              <>
                <section className="space-y-3 text-center">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-[#2A2A2A]" />
                    <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Story title</p>
                    <div className="h-px flex-1 bg-[#2A2A2A]" />
                  </div>
                  <Input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Story title"
                    className="!bg-[#1A1A1A] !border-[#282828] !text-base !font-medium !text-center"
                  />
                </section>

                <section className="space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 text-center">Story</p>
                  <div className="[&_textarea]:!bg-[#1A1A1A] [&_textarea]:!border-[#282828]">
                    <AutoResizeTextarea
                      value={editContent}
                      onChange={setEditContent}
                      placeholder="Write your story..."
                      className="min-h-[300px] text-base leading-relaxed"
                    />
                  </div>
                </section>

                <div className="flex flex-row gap-2 sm:gap-3 justify-end">
                  <Button variant="danger" size="sm" onClick={cancelEditing} className="flex-1 sm:flex-none sm:w-auto">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 sm:flex-none sm:w-auto"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <section className="space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 text-center">Story</p>

                  <div className="rounded-xl border border-dashed border-[#282828] bg-[#131313] p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {audioOptions.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={togglePlayPause}
                            disabled={!selectedAudioId}
                            className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                              selectedAudioId
                                ? 'bg-[#39FF14] hover:bg-[#00CC44] cursor-pointer'
                                : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                            }`}
                          >
                            {isPlaying
                              ? <Pause className="w-6 h-6 text-black" fill="black" />
                              : <Play className="w-6 h-6 text-black ml-0.5" fill="black" />
                            }
                          </button>

                          <div className="relative flex-1" ref={dropdownRef}>
                            <button
                              type="button"
                              onClick={() => setIsAudioDropdownOpen(!isAudioDropdownOpen)}
                              className="w-full px-4 py-2.5 rounded-full bg-[#1F1F1F] text-white border-2 border-[#333] hover:border-primary-500 focus:border-primary-500 focus:outline-none transition-colors cursor-pointer flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedOption?.iconColor || 'bg-primary-500/20 text-primary-500'}`}>
                                  <SelectedAudioIcon className="w-4 h-4" />
                                </div>
                                <div className="text-left flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">{selectedOption?.label || 'Select audio'}</div>
                                  <div className="text-xs text-neutral-500">{selectedOption?.sublabel}</div>
                                </div>
                              </div>
                              <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform flex-shrink-0 ml-2 ${isAudioDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isAudioDropdownOpen && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsAudioDropdownOpen(false)} />
                                <div className="absolute z-20 w-full mt-2 py-2 bg-[#1F1F1F] border-2 border-[#333] rounded-2xl shadow-xl max-h-[50vh] overflow-y-auto">
                                  {audioOptions.map((option) => {
                                    const OptionIcon = option.icon
                                    return (
                                      <div
                                        key={option.id}
                                        onClick={() => handleSelectAudio(option.id)}
                                        className={`px-4 py-3 hover:bg-[#2A2A2A] cursor-pointer transition-colors border-b border-[#333] last:border-b-0 ${
                                          selectedAudioId === option.id ? 'bg-primary-500/10' : ''
                                        }`}
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${option.iconColor}`}>
                                            <OptionIcon className="w-4 h-4" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm text-white truncate">{option.label}</div>
                                            <div className="text-xs text-neutral-500">{option.sublabel}</div>
                                          </div>
                                          {selectedAudioId === option.id && (
                                            <Check className="w-4 h-4 text-primary-500 flex-shrink-0" />
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {selectedAudioId && (duration > 0 || isPlaying) && (
                          <div>
                            <input
                              type="range"
                              min="0"
                              max={duration || 0}
                              value={currentTime}
                              onChange={handleSeek}
                              className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#39FF14] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(57,255,20,0.5)]"
                              style={{
                                background: duration
                                  ? `linear-gradient(to right, #39FF14 0%, #39FF14 ${(currentTime / duration) * 100}%, #404040 ${(currentTime / duration) * 100}%, #404040 100%)`
                                  : '#404040'
                              }}
                            />
                            <div className="flex justify-between text-xs text-neutral-400 mt-1">
                              <span>{formatTime(currentTime)}</span>
                              <span>{formatTime(duration)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center gap-2 py-2">
                        <Headphones className="w-8 h-8 text-neutral-600" />
                        <p className="text-sm text-neutral-400">No audio yet</p>
                      </div>
                    )}

                    <div className="flex flex-col items-center justify-center text-center gap-3 md:border-l md:border-[#282828] md:pl-4">
                      <Headphones className="w-6 h-6 text-primary-500 hidden md:block" />
                      <p className="text-sm text-neutral-400">
                        {audioOptions.length > 0 ? 'Generate more tracks or record your voice' : 'Generate your first track or record your voice'}
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <Button asChild variant="primary" size="sm" className="rounded-full">
                          <Link href={`/audio/generate?source=story&sourceId=${storyId}`}>
                            <Headphones className="w-3.5 h-3.5 mr-1.5" />
                            Generate Audio
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="rounded-full">
                          <Link href={`/audio/record?source=story&sourceId=${storyId}`}>
                            <Mic className="w-3.5 h-3.5 mr-1.5" />
                            Record
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {story.content ? (
                    <p className="text-neutral-300 whitespace-pre-wrap leading-relaxed">{story.content}</p>
                  ) : (
                    <p className="text-neutral-500 italic">No content yet. Click Edit to add your story.</p>
                  )}
                </section>

                <div className="flex flex-row gap-2 sm:gap-3 justify-end pt-1">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 sm:flex-none sm:w-auto"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deleting ? 'Deleting...' : 'Delete'}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={startEditing}
                    className="flex-1 sm:flex-none sm:w-auto"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </>
            )}

            {!isEditing && (!!story.metadata?.source_input || story.source === 'ai_generated') && (
              <section className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 text-center">Generation details</p>
                <div className="rounded-xl border border-dashed border-[#282828] bg-[#131313] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowSourceInput(!showSourceInput)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1A1A1A]/80 transition-colors text-left border-b border-[#282828]"
                  >
                    <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Show source and context</span>
                    {showSourceInput
                      ? <ChevronUp className="w-4 h-4 text-neutral-500 shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0" />
                    }
                  </button>
                  {showSourceInput && (
                    <div className="px-4 pb-4 pt-1 space-y-4">
                {/* Quick facts row */}
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-neutral-500">Source: </span>
                    <span className="text-neutral-300">{story.source === 'ai_generated' ? 'VIVA Generated' : story.source === 'user_written' ? 'User Written' : story.source || '—'}</span>
                  </div>
                  {story.generation_count > 1 && (
                    <div>
                      <span className="text-neutral-500">Generations: </span>
                      <span className="text-neutral-300">{story.generation_count}</span>
                    </div>
                  )}
                  {!!story.metadata?.custom_mode && (
                    <div>
                      <span className="text-neutral-500">Mode: </span>
                      <span className="text-neutral-300">{story.metadata.custom_mode === 'flip' ? 'Flip a Story' : 'Tell a Story'}</span>
                    </div>
                  )}
                </div>

                {/* Vision version (life_vision stories) */}
                {story.entity_type === 'life_vision' && visionVersionLabel && (
                  <div className="text-sm">
                    <span className="text-neutral-500">Life Vision: </span>
                    <span className="text-neutral-300">{visionVersionLabel}</span>
                  </div>
                )}

                {/* Selected categories with vision text previews */}
                {!!story.metadata?.category_data && (
                  <div className="space-y-2">
                    <p className="text-xs text-neutral-500 uppercase tracking-widest">Life Areas Used</p>
                    <div className="space-y-2">
                      {Object.entries(story.metadata.category_data as Record<string, { visionText?: string; focusNotes?: string }>).map(([cat, data]) => (
                        <div key={cat} className="rounded-xl bg-neutral-800/50 border border-neutral-700/50 px-4 py-3">
                          <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">{cat}</p>
                          {data.visionText && (
                            <p className="text-sm text-neutral-300 leading-relaxed line-clamp-3">{data.visionText}</p>
                          )}
                          {data.focusNotes && (
                            <p className="text-xs text-teal-400 mt-1.5">Focus: {data.focusNotes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Focus notes (non-life-vision stories) */}
                {!story.metadata?.category_data && !!story.metadata?.focus_notes && (
                  <div>
                    <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Focus Notes</p>
                    <p className="text-sm text-neutral-300 leading-relaxed">{String(story.metadata.focus_notes)}</p>
                  </div>
                )}

                {/* Raw source input */}
                {!!story.metadata?.source_input && (
                  <div>
                    <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Original Input</p>
                    <p className="text-neutral-400 whitespace-pre-wrap leading-relaxed text-sm">{String(story.metadata.source_input)}</p>
                  </div>
                )}
                    </div>
                  )}
                </div>
              </section>
            )}

          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
