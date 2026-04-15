'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  Volume2,
  Mic,
  Wand2,
  Trash2,
  Sparkles,
  Image,
  PenLine,
  FileText,
  Info,
  Target,
  Cpu,
  RefreshCw,
  StickyNote,
} from 'lucide-react'
import {
  Container,
  Stack,
  Card,
  Button,
  Spinner,
  Badge,
  Heading,
  Text,
} from '@/lib/design-system/components'
import { useStory, StoryEditor } from '@/lib/stories'
import type { UpdateStoryPayload } from '@/lib/stories'

const ENTITY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  life_vision: { label: 'Life Vision', icon: Sparkles, color: 'text-purple-400' },
  vision_board_item: { label: 'Vision Board', icon: Image, color: 'text-cyan-400' },
  journal_entry: { label: 'Journal', icon: PenLine, color: 'text-teal-400' },
  custom: { label: 'Custom', icon: FileText, color: 'text-yellow-400' },
  goal: { label: 'Goal', icon: FileText, color: 'text-green-400' },
  schedule_block: { label: 'Schedule', icon: FileText, color: 'text-orange-400' },
}

export default function StoryDetailPage({
  params,
}: {
  params: Promise<{ storyId: string }>
}) {
  const router = useRouter()
  const [storyId, setStoryId] = useState<string>('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    ;(async () => {
      const p = await params
      setStoryId(p.storyId)
    })()
  }, [params])

  const { story, loading, error, saving, updateStory, deleteStory } = useStory(storyId)

  const handleSave = useCallback(async (content: string, title?: string) => {
    const payload: UpdateStoryPayload = { content }
    if (title !== undefined) payload.title = title
    await updateStory(payload)
  }, [updateStory])

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
  const hasAiAudio = !!story.audio_set_id
  const hasUserRecording = !!story.user_audio_url
  const wordCount = story.word_count || 0
  const readTime = Math.max(1, Math.ceil(wordCount / 200))

  return (
    <Container size="xl">
      <Stack gap="lg" className="py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Heading level={2} className="text-white">{story.title || 'Untitled Story'}</Heading>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="premium">
              <EntityIcon className="w-3 h-3 mr-1" />
              {meta.label}
            </Badge>
            {story.source === 'ai_generated' && (
              <Badge variant="premium">
                <Sparkles className="w-3 h-3 mr-1" />
                VIVA Generated
              </Badge>
            )}
            <Badge variant={story.status === 'completed' ? 'success' : 'secondary'}>
              {story.status === 'completed' ? 'Complete' : 'Draft'}
            </Badge>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <Text size="xs" className="text-neutral-500 uppercase tracking-wide mb-1">Words</Text>
            <Text className="text-2xl font-bold text-white">{wordCount.toLocaleString()}</Text>
          </Card>
          <Card className="p-4 text-center">
            <Text size="xs" className="text-neutral-500 uppercase tracking-wide mb-1">Read Time</Text>
            <Text className="text-2xl font-bold text-white">{readTime} min</Text>
          </Card>
          <Card className="p-4 text-center">
            <Text size="xs" className="text-neutral-500 uppercase tracking-wide mb-1">AI Audio</Text>
            <Text className="text-2xl font-bold text-white">{hasAiAudio ? 'Yes' : 'No'}</Text>
          </Card>
          <Card className="p-4 text-center">
            <Text size="xs" className="text-neutral-500 uppercase tracking-wide mb-1">Recording</Text>
            <Text className="text-2xl font-bold text-white">{hasUserRecording ? 'Yes' : 'No'}</Text>
          </Card>
        </div>

        {/* Generation Details */}
        {story.metadata && (story.metadata.selected_categories || story.metadata.model_used || story.metadata.focus_notes) && (
          <Card className="p-4 md:p-6 lg:p-8">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-4 h-4 text-neutral-400" />
              <Heading level={3} className="text-white">Generation Details</Heading>
            </div>
            <div className="space-y-4">
              {story.metadata.selected_categories && story.metadata.selected_categories.length > 0 && (
                <div className="flex items-start gap-3">
                  <Target className="w-4 h-4 text-neutral-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <Text size="xs" className="text-neutral-500 uppercase tracking-wide mb-1.5">Focus Areas</Text>
                    <div className="flex flex-wrap gap-1.5">
                      {story.metadata.selected_categories.map((cat: string) => (
                        <Badge key={cat} variant="secondary">
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {story.metadata.model_used && (
                <div className="flex items-start gap-3">
                  <Cpu className="w-4 h-4 text-neutral-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <Text size="xs" className="text-neutral-500 uppercase tracking-wide mb-1">Model</Text>
                    <Text size="sm" className="text-neutral-300">{story.metadata.model_used}</Text>
                  </div>
                </div>
              )}
              {story.generation_count > 1 && (
                <div className="flex items-start gap-3">
                  <RefreshCw className="w-4 h-4 text-neutral-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <Text size="xs" className="text-neutral-500 uppercase tracking-wide mb-1">Regenerations</Text>
                    <Text size="sm" className="text-neutral-300">Generated {story.generation_count} times</Text>
                  </div>
                </div>
              )}
              {story.metadata.focus_notes && (
                <div className="flex items-start gap-3">
                  <StickyNote className="w-4 h-4 text-neutral-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <Text size="xs" className="text-neutral-500 uppercase tracking-wide mb-1">Focus Notes</Text>
                    <Text size="sm" className="text-neutral-300 whitespace-pre-wrap">{String(story.metadata.focus_notes)}</Text>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Audio Actions */}
        <Card variant="glass" className="p-4 md:p-6">
          <div className="flex flex-col items-center text-center mb-4">
            <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center mb-2">
              <Volume2 className="w-5 h-5 text-primary-500" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-white">Audio Options</h3>
            <p className="text-sm text-neutral-400">Listen, generate, or record audio for this story</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link href={`/story/${storyId}/audio`}>
              <Card variant="default" hover className="p-4 cursor-pointer h-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Volume2 className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm md:text-base">Audio Studio</p>
                    <p className="text-xs text-neutral-400">Manage all audio</p>
                  </div>
                </div>
              </Card>
            </Link>
            <Link href={`/story/${storyId}/audio/generate`}>
              <Card variant="default" hover className="p-4 cursor-pointer h-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Wand2 className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm md:text-base">Generate Audio</p>
                    <p className="text-xs text-neutral-400">VIVA voice narration</p>
                  </div>
                </div>
              </Card>
            </Link>
            <Link href={`/story/${storyId}/audio/record`}>
              <Card variant="default" hover className="p-4 cursor-pointer h-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mic className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm md:text-base">Record Voice</p>
                    <p className="text-xs text-neutral-400">Your own voice</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </Card>

        {/* Story Editor */}
        <Card variant="glass" className="p-4 md:p-6">
          <div className="flex flex-col items-center text-center mb-4">
            <div className="w-10 h-10 bg-[#39FF14]/20 rounded-full flex items-center justify-center mb-2">
              <PenLine className="w-5 h-5 text-[#39FF14]" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-white">Story Content</h3>
            {saving && <p className="text-xs text-neutral-400 mt-1">Saving...</p>}
          </div>
          <StoryEditor
            story={story}
            onSave={handleSave}
            autoSave={true}
            autoSaveDelay={2000}
            showTitle={true}
          />
        </Card>

        {/* Danger Zone */}
        <Card variant="glass" className="p-4 md:p-6 border-red-500/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-red-400 font-semibold text-sm md:text-base mb-1">Danger Zone</p>
              <p className="text-sm text-neutral-400">
                Permanently delete this story and all associated audio.
              </p>
            </div>
            <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting} className="flex-shrink-0">
              <Trash2 className="w-4 h-4 mr-2" />
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </Card>
      </Stack>
    </Container>
  )
}
