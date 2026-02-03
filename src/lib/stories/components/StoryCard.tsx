'use client'

import Link from 'next/link'
import { 
  FileText, 
  Volume2, 
  Mic, 
  Clock, 
  Trash2,
  MoreVertical,
  Sparkles
} from 'lucide-react'
import { Card, Badge, Text, Button } from '@/lib/design-system/components'
import type { Story } from '../types'
import { useState } from 'react'

interface StoryCardProps {
  story: Story
  href: string
  onDelete?: (storyId: string) => void
  showDeleteButton?: boolean
}

export function StoryCard({ 
  story, 
  href, 
  onDelete,
  showDeleteButton = false 
}: StoryCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const hasAiAudio = !!story.audio_set_id
  const hasUserRecording = !!story.user_audio_url
  const wordCount = story.word_count || 0
  const readTime = Math.max(1, Math.ceil(wordCount / 200)) // ~200 words per minute

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!onDelete) return
    
    setDeleting(true)
    await onDelete(story.id)
    setDeleting(false)
    setShowMenu(false)
  }

  const getStatusBadge = () => {
    switch (story.status) {
      case 'generating':
        return <Badge variant="warning">Generating</Badge>
      case 'completed':
        return <Badge variant="success">Complete</Badge>
      case 'failed':
        return <Badge variant="error">Failed</Badge>
      default:
        return <Badge variant="default">Draft</Badge>
    }
  }

  const getSourceIcon = () => {
    switch (story.source) {
      case 'ai_generated':
        return <Sparkles className="w-3 h-3 text-purple-400" />
      case 'ai_assisted':
        return <Sparkles className="w-3 h-3 text-teal-400" />
      default:
        return <FileText className="w-3 h-3 text-neutral-400" />
    }
  }

  return (
    <Link href={href} className="block group">
      <Card 
        variant="outlined" 
        className="p-4 md:p-5 hover:border-neutral-600 transition-all duration-200 hover:-translate-y-0.5 relative"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {getSourceIcon()}
              <Text className="text-white font-medium truncate">
                {story.title || 'Untitled Story'}
              </Text>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              {wordCount > 0 && (
                <Text size="xs" className="text-neutral-500">
                  {wordCount.toLocaleString()} words
                </Text>
              )}
            </div>
          </div>

          {/* Menu button */}
          {showDeleteButton && onDelete && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowMenu(!showMenu)
                }}
                className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-10 py-1 min-w-[120px]">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-neutral-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content preview */}
        {story.content && (
          <Text size="sm" className="text-neutral-400 line-clamp-2 mb-3">
            {story.content.slice(0, 150)}...
          </Text>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
          <div className="flex items-center gap-3">
            {/* Audio indicators */}
            {hasAiAudio && (
              <div className="flex items-center gap-1 text-purple-400">
                <Volume2 className="w-3.5 h-3.5" />
                <Text size="xs">AI Audio</Text>
              </div>
            )}
            {hasUserRecording && (
              <div className="flex items-center gap-1 text-teal-400">
                <Mic className="w-3.5 h-3.5" />
                <Text size="xs">Recording</Text>
              </div>
            )}
            {!hasAiAudio && !hasUserRecording && (
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
}
