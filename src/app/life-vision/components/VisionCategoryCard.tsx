'use client'

import React from 'react'
import Link from 'next/link'
import { Card, Button, Icon, AudioPlayer } from '@/lib/design-system/components'
import { Gem, Edit3, Save, X, LucideIcon } from 'lucide-react'

interface VisionCategoryCardProps {
  category: {
    key: string
    label: string
    description: string
    icon: LucideIcon
  }
  content: string
  isEditing?: boolean
  onSave?: () => void
  onCancel?: () => void
  onUpdate?: (content: string) => void
  saving?: boolean
  onEditCategory?: (categoryKey: string) => void
  vision?: {
    id: string
  }
  audioTrack?: {
    url: string
    title: string
  }
  editable?: boolean
}

export function VisionCategoryCard({
  category,
  content,
  isEditing = false,
  onSave,
  onCancel,
  onUpdate,
  saving = false,
  onEditCategory,
  vision,
  audioTrack,
  editable = true
}: VisionCategoryCardProps) {
  const isCompleted = content?.trim().length > 0
  
  return (
    <Card className="transition-all duration-300 hover:shadow-lg">
      <div className="px-1 py-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCompleted ? 'bg-primary-500' : 'bg-neutral-700'}`}>
            <Icon icon={category.icon} size="sm" color={isCompleted ? '#FFFFFF' : '#14B8A6'} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{category.label}</h3>
            <p className="text-sm text-neutral-400">{category.description}</p>
          </div>
        </div>

        {/* Content Display */}
        {isEditing ? (
          <div className="mb-4">
            <textarea
              value={content || ''}
              onChange={(e) => onUpdate?.(e.target.value)}
              className="w-full min-h-[200px] px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500 resize-y"
              placeholder={`Describe your vision for ${category.label.toLowerCase()}...`}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button
                onClick={onSave}
                disabled={saving}
                variant="primary"
                size="sm"
                className="flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save
                  </>
                )}
              </Button>
              <Button
                onClick={onCancel}
                disabled={saving}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              {content?.trim() ? (
                <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg px-1 py-3 md:p-4">
                  <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap text-sm">
                    {content}
                  </p>
                </div>
              ) : (
                <div className="bg-neutral-800/30 border border-neutral-700 border-dashed rounded-lg px-2 py-4 md:p-8 text-center">
                  <p className="text-neutral-500 mb-3">No content for this section yet</p>
                  {editable && vision && (
                    <Button
                      asChild
                      variant="primary"
                      size="sm"
                      className="flex items-center gap-2 mx-auto"
                    >
                      <Link href={`/life-vision/${vision.id}/refine?category=${category.key}`}>
                        <Gem className="w-4 h-4" />
                        Add Content
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Audio Player */}
            {audioTrack && audioTrack.url && (
              <div className="mb-4">
                <AudioPlayer
                  track={{
                    id: category.key,
                    title: audioTrack.title || category.label,
                    artist: '',
                    duration: 180,
                    url: audioTrack.url,
                    thumbnail: ''
                  }}
                  showInfo={false}
                />
              </div>
            )}

            {/* Action Buttons */}
            {content?.trim() && editable && (
              <div className="flex justify-end gap-2">
                {vision && (
                  <Button
                    asChild
                    variant="primary"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Link href={`/life-vision/${vision.id}/refine?category=${category.key}`}>
                      <Gem className="w-4 h-4" />
                      Refine
                    </Link>
                  </Button>
                )}
                {onEditCategory && (
                  <Button
                    onClick={() => onEditCategory(category.key)}
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  )
}
