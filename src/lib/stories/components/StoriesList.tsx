'use client'

import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'
import { Button, Card, Text, Spinner } from '@/lib/design-system/components'
import { StoryCard } from './StoryCard'
import { useStories } from '../hooks'
import type { Story, StoryEntityType } from '../types'

interface StoriesListProps {
  entityType: StoryEntityType
  entityId: string
  createUrl: string
  storyUrlPrefix: string
  onStorySelect?: (story: Story) => void
  showCreateButton?: boolean
  showDeleteButton?: boolean
  emptyStateMessage?: string
}

export function StoriesList({
  entityType,
  entityId,
  createUrl,
  storyUrlPrefix,
  onStorySelect,
  showCreateButton = true,
  showDeleteButton = true,
  emptyStateMessage = "No stories yet. Create your first one!"
}: StoriesListProps) {
  const { stories, loading, error, deleteStory } = useStories(entityType, entityId)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <Text className="text-red-400">{error}</Text>
      </Card>
    )
  }

  if (stories.length === 0) {
    return (
      <Card className="p-8 md:p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-neutral-500" />
        </div>
        <Text className="text-neutral-400 mb-6">{emptyStateMessage}</Text>
        {showCreateButton && (
          <Button asChild variant="primary">
            <Link href={createUrl}>
              <Plus className="w-4 h-4 mr-2" />
              Create Story
            </Link>
          </Button>
        )}
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with create button */}
      {showCreateButton && (
        <div className="flex items-center justify-between">
          <Text className="text-neutral-400">
            {stories.length} {stories.length === 1 ? 'story' : 'stories'}
          </Text>
          <Button asChild variant="ghost" size="sm">
            <Link href={createUrl}>
              <Plus className="w-4 h-4 mr-1" />
              New Story
            </Link>
          </Button>
        </div>
      )}

      {/* Stories grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stories.map((story) => (
          <StoryCard
            key={story.id}
            story={story}
            href={`${storyUrlPrefix}/${story.id}`}
            onDelete={showDeleteButton ? deleteStory : undefined}
            showDeleteButton={showDeleteButton}
          />
        ))}
      </div>
    </div>
  )
}
