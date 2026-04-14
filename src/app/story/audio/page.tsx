'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Wand2,
  Mic,
  Volume2,
  ArrowRight,
  FileText,
  BookOpen,
  Image,
  PenLine,
  Sparkles,
  Clock,
  Play,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  Container,
  Stack,
  Card,
  Button,
  Spinner,
  Text,
} from '@/lib/design-system/components'
import { useStoryStudio } from '@/components/story-studio'
import type { Story } from '@/lib/stories/types'

const ENTITY_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  life_vision: { label: 'Life Vision', color: 'text-purple-400 bg-purple-500/20', icon: Sparkles },
  vision_board_item: { label: 'Vision Board', color: 'text-cyan-400 bg-cyan-500/20', icon: Image },
  journal_entry: { label: 'Journal', color: 'text-teal-400 bg-teal-500/20', icon: PenLine },
  custom: { label: 'Custom', color: 'text-yellow-400 bg-yellow-500/20', icon: FileText },
  goal: { label: 'Goal', color: 'text-green-400 bg-green-500/20', icon: BookOpen },
}

function getAudioStatus(story: Story): 'generated' | 'recorded' | 'both' | 'none' {
  const hasGenerated = !!story.audio_set_id
  const hasRecorded = !!story.user_audio_url
  if (hasGenerated && hasRecorded) return 'both'
  if (hasGenerated) return 'generated'
  if (hasRecorded) return 'recorded'
  return 'none'
}

export default function StoryAudioPage() {
  const { stories, loading, selectedStoryId, selectedStory, selectStory, activePill } = useStoryStudio()
  const [playingUrl, setPlayingUrl] = useState<string | null>(null)
  const [audioEl] = useState(() => typeof window !== 'undefined' ? new Audio() : null)

  useEffect(() => {
    return () => {
      if (audioEl) {
        audioEl.pause()
        audioEl.src = ''
      }
    }
  }, [audioEl])

  const filteredStories = stories.filter(s => {
    const status = getAudioStatus(s)
    if (activePill === 'all') return true
    if (activePill === 'generated') return status === 'generated' || status === 'both'
    if (activePill === 'recorded') return status === 'recorded' || status === 'both'
    return true
  })

  function handlePlay(url: string) {
    if (!audioEl) return
    if (playingUrl === url) {
      audioEl.pause()
      setPlayingUrl(null)
    } else {
      audioEl.src = url
      audioEl.play().catch(() => {})
      setPlayingUrl(url)
      audioEl.onended = () => setPlayingUrl(null)
    }
  }

  if (loading) {
    return (
      <Container size="xl" className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  if (stories.length === 0) {
    return (
      <Container size="xl" className="py-6">
        <Card className="p-8 md:p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-4">
            <Volume2 className="w-8 h-8 text-neutral-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Stories Yet</h3>
          <Text className="text-neutral-400 mb-6">
            Create a focus story first, then come back to generate or record audio for it.
          </Text>
          <Button asChild variant="primary">
            <Link href="/story/new">
              <Wand2 className="w-4 h-4 mr-2" />
              Create Story
            </Link>
          </Button>
        </Card>
      </Container>
    )
  }

  return (
    <Container size="xl" className="py-6">
      <Stack gap="lg">

        {/* Selected story detail + actions */}
        {selectedStory ? (
          <SelectedStoryPanel
            story={selectedStory}
            playingUrl={playingUrl}
            onPlay={handlePlay}
          />
        ) : (
          <Card className="p-6 text-center">
            <Text className="text-neutral-400">Select a story from the dropdown above to manage its audio.</Text>
          </Card>
        )}

        {/* All stories with audio status */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">
            {activePill === 'all' ? 'All Stories' : activePill === 'generated' ? 'Stories with Generated Audio' : 'Stories with Recordings'}
          </h2>
          {filteredStories.length === 0 ? (
            <Card variant="glass" className="p-6 text-center">
              <Text className="text-neutral-400">
                {activePill === 'all'
                  ? 'No stories found.'
                  : `No stories with ${activePill === 'generated' ? 'generated audio' : 'recordings'} yet.`}
              </Text>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredStories.map(story => {
                const meta = ENTITY_META[story.entity_type] || ENTITY_META.custom!
                const MetaIcon = meta.icon
                const status = getAudioStatus(story)
                const isSelected = story.id === selectedStoryId
                return (
                  <button
                    key={story.id}
                    type="button"
                    onClick={() => selectStory(story.id)}
                    className="text-left block w-full"
                  >
                    <Card
                      variant="outlined"
                      className={`p-4 transition-all duration-200 hover:-translate-y-0.5 ${
                        isSelected ? 'border-[#39FF14]/50 bg-[#39FF14]/5' : 'hover:border-neutral-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${meta.color}`}>
                              <MetaIcon className="w-3 h-3" />
                              {meta.label}
                            </span>
                          </div>
                          <p className="text-sm text-white font-medium truncate">
                            {story.title || 'Untitled Story'}
                          </p>
                        </div>
                        <AudioStatusBadge status={status} />
                      </div>
                      {story.content && (
                        <p className="text-xs text-neutral-500 line-clamp-2 mb-2">{story.content.slice(0, 120)}</p>
                      )}
                      <div className="flex items-center gap-3 text-[11px] text-neutral-500">
                        {story.word_count && story.word_count > 0 && <span>{story.word_count} words</span>}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {Math.max(1, Math.ceil((story.word_count || 0) / 200))} min read
                        </span>
                      </div>
                    </Card>
                  </button>
                )
              })}
            </div>
          )}
        </section>
      </Stack>
    </Container>
  )
}

function SelectedStoryPanel({
  story,
  playingUrl,
  onPlay,
}: {
  story: Story
  playingUrl: string | null
  onPlay: (url: string) => void
}) {
  const meta = ENTITY_META[story.entity_type] || ENTITY_META.custom!
  const MetaIcon = meta.icon
  const hasGenerated = !!story.audio_set_id
  const hasRecording = !!story.user_audio_url

  return (
    <Card variant="elevated" className="bg-[#0A0A0A]">
      <div className="p-6">
        {/* Story header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${meta.color}`}>
                <MetaIcon className="w-3 h-3" />
                {meta.label}
              </span>
              <AudioStatusBadge status={getAudioStatus(story)} />
            </div>
            <h2 className="text-lg md:text-xl font-semibold text-white">
              {story.title || 'Untitled Story'}
            </h2>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/story/${story.id}`}>View Story</Link>
          </Button>
        </div>

        {/* Content preview */}
        {story.content && (
          <p className="text-sm text-neutral-400 line-clamp-3 mb-6">{story.content.slice(0, 250)}</p>
        )}

        {/* Audio playback */}
        {hasRecording && story.user_audio_url && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900 border border-neutral-800 mb-4">
            <button
              type="button"
              onClick={() => onPlay(story.user_audio_url!)}
              className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0 hover:bg-teal-500/30 transition-colors"
            >
              <Play className={`w-4 h-4 text-teal-400 ${playingUrl === story.user_audio_url ? 'animate-pulse' : ''}`} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium">Personal Recording</p>
              {story.user_audio_duration_seconds && (
                <p className="text-xs text-neutral-500">
                  {Math.floor(story.user_audio_duration_seconds / 60)}:{Math.floor(story.user_audio_duration_seconds % 60).toString().padStart(2, '0')}
                </p>
              )}
            </div>
            <Mic className="w-4 h-4 text-teal-400 flex-shrink-0" />
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button variant={hasGenerated ? 'outline' : 'primary'} asChild className="w-full">
            <Link href={`/story/${story.id}/audio/generate`} className="flex items-center justify-center gap-2">
              <Wand2 className="w-4 h-4" />
              {hasGenerated ? 'Regenerate Audio' : 'Generate Audio'}
            </Link>
          </Button>
          <Button variant={hasRecording ? 'outline' : 'secondary'} asChild className="w-full">
            <Link href={`/story/${story.id}/audio/record`} className="flex items-center justify-center gap-2">
              <Mic className="w-4 h-4" />
              {hasRecording ? 'Re-record' : 'Record Audio'}
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  )
}

function AudioStatusBadge({ status }: { status: 'generated' | 'recorded' | 'both' | 'none' }) {
  if (status === 'none') {
    return <span className="text-[10px] text-neutral-500 px-2 py-0.5 rounded-full bg-neutral-800">No Audio</span>
  }
  if (status === 'both') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-[#39FF14] px-2 py-0.5 rounded-full bg-[#39FF14]/10">
        <Volume2 className="w-3 h-3" />
        <Mic className="w-3 h-3" />
        Both
      </span>
    )
  }
  if (status === 'generated') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-purple-400 px-2 py-0.5 rounded-full bg-purple-500/10">
        <Volume2 className="w-3 h-3" />
        Generated
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-teal-400 px-2 py-0.5 rounded-full bg-teal-500/10">
      <Mic className="w-3 h-3" />
      Recorded
    </span>
  )
}
