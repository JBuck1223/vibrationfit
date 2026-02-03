'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Check, Loader2, AlertCircle } from 'lucide-react'
import { Card, Text, Badge, Input, AutoResizeTextarea } from '@/lib/design-system/components'
import type { Story } from '../types'

interface StoryEditorProps {
  story: Story
  onSave: (content: string, title?: string) => Promise<void>
  onTitleChange?: (title: string) => void
  autoSave?: boolean
  autoSaveDelay?: number
  readOnly?: boolean
  showTitle?: boolean
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function StoryEditor({
  story,
  onSave,
  onTitleChange,
  autoSave = true,
  autoSaveDelay = 2000,
  readOnly = false,
  showTitle = true
}: StoryEditorProps) {
  const [title, setTitle] = useState(story.title || '')
  const [content, setContent] = useState(story.content || '')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [hasChanges, setHasChanges] = useState(false)
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedRef = useRef({ title: story.title || '', content: story.content || '' })

  // Calculate word count
  const wordCount = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0

  // Handle save
  const handleSave = useCallback(async () => {
    if (readOnly) return
    if (title === lastSavedRef.current.title && content === lastSavedRef.current.content) {
      return // No changes
    }

    setSaveStatus('saving')
    try {
      await onSave(content, title || undefined)
      lastSavedRef.current = { title, content }
      setSaveStatus('saved')
      setHasChanges(false)
      
      // Reset status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (err) {
      console.error('Error saving story:', err)
      setSaveStatus('error')
    }
  }, [content, title, onSave, readOnly])

  // Auto-save effect
  useEffect(() => {
    if (!autoSave || readOnly) return

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Check if there are changes
    if (title !== lastSavedRef.current.title || content !== lastSavedRef.current.content) {
      setHasChanges(true)
      
      // Set up new save timeout
      saveTimeoutRef.current = setTimeout(() => {
        handleSave()
      }, autoSaveDelay)
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [title, content, autoSave, autoSaveDelay, handleSave, readOnly])

  // Update local state when story prop changes
  useEffect(() => {
    setTitle(story.title || '')
    setContent(story.content || '')
    lastSavedRef.current = { title: story.title || '', content: story.content || '' }
  }, [story.id]) // Only reset when story ID changes

  const handleTitleChange = (value: string) => {
    setTitle(value)
    onTitleChange?.(value)
  }

  const getSaveStatusDisplay = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-1.5 text-neutral-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <Text size="xs">Saving...</Text>
          </div>
        )
      case 'saved':
        return (
          <div className="flex items-center gap-1.5 text-green-400">
            <Check className="w-3.5 h-3.5" />
            <Text size="xs">Saved</Text>
          </div>
        )
      case 'error':
        return (
          <div className="flex items-center gap-1.5 text-red-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <Text size="xs">Error saving</Text>
          </div>
        )
      default:
        if (hasChanges) {
          return (
            <Text size="xs" className="text-neutral-500">Unsaved changes</Text>
          )
        }
        return null
    }
  }

  return (
    <div className="space-y-4">
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Text size="sm" className="text-neutral-400">
            {wordCount.toLocaleString()} words
          </Text>
          {story.status === 'draft' && (
            <Badge variant="secondary">Draft</Badge>
          )}
          {story.status === 'completed' && (
            <Badge variant="success">Complete</Badge>
          )}
        </div>
        {autoSave && getSaveStatusDisplay()}
      </div>

      {/* Title input */}
      {showTitle && (
        <Input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Story title (optional)"
          disabled={readOnly}
          className="text-lg font-medium"
        />
      )}

      {/* Content editor */}
      <AutoResizeTextarea
        value={content}
        onChange={setContent}
        placeholder="Start writing your story..."
        disabled={readOnly}
        className="min-h-[300px] text-base leading-relaxed"
      />

      {/* Manual save hint */}
      {!autoSave && hasChanges && !readOnly && (
        <Text size="xs" className="text-neutral-500">
          Press Cmd/Ctrl + S to save, or changes will be lost
        </Text>
      )}
    </div>
  )
}
