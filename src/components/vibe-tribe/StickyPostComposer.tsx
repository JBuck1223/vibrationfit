'use client'

import { useState, useRef, useEffect } from 'react'
import { Image as ImageIcon, ArrowUp, X, Trophy, Heart, Sparkles, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react'
import { VibeTag, VIBE_TAG_CONFIG, VibePost, VIBE_TAGS } from '@/lib/vibe-tribe/types'
import { FileUpload } from '@/components/FileUpload'
import { UploadProgress } from '@/components/UploadProgress'
import { uploadMultipleUserFiles, getUploadErrorMessage } from '@/lib/storage/s3-storage-presigned'
import { CategoryCard, Spinner } from '@/lib/design-system'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'

// LocalStorage key for sidebar state (must match Sidebar.tsx)
const SIDEBAR_COLLAPSED_KEY = 'vibrationfit-sidebar-collapsed'

const ICON_MAP: Record<VibeTag, any> = {
  win: Trophy,
  wobble: Heart,
  vision: Sparkles,
  collaboration: Lightbulb,
}

interface StickyPostComposerProps {
  userId: string
  onPostCreated?: (post: VibePost) => void
}

export function StickyPostComposer({ userId, onPostCreated }: StickyPostComposerProps) {
  const [content, setContent] = useState('')
  const [selectedTag, setSelectedTag] = useState<VibeTag | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showCategories, setShowCategories] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const [showTagPicker, setShowTagPicker] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({
    progress: 0,
    status: '',
    fileName: '',
    fileSize: 0,
    isVisible: false,
  })
  
  // Input ref removed - using simple input now
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync with sidebar collapsed state from localStorage
  useEffect(() => {
    // Initial read
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    setSidebarCollapsed(saved === 'true')

    // Listen for changes (when sidebar is toggled)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SIDEBAR_COLLAPSED_KEY) {
        setSidebarCollapsed(e.newValue === 'true')
      }
    }

    // Also poll for changes since storage events don't fire in the same tab
    const checkInterval = setInterval(() => {
      const current = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
      setSidebarCollapsed(prev => prev !== current ? current : prev)
    }, 100)

    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(checkInterval)
    }
  }, [])

  const hasContent = content.trim() || files.length > 0
  const canSubmit = selectedTag && hasContent

  const handleCategoryToggle = (categoryKey: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryKey)
        ? prev.filter(c => c !== categoryKey)
        : [...prev, categoryKey]
    )
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).slice(0, 4 - files.length)
      setFiles(prev => [...prev, ...newFiles].slice(0, 4))
      setExpanded(true)
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
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
        setShowMediaPicker(false)
        setSelectedCategories([])
        setShowCategories(false)
        setSelectedTag(null)
        setShowTagPicker(false)
        setExpanded(false)
        
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

  const handleFocus = () => {
    setExpanded(true)
    setShowTagPicker(true)
  }

  // Filter out forward and conclusion from life categories
  const lifeCategories = VISION_CATEGORIES.filter(
    cat => cat.key !== 'forward' && cat.key !== 'conclusion'
  )

  return (
    <>
      {/* Upload Progress Overlay */}
      {uploadProgress.isVisible && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 rounded-2xl p-6 w-full max-w-sm">
            <UploadProgress
              progress={uploadProgress.progress}
              status={uploadProgress.status}
              fileName={uploadProgress.fileName}
              fileSize={uploadProgress.fileSize}
              isVisible={true}
            />
          </div>
        </div>
      )}

      {/* Backdrop when expanded - respects sidebar on desktop */}
      {expanded && (
        <div 
          className={`fixed inset-0 bg-black/50 z-40 transition-all duration-300 ${sidebarCollapsed ? 'md:left-16' : 'md:left-64'}`}
          onClick={() => {
            if (!content && files.length === 0) {
              setExpanded(false)
              setShowTagPicker(false)
              setShowCategories(false)
              setSelectedTag(null)
              setSelectedCategories([])
            }
          }}
        />
      )}

      {/* Sticky Bottom Bar - positioned above mobile nav on mobile, at bottom on desktop (after sidebar) */}
      <div className={`fixed left-0 right-0 bg-black border-t border-neutral-800 z-40 transition-all duration-300 bottom-[72px] md:bottom-0 ${sidebarCollapsed ? 'md:left-16' : 'md:left-64'} ${expanded ? 'pb-2' : ''}`}>
        <div className="max-w-2xl mx-auto">
          {/* Expanded Content */}
          {expanded && (
            <div className="px-4 pt-4 space-y-3">
              {/* Tag Selector */}
              {showTagPicker && (
                <div className="space-y-2">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider">Select a vibe</p>
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
                            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                            border transition-all duration-200
                          `}
                          style={{
                            borderColor: config.color,
                            backgroundColor: isSelected ? config.color : 'transparent',
                            color: isSelected ? '#000' : config.color,
                          }}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {config.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* File Previews */}
              {files.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {files.map((file, index) => (
                    <div key={index} className="relative flex-shrink-0">
                      {file.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-neutral-800 rounded-lg flex items-center justify-center">
                          <span className="text-xs text-neutral-400 text-center px-1">
                            {file.name.slice(0, 10)}...
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Life Categories (Optional) */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowCategories(!showCategories)}
                  className="flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors"
                >
                  {showCategories ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  Add life categories
                  {selectedCategories.length > 0 && (
                    <span className="bg-[#39FF14]/20 text-[#39FF14] px-1.5 py-0.5 rounded-full text-xs">
                      {selectedCategories.length}
                    </span>
                  )}
                </button>
                
                {showCategories && (
                  <div className="mt-2 grid grid-cols-6 gap-1.5">
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
                          className={`!p-2 ${isSelected ? '!bg-[rgba(57,255,20,0.2)] !border-[rgba(57,255,20,0.5)]' : '!bg-transparent !border-[#333]'}`}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Input Row - Horizontally aligned */}
          <div className="flex items-center gap-3 px-4 py-3">
            {/* Image Upload Button - Circle with border */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={files.length >= 4}
              className="flex-shrink-0 w-11 h-11 rounded-full border border-neutral-600 flex items-center justify-center text-white hover:border-neutral-400 transition-colors disabled:opacity-50"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Text Input - Pill shaped */}
            <div className="flex-1">
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onFocus={handleFocus}
                placeholder="Type a Message..."
                className="w-full h-11 bg-neutral-900 border border-neutral-700 rounded-full px-5 text-base md:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
              />
            </div>

            {/* Send Button - Circle */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                hasContent && !submitting
                  ? 'bg-[#39FF14] text-black hover:bg-[#39FF14]/90'
                  : 'bg-[#39FF14]/30 text-[#39FF14]/60'
              }`}
            >
              {submitting ? (
                <Spinner size="sm" />
              ) : (
                <ArrowUp className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
