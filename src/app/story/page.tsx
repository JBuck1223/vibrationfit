'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  FileText,
  BookOpen,
  Image,
  PenLine,
  Sparkles,
  Volume2,
  Mic,
  Clock,
  MoreVertical,
  Trash2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  Container,
  Stack,
  Card,
  Button,
  Spinner,
  Text,
  Badge,
} from '@/lib/design-system/components'
import type { StoryEntityType } from '@/lib/stories/types'
import { useStoryStudio } from '@/components/story-studio'

const ENTITY_TYPE_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  life_vision: { label: 'Life Vision', color: 'text-purple-400 bg-purple-500/20', icon: Sparkles },
  vision_board_item: { label: 'Vision Board', color: 'text-cyan-400 bg-cyan-500/20', icon: Image },
  journal_entry: { label: 'Journal', color: 'text-teal-400 bg-teal-500/20', icon: PenLine },
  custom: { label: 'Custom', color: 'text-yellow-400 bg-yellow-500/20', icon: FileText },
  goal: { label: 'Goal', color: 'text-green-400 bg-green-500/20', icon: BookOpen },
  schedule_block: { label: 'Schedule', color: 'text-orange-400 bg-orange-500/20', icon: Clock },
}

const PILL_LABELS: Record<string, string> = {
  all: 'All',
  life_vision: 'Life Vision',
  vision_board_item: 'Vision Board',
  journal_entry: 'Journal',
  custom: 'Custom',
}

export default function StoryHubPage() {
  const supabase = createClient()
  const { stories, loading, activePill, refreshStories } = useStoryStudio()

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(storyId: string) {
    if (!confirm('Are you sure you want to delete this story?')) return

    setDeletingId(storyId)
    const { error } = await supabase.from('stories').delete().eq('id', storyId)
    if (!error) {
      await refreshStories()
    }
    setDeletingId(null)
    setMenuOpenId(null)
  }

  const filtered = activePill === 'all' ? stories : stories.filter(s => s.entity_type === activePill)

  if (loading) {
    return (
      <Container size="xl" className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  return (
    <Container size="xl" className="py-6">
      <Stack gap="lg">
        {/* Stories Grid */}
        {filtered.length === 0 ? (
          <Card className="p-8 md:p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-neutral-500" />
            </div>
            <Text className="text-neutral-400 mb-6">
              {activePill === 'all'
                ? 'No stories yet. Create your first immersive narrative.'
                : `No ${PILL_LABELS[activePill] || ''} stories yet.`}
            </Text>
            <Button asChild variant="primary">
              <Link href="/story/new">
                <Plus className="w-4 h-4 mr-2" />
                Create Story
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(story => {
              const meta = ENTITY_TYPE_META[story.entity_type] || ENTITY_TYPE_META.custom
              const IconComponent = meta.icon
              const hasAiAudio = !!story.audio_set_id
              const hasRecording = !!story.user_audio_url
              const wordCount = story.word_count || 0
              const readTime = Math.max(1, Math.ceil(wordCount / 200))
              const isDeleting = deletingId === story.id

              return (
                <Link key={story.id} href={`/story/${story.id}`} className="block group">
                  <Card
                    variant="outlined"
                    className="p-4 md:p-5 hover:border-neutral-600 transition-all duration-200 hover:-translate-y-0.5 relative"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                            <IconComponent className="w-3.5 h-3.5" />
                          </div>
                          <Text size="xs" className={meta.color.split(' ')[0]}>
                            {meta.label}
                          </Text>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          {story.source === 'ai_generated' && <Sparkles className="w-3 h-3 text-purple-400" />}
                          {story.source === 'ai_assisted' && <Sparkles className="w-3 h-3 text-teal-400" />}
                          {story.source === 'user_written' && <FileText className="w-3 h-3 text-neutral-400" />}
                          <Text className="text-white font-medium truncate">
                            {story.title || 'Untitled Story'}
                          </Text>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={story.status === 'completed' ? 'success' : story.status === 'generating' ? 'warning' : 'secondary'}>
                            {story.status === 'completed' ? 'Complete' : story.status === 'generating' ? 'Generating' : 'Draft'}
                          </Badge>
                          {wordCount > 0 && (
                            <Text size="xs" className="text-neutral-500">
                              {wordCount.toLocaleString()} words
                            </Text>
                          )}
                        </div>
                      </div>

                      <div className="relative">
                        <button
                          onClick={e => {
                            e.preventDefault()
                            e.stopPropagation()
                            setMenuOpenId(menuOpenId === story.id ? null : story.id)
                          }}
                          className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {menuOpenId === story.id && (
                          <div className="absolute right-0 top-full mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-10 py-1 min-w-[120px]">
                            <button
                              onClick={e => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleDelete(story.id)
                              }}
                              disabled={isDeleting}
                              className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-neutral-700 flex items-center gap-2 disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {story.content && (
                      <Text size="sm" className="text-neutral-400 line-clamp-2 mb-3">
                        {story.content.slice(0, 150)}...
                      </Text>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
                      <div className="flex items-center gap-3">
                        {hasAiAudio && (
                          <div className="flex items-center gap-1 text-purple-400">
                            <Volume2 className="w-3.5 h-3.5" />
                            <Text size="xs">Audio</Text>
                          </div>
                        )}
                        {hasRecording && (
                          <div className="flex items-center gap-1 text-teal-400">
                            <Mic className="w-3.5 h-3.5" />
                            <Text size="xs">Recording</Text>
                          </div>
                        )}
                        {!hasAiAudio && !hasRecording && (
                          <Text size="xs" className="text-neutral-500">No audio</Text>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-neutral-500">
                        <Clock className="w-3 h-3" />
                        <Text size="xs">{readTime} min read</Text>
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </Stack>
    </Container>
  )
}
