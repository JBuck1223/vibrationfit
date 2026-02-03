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
  Sparkles
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { 
  Container, 
  Stack, 
  Card, 
  Button, 
  Spinner, 
  PageHero,
  Text,
  Badge,
  Heading
} from '@/lib/design-system/components'
import { useStory, StoryEditor } from '@/lib/stories'
import type { UpdateStoryPayload } from '@/lib/stories'

export default function VisionBoardStoryDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string; storyId: string }> 
}) {
  const router = useRouter()
  const supabase = createClient()
  
  const [itemId, setItemId] = useState<string>('')
  const [storyId, setStoryId] = useState<string>('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    ;(async () => {
      const p = await params
      setItemId(p.id)
      setStoryId(p.storyId)
    })()
  }, [params])

  const { story, loading, error, saving, updateStory, deleteStory } = useStory(storyId)

  const handleSave = useCallback(async (content: string, title?: string) => {
    const payload: UpdateStoryPayload = { content }
    if (title !== undefined) {
      payload.title = title
    }
    await updateStory(payload)
  }, [updateStory])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this story? This cannot be undone.')) {
      return
    }
    
    setDeleting(true)
    const success = await deleteStory()
    if (success) {
      router.push(`/vision-board/${itemId}/stories`)
    }
    setDeleting(false)
  }

  if (loading || !storyId) {
    return (
      <Container size="xl" className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  if (error || !story) {
    return (
      <Container size="xl">
        <Card className="text-center p-4 md:p-6 lg:p-8">
          <Text className="text-red-400 mb-4">{error || 'Story not found'}</Text>
          <Button asChild variant="outline">
            <Link href={`/vision-board/${itemId}/stories`}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Stories
            </Link>
          </Button>
        </Card>
      </Container>
    )
  }

  const hasAiAudio = !!story.audio_set_id
  const hasUserRecording = !!story.user_audio_url
  const wordCount = story.word_count || 0
  const readTime = Math.max(1, Math.ceil(wordCount / 200))

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Hero */}
        <PageHero
          eyebrow="VISION BOARD STORY"
          title={story.title || 'Untitled Story'}
          subtitle="Edit your story content and add audio experiences."
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/vision-board/${itemId}/stories`}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                All Stories
              </Link>
            </Button>
            <div className="flex items-center gap-2">
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
        </PageHero>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

        {/* Audio Actions */}
        <Card className="p-4 md:p-6 lg:p-8">
          <Heading level={3} className="text-white mb-4">Audio Options</Heading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href={`/vision-board/${itemId}/stories/${storyId}/audio`}>
              <Card variant="elevated" hover className="p-4 cursor-pointer h-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                    <Volume2 className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <Text className="text-white font-medium">Audio Studio</Text>
                    <Text size="xs" className="text-neutral-400">Manage all audio</Text>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href={`/vision-board/${itemId}/stories/${storyId}/audio/generate`}>
              <Card variant="elevated" hover className="p-4 cursor-pointer h-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Wand2 className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <Text className="text-white font-medium">Generate Audio</Text>
                    <Text size="xs" className="text-neutral-400">AI voice narration</Text>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href={`/vision-board/${itemId}/stories/${storyId}/audio/record`}>
              <Card variant="elevated" hover className="p-4 cursor-pointer h-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center">
                    <Mic className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <Text className="text-white font-medium">Record Voice</Text>
                    <Text size="xs" className="text-neutral-400">Your own voice</Text>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </Card>

        {/* Story Editor */}
        <Card className="p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <Heading level={3} className="text-white">Story Content</Heading>
            {saving && (
              <Text size="xs" className="text-neutral-400">Saving...</Text>
            )}
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
        <Card className="p-4 md:p-6 lg:p-8 border-red-500/20">
          <Heading level={4} className="text-red-400 mb-4">Danger Zone</Heading>
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-white font-medium">Delete Story</Text>
              <Text size="sm" className="text-neutral-400">
                Permanently delete this story and all associated audio.
              </Text>
            </div>
            <Button 
              variant="danger" 
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </Card>
      </Stack>
    </Container>
  )
}
