'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Image as ImageIcon, Video, Send, X, Trophy, Heart, Sparkles, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react'
import { VibeTag, VIBE_TAG_CONFIG, VibePost, VIBE_TAGS } from '@/lib/vibe-tribe/types'
import { UploadProgress } from '@/components/UploadProgress'
import { uploadMultipleUserFiles, getUploadErrorMessage } from '@/lib/storage/s3-storage-presigned'
import { CategoryCard, Spinner } from '@/lib/design-system'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { DEFAULT_PROFILE_IMAGE_URL } from '@/app/profile/components/ProfilePictureUpload'
import { useMentionAutocomplete } from '@/hooks/useMentionAutocomplete'
import { MentionDropdown } from './MentionDropdown'
import { EmojiPickerButton } from './EmojiPickerButton'

const ICON_MAP: Record<VibeTag, any> = {
  win: Trophy,
  wobble: Heart,
  vision: Sparkles,
  collaboration: Lightbulb,
}

interface UserProfile {
  id: string
  full_name: string | null
  profile_picture_url: string | null
}

interface StickyPostComposerProps {
  userId: string
  userProfile?: UserProfile | null
  onPostCreated?: (post: VibePost) => void
}

export function StickyPostComposer({ userId, userProfile, onPostCreated }: StickyPostComposerProps) {
  const [content, setContent] = useState('')
  const [selectedTag, setSelectedTag] = useState<VibeTag | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showCategories, setShowCategories] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [focusOpen, setFocusOpen] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({
    progress: 0,
    status: '',
    fileName: '',
    fileSize: 0,
    isVisible: false,
  })
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const {
    mentionResults,
    mentionActiveIndex,
    isMentionOpen,
    mentionHandleChange,
    mentionHandleKeyDown,
    mentionSelectMember,
  } = useMentionAutocomplete({ value: content, onChange: setContent, textareaRef })

  const hasContent = content.trim() || files.length > 0
  const canSubmit = selectedTag && hasContent
  const firstName = userProfile?.full_name?.split(' ')[0] || 'Tribe'

  const autoResize = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      const minH = 120
      const maxH = 300
      const newHeight = Math.min(Math.max(scrollHeight, minH), maxH)
      textareaRef.current.style.height = `${newHeight}px`
      textareaRef.current.style.overflowY = scrollHeight > maxH ? 'auto' : 'hidden'
    }
  }, [])

  useEffect(() => {
    requestAnimationFrame(autoResize)
  }, [content, autoResize])

  useEffect(() => {
    if (focusOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [focusOpen])

  const [viewportHeight, setViewportHeight] = useState(0)

  useEffect(() => {
    if (focusOpen) {
      document.body.style.overflow = 'hidden'
      const updateHeight = () => {
        const vh = window.visualViewport?.height ?? window.innerHeight
        setViewportHeight(vh)
      }
      updateHeight()
      window.visualViewport?.addEventListener('resize', updateHeight)
      window.addEventListener('resize', updateHeight)
      return () => {
        document.body.style.overflow = ''
        window.visualViewport?.removeEventListener('resize', updateHeight)
        window.removeEventListener('resize', updateHeight)
      }
    } else {
      document.body.style.overflow = ''
      setViewportHeight(0)
    }
  }, [focusOpen])

  const handleCategoryToggle = (categoryKey: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryKey)
        ? prev.filter(c => c !== categoryKey)
        : [...prev, categoryKey]
    )
  }

  const MAX_FILE_SIZE_MB = 500
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const incoming = Array.from(e.target.files)

      const oversized = incoming.filter(f => f.size > MAX_FILE_SIZE_BYTES)
      if (oversized.length > 0) {
        const names = oversized.map(f => f.name).join(', ')
        alert(`These files exceed ${MAX_FILE_SIZE_MB}MB and can't be uploaded: ${names}`)
      }

      const valid = incoming.filter(f => f.size <= MAX_FILE_SIZE_BYTES)
      const newFiles = valid.slice(0, 4 - files.length)
      setFiles(prev => [...prev, ...newFiles].slice(0, 4))
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return

    setSubmitting(true)

    try {
      let mediaUrls: string[] = []

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
        
        setContent('')
        setFiles([])
        setSelectedCategories([])
        setShowCategories(false)
        setSelectedTag(null)
        setFocusOpen(false)
        
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

  const handleClose = () => {
    if (submitting) return
    setFocusOpen(false)
  }

  const lifeCategories = VISION_CATEGORIES.filter(
    cat => cat.key !== 'forward' && cat.key !== 'conclusion'
  )

  return (
    <>
      {/* Upload Progress Overlay */}
      {uploadProgress.isVisible && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
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

      {/* Collapsed Bar — Facebook-style prompt */}
      <div className="border-b border-neutral-800 bg-black">
        <div className="max-w-[772px] mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Profile Picture — links to own snapshot */}
            <Link 
              href={`/snapshot/${userId}`}
              className="w-10 h-10 rounded-full bg-neutral-700 overflow-hidden flex-shrink-0 ring-2 ring-neutral-600 hover:ring-[#39FF14]/50 transition-all"
            >
              <img
                src={userProfile?.profile_picture_url || DEFAULT_PROFILE_IMAGE_URL}
                alt={userProfile?.full_name || 'User'}
                className="w-full h-full object-cover"
              />
            </Link>

            {/* Clickable placeholder */}
            <button
              onClick={() => setFocusOpen(true)}
              className="flex-1 h-10 bg-neutral-900 border border-neutral-700 rounded-full px-4 text-left text-sm text-neutral-500 hover:bg-neutral-800 hover:border-neutral-600 transition-colors"
            >
              What&apos;s on your mind, {firstName}?
            </button>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setFocusOpen(true)
                  setTimeout(() => fileInputRef.current?.click(), 200)
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setFocusOpen(true)
                  setTimeout(() => fileInputRef.current?.click(), 200)
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <Video className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Focus Modal */}
      {focusOpen && (
        <div 
          className="fixed inset-x-0 top-0 z-50 flex items-start justify-center px-4 md:pt-[6vh]"
          style={{ height: viewportHeight ? `${viewportHeight}px` : '100dvh' }}
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80"
            onClick={handleClose}
          />

          {/* Modal — flexes vertically so the scrollable middle fills available space */}
          <div 
            ref={modalRef}
            className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col"
            style={{ maxHeight: viewportHeight ? `${viewportHeight}px` : '100dvh' }}
          >
            {/* Header — pinned */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-neutral-800">
              <h2 className="text-base font-semibold text-white">Create Post</h2>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {/* User info */}
              <div className="flex items-center gap-3 px-5 pt-4 pb-2">
                <div className="w-10 h-10 rounded-full bg-neutral-700 overflow-hidden flex-shrink-0">
                  <img
                    src={userProfile?.profile_picture_url || DEFAULT_PROFILE_IMAGE_URL}
                    alt={userProfile?.full_name || 'User'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-tight">{userProfile?.full_name || 'Tribe Member'}</p>
                </div>
              </div>

              {/* Textarea */}
              <div className="px-5 pb-3 relative">
                <MentionDropdown
                  results={mentionResults}
                  activeIndex={mentionActiveIndex}
                  onSelect={mentionSelectMember}
                  isOpen={isMentionOpen}
                />
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={mentionHandleChange}
                  onKeyDown={mentionHandleKeyDown}
                  placeholder={`What's on your mind, ${firstName}?`}
                  className="w-full bg-transparent text-white text-base placeholder-neutral-500 focus:outline-none resize-none"
                  style={{ minHeight: '100px' }}
                />
              </div>

              {/* File Previews */}
              {files.length > 0 && (
                <div className="flex gap-2 px-5 pb-3 overflow-x-auto">
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

              {/* Vibe Tag Selector */}
              <div className="px-5 pb-3 space-y-1.5">
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
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200"
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

              {/* Life Categories (Optional) */}
              <div className="px-5 pb-3">
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
                  <div className="mt-2 grid grid-cols-3 sm:grid-cols-6 gap-1.5">
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
                          allowLabelWrap={category.key === 'spirituality'}
                          className={`!p-2 ${isSelected ? '!bg-[rgba(57,255,20,0.2)] !border-[rgba(57,255,20,0.5)]' : '!bg-transparent !border-[#333]'}`}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Action Bar — pinned */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-t border-neutral-800">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={files.length >= 4}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={files.length >= 4}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                  <Video className="w-5 h-5" />
                </button>
                <EmojiPickerButton
                  textareaRef={textareaRef}
                  onInsert={(val) => setContent(val)}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-neutral-800 transition-colors"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  canSubmit && !submitting
                    ? 'bg-[#39FF14] text-black hover:bg-[#39FF14]/90'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                }`}
              >
                {submitting ? (
                  <Spinner size="sm" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Post
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
