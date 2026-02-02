'use client'

import { useState } from 'react'
import { Card, Button, Textarea, CategoryCard } from '@/lib/design-system'
import { FileUpload } from '@/components/FileUpload'
import { UploadProgress } from '@/components/UploadProgress'
import { uploadMultipleUserFiles, getUploadErrorMessage } from '@/lib/storage/s3-storage-presigned'
import { Image as ImageIcon, Send, ChevronDown, ChevronUp, Trophy, Heart, Sparkles, Lightbulb } from 'lucide-react'
import { VibeTag, VIBE_TAG_CONFIG, VibePost, VIBE_TAGS } from '@/lib/vibe-tribe/types'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'

interface PostComposerProps {
  preselectedTag?: VibeTag
  onPostCreated?: (post: VibePost) => void
  placeholder?: string
  userId: string
}

const ICON_MAP: Record<VibeTag, any> = {
  win: Trophy,
  wobble: Heart,
  vision: Sparkles,
  collaboration: Lightbulb,
}

export function PostComposer({ 
  preselectedTag,
  onPostCreated,
  placeholder = "What's on your mind?",
  userId,
}: PostComposerProps) {
  const [content, setContent] = useState('')
  const [selectedTag, setSelectedTag] = useState<VibeTag | null>(preselectedTag || null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showCategories, setShowCategories] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [showMediaUpload, setShowMediaUpload] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({
    progress: 0,
    status: '',
    fileName: '',
    fileSize: 0,
    isVisible: false,
  })

  const canSubmit = selectedTag && (content.trim() || files.length > 0)

  const handleCategoryToggle = (categoryKey: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryKey)
        ? prev.filter(c => c !== categoryKey)
        : [...prev, categoryKey]
    )
  }

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return

    setSubmitting(true)

    try {
      let mediaUrls: string[] = []

      // Upload files if any
      if (files.length > 0) {
        setUploadProgress({
          progress: 0,
          status: 'Preparing files for upload...',
          fileName: files.length > 1 ? `${files.length} files` : files[0]?.name || '',
          fileSize: files.reduce((total, file) => total + file.size, 0),
          isVisible: true,
        })

        const uploadResults = await uploadMultipleUserFiles(
          'vibeTribe',
          files,
          userId,
          (progress) => {
            setUploadProgress(prev => ({
              ...prev,
              progress: Math.round(progress),
              status: progress < 100 ? 'Uploading files...' : 'Processing files...',
            }))
          }
        )

        const errors = uploadResults.filter((result: any) => result.error)
        if (errors.length > 0) {
          const errorMessages = errors.map((e: any) => 
            getUploadErrorMessage(new Error(e.error || 'Unknown error'))
          )
          alert([...new Set(errorMessages)].join('\n\n'))
          setUploadProgress(prev => ({ ...prev, isVisible: false }))
          setSubmitting(false)
          return
        }

        mediaUrls = uploadResults
          .filter((result: any) => !result.error && result.url)
          .map((result: any) => result.url)
      }

      // Create post
      const response = await fetch('/api/vibe-tribe/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim() || null,
          media_urls: mediaUrls,
          vibe_tag: selectedTag,
          life_categories: selectedCategories,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Reset form
        setContent('')
        setFiles([])
        setShowMediaUpload(false)
        setSelectedCategories([])
        setShowCategories(false)
        if (!preselectedTag) setSelectedTag(null)
        
        onPostCreated?.(data.post)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create post')
      }
    } catch (error) {
      console.error('Error creating post:', error)
      alert('Failed to create post. Please try again.')
    } finally {
      setSubmitting(false)
      setUploadProgress(prev => ({ ...prev, isVisible: false }))
    }
  }

  // Filter out forward and conclusion from life categories
  const lifeCategories = VISION_CATEGORIES.filter(
    cat => cat.key !== 'forward' && cat.key !== 'conclusion'
  )

  return (
    <Card className="p-4 md:p-6">
      {/* Vibe Tag Selector */}
      {!preselectedTag && (
        <div className="mb-4">
          <p className="text-sm text-neutral-400 mb-2">Select a vibe:</p>
          <div className="flex flex-wrap gap-2">
            {VIBE_TAGS.map((tag) => {
              const config = VIBE_TAG_CONFIG[tag]
              const Icon = ICON_MAP[tag]
              const isSelected = selectedTag === tag
              
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                    border-2 transition-all duration-200
                    ${isSelected 
                      ? 'text-black' 
                      : 'hover:opacity-100'
                    }
                  `}
                  style={{
                    borderColor: config.color,
                    backgroundColor: isSelected ? config.color : 'transparent',
                    color: isSelected ? '#000' : config.color,
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {config.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Content Input */}
      <div className="mb-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            selectedTag 
              ? VIBE_TAG_CONFIG[selectedTag].description 
              : placeholder
          }
          rows={3}
          className="resize-none"
        />
      </div>

      {/* Life Categories (Optional) */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowCategories(!showCategories)}
          className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
        >
          {showCategories ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Add life categories (optional)
          {selectedCategories.length > 0 && (
            <span className="bg-[#39FF14]/20 text-[#39FF14] px-2 py-0.5 rounded-full text-xs">
              {selectedCategories.length} selected
            </span>
          )}
        </button>
        
        {showCategories && (
          <div className="mt-3 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
            {lifeCategories.map((category) => {
              const isSelected = selectedCategories.includes(category.key)
              return (
                <CategoryCard 
                  key={category.key} 
                  category={category} 
                  selected={isSelected} 
                  onClick={() => handleCategoryToggle(category.key)}
                  variant="outlined"
                  selectionStyle="border"
                  iconColor={isSelected ? "#39FF14" : "#FFFFFF"}
                  selectedIconColor="#39FF14"
                  className={isSelected ? '!bg-[rgba(57,255,20,0.2)] !border-[rgba(57,255,20,0.5)]' : '!bg-transparent !border-[#333]'}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Media Upload */}
      {showMediaUpload && (
        <div className="mb-4">
          <FileUpload
            dragDrop
            accept="image/*,video/*"
            multiple
            maxFiles={4}
            maxSize={100}
            value={files}
            onChange={setFiles}
            onUpload={setFiles}
            dragDropText="Click to upload or drag and drop"
            dragDropSubtext="Images or videos (max 4 files, 100MB each)"
            previewSize="md"
          />
        </div>
      )}

      {/* Upload Progress */}
      <UploadProgress
        progress={uploadProgress.progress}
        status={uploadProgress.status}
        fileName={uploadProgress.fileName}
        fileSize={uploadProgress.fileSize}
        isVisible={uploadProgress.isVisible}
      />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={showMediaUpload ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setShowMediaUpload(!showMediaUpload)}
          >
            <ImageIcon className="w-4 h-4" />
          </Button>
          {files.length > 0 && (
            <span className="text-xs text-neutral-400">
              {files.length} file{files.length > 1 ? 's' : ''} selected
            </span>
          )}
        </div>
        
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          loading={submitting}
          size="sm"
        >
          <Send className="w-4 h-4 mr-2" />
          Post
        </Button>
      </div>
    </Card>
  )
}
