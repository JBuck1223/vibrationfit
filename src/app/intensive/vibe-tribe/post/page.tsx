'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Card,
  Button,
  Spinner,
  Textarea,
  CategoryGrid,
} from '@/lib/design-system/components'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import { useIntensiveStep } from '@/components/intensive-studio/IntensiveStepContext'
import { IntensiveStepCompleteModal } from '@/lib/design-system/components'
import { markIntensiveStep } from '@/lib/intensive/checklist'
import { useIntensiveStepCompleteModal } from '@/lib/intensive/use-step-complete-modal'
import { invalidateIntensiveSnapshot } from '@/lib/intensive/intensive-snapshot'
import { createClient } from '@/lib/supabase/client'
import { VibeTag, VIBE_TAG_CONFIG, VIBE_TAGS } from '@/lib/vibe-tribe/types'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { FileUpload } from '@/components/FileUpload'
import { UploadProgress } from '@/components/UploadProgress'
import { uploadMultipleUserFiles, getUploadErrorMessage } from '@/lib/storage/s3-storage-presigned'
import { 
  ArrowRight,
  Trophy,
  Heart,
  Sparkles,
  Lightbulb,
  Image as ImageIcon,
  Send,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

const ICON_MAP: Record<VibeTag, typeof Trophy> = {
  win: Trophy,
  wobble: Heart,
  vision: Sparkles,
  collaboration: Lightbulb,
}

const TAG_DESCRIPTIONS: Record<VibeTag, string> = {
  win: 'Evidence, synchronicities, "this matched my Life Vision today"',
  wobble: 'Doubt, resistance, contrast you\'re working through',
  vision: 'Updates, insights, new clarity about what you want',
  collaboration: 'Share what\'s working for you and invite others to try it, adapt it, or build on it with you',
}

export default function IntensiveVibePostPage() {
  const router = useRouter()
  const { setCompletedAt } = useIntensiveStep()
  const { isOpen, stepId, completeAndShowModal, closeModal } = useIntensiveStepCompleteModal()
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasPosted, setHasPosted] = useState(false)
  const [completedAt, setLocalCompletedAt] = useState<string | null>(null)

  // Post composer state
  const [content, setContent] = useState('')
  const [selectedTag, setSelectedTag] = useState<VibeTag>('vision')
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

  useEffect(() => {
    if (completedAt) setCompletedAt(completedAt)
    return () => setCompletedAt(null)
  }, [completedAt, setCompletedAt])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return
      setUser(authUser)

      const [checklistResult, postCountResult] = await Promise.all([
        supabase.from('intensive_checklist').select('first_vibe_post, first_vibe_post_at').eq('user_id', authUser.id).in('status', ['pending', 'in_progress']).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('vibe_posts').select('id', { count: 'exact', head: true }).eq('user_id', authUser.id).eq('is_deleted', false),
      ])

      const postCount = postCountResult.count || 0
      if (postCount > 0) {
        setHasPosted(true)
        if (checklistResult.data?.first_vibe_post) {
          setLocalCompletedAt(checklistResult.data.first_vibe_post_at)
        } else {
          await markIntensiveStep('first_vibe_post')
          invalidateIntensiveSnapshot()
          setLocalCompletedAt(new Date().toISOString())
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = selectedTag && (content.trim() || files.length > 0)

  const scrollToStep1 = () => {
    const step1Card = document.getElementById('step-1-card')
    if (step1Card) {
      const scrollableContainer = document.querySelector('main.min-w-0.flex-1.overflow-auto')
      if (scrollableContainer) {
        const containerRect = scrollableContainer.getBoundingClientRect()
        const cardRect = step1Card.getBoundingClientRect()
        const scrollTop = scrollableContainer.scrollTop
        const targetPosition = scrollTop + cardRect.top - containerRect.top - 20
        scrollableContainer.scrollTo({ top: targetPosition, behavior: 'smooth' })
      } else {
        step1Card.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  const handleCategoryToggle = (categoryKey: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryKey)
        ? prev.filter(c => c !== categoryKey)
        : [...prev, categoryKey]
    )
  }

  const handleSubmit = async () => {
    if (!canSubmit || submitting || !user) return

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
          user.id,
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
        setHasPosted(true)
        await completeAndShowModal('first_vibe_post')
        setLocalCompletedAt(new Date().toISOString())
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

  const lifeCategories = VISION_CATEGORIES.filter(
    cat => cat.key !== 'forward' && cat.key !== 'conclusion'
  )

  if (loading) {
    return (
      <Container className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  return (
    <Container size="xl" className="pt-6">
      {/* Upload Progress Overlay */}
      {uploadProgress.isVisible && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 rounded-2xl p-8 w-full max-w-sm">
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

      <div className="space-y-8">

        {/* Hero Video */}
        <div className="mx-auto w-full max-w-3xl">
          <OptimizedVideo
            url="https://media.vibrationfit.com/site-assets/video/membership/vibe-tribe-1080p.mp4"
            thumbnailUrl="https://media.vibrationfit.com/site-assets/video/membership/vibe-tribe-thumb.0000000.jpg"
          />
        </div>

        {/* Use Tags — moved above composer */}
        <div className="space-y-4">
          <Card className="p-8 bg-neutral-900/50 border-neutral-800">
            <h2 className="text-xl font-semibold text-white mb-4">Use Tags to Categorize Your Posts</h2>

            <p className="text-neutral-400 text-sm mb-4">
              When you post, tag it so others can find and support you:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {VIBE_TAGS.map((tag) => {
                const config = VIBE_TAG_CONFIG[tag]
                const Icon = ICON_MAP[tag]
                
                return (
                  <Card 
                    key={tag} 
                    className="p-4 bg-neutral-900/50 border-neutral-800 hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${config.color}20` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: config.color }} />
                      </div>
                      <div>
                        <p className="font-semibold text-white" style={{ color: config.color }}>
                          {config.label}
                        </p>
                        <p className="text-sm text-neutral-400 mt-1">
                          {TAG_DESCRIPTIONS[tag]}
                        </p>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>

            <p className="text-neutral-400 text-sm mt-4">
              Always add the <span className="text-white">Life Categories</span> your post touches (money, love, health, etc.), and add a photo or video when you can. More signal, less noise.
            </p>
          </Card>
        </div>

        {/* Post Your First Share */}
        <div className="space-y-4" id="step-1-card">
          <Card className="p-8 bg-neutral-900/50 border-neutral-800">
            <h2 className="text-xl font-semibold text-white mb-6">Create First Post</h2>

            {/* Tag Selector */}
            <div className="mb-5">
              <p className="text-sm text-neutral-400 mb-3">Select a vibe:</p>
              <div className="flex flex-wrap gap-2">
                {VIBE_TAGS.map((tag) => {
                  const config = VIBE_TAG_CONFIG[tag]
                  const Icon = ICON_MAP[tag]
                  const isSelected = selectedTag === tag
                  
                  return (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border-2 transition-all duration-200"
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

            {/* Life Categories */}
            <div className="mb-5">
              <button
                type="button"
                onClick={() => setShowCategories(!showCategories)}
                className="flex items-start sm:items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors text-left"
              >
                {showCategories ? <ChevronUp className="w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-0" /> : <ChevronDown className="w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-0" />}
                <span className="inline-flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2">
                  <span>Life Categories (pick 1-3 that fit)</span>
                  {selectedCategories.length > 0 && (
                    <span className="bg-[#39FF14]/20 text-[#39FF14] px-2 py-0.5 rounded-full text-xs">
                      {selectedCategories.length} selected
                    </span>
                  )}
                </span>
              </button>
              
              {showCategories && (
                <div className="mt-3">
                  <CategoryGrid
                    categories={lifeCategories}
                    selectedCategories={selectedCategories}
                    onCategoryClick={handleCategoryToggle}
                    lifeVisionCategoryStrip
                    desktopColumnCount={6}
                  />
                </div>
              )}
            </div>

            {/* Content Textarea */}
            <div className="mb-4">
              <p className="text-sm text-neutral-400 mb-3">Write your first share:</p>
              <div className="bg-neutral-800/50 rounded-xl p-4 mb-3 text-sm text-neutral-500 space-y-1">
                <p>- Who you are + where you're tuning in from</p>
                <p>- One desire you're actively creating right now</p>
                <p>- One sentence that captures your Life Vision vibe</p>
                <p>- Why you joined Vibration Fit now (not "someday")</p>
              </div>
              <div className="relative">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share your first post with the Vibe Tribe..."
                  rows={5}
                  className="resize-none pb-12"
                />
                <div className="absolute bottom-5 right-4 flex items-center gap-2">
                  {files.length > 0 && (
                    <span className="text-xs text-neutral-400">
                      {files.length} file{files.length > 1 ? 's' : ''}
                    </span>
                  )}
                  <ImageIcon 
                    className="w-5 h-5 cursor-pointer transition-opacity text-[#39FF14] hover:opacity-70"
                    onClick={() => setShowMediaUpload(!showMediaUpload)}
                  />
                </div>
              </div>
            </div>

            {/* Media Upload */}
            <div className="mb-5">
              <button
                type="button"
                onClick={() => setShowMediaUpload(!showMediaUpload)}
                className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
                Add photo or video (optional)
              </button>
              
              {showMediaUpload && (
                <div className="mt-3">
                  <FileUpload
                    dragDrop
                    accept="image/*,video/*"
                    multiple
                    maxFiles={4}
                    maxSize={500}
                    value={files}
                    onChange={setFiles}
                    onUpload={setFiles}
                    dragDropText="Click to upload or drag and drop"
                    dragDropSubtext="Images or videos (max 4 files, 500MB each)"
                    previewSize="md"
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                loading={submitting}
                size="md"
              >
                <Send className="w-4 h-4 mr-2" />
                Publish First Post
              </Button>
            </div>

            <p className="text-xs text-neutral-500 mt-4 text-center">
              Hit publish even if it feels messy. Clarity comes from movement, not overthinking.
            </p>
          </Card>
        </div>

        {/* How to Use Going Forward */}
        <div className="space-y-4">
          <Card className="p-8 bg-neutral-900/50 border-neutral-800">
            <h2 className="text-xl font-semibold text-white mb-6">How to Use Vibe Tribe Going Forward</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Trophy className="w-5 h-5 text-[#39FF14] flex-shrink-0 mt-[0.15em]" />
                <p className="text-neutral-300 leading-6 mt-0">
                  <span className="text-[#39FF14] font-medium">Post Wins</span> to train your brain to see evidence
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-[#00FFFF] flex-shrink-0 mt-[0.15em]" />
                <p className="text-neutral-300 leading-6 mt-0">
                  <span className="text-[#00FFFF] font-medium">Post Wobbles</span> when you're in contrast and want support
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#BF00FF] flex-shrink-0 mt-[0.15em]" />
                <p className="text-neutral-300 leading-6 mt-0">
                  <span className="text-[#BF00FF] font-medium">Post Vision</span> when your clarity evolves
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-[#FFFF00] flex-shrink-0 mt-[0.15em]" />
                <p className="text-neutral-300 leading-6 mt-0">
                  <span className="text-[#FFFF00] font-medium">Post Collaboration</span> to share what's working and invite others to try it, adapt it, or build on it
                </p>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-neutral-800">
              <p className="text-neutral-400 text-center">
                Every tagged post is a rep for the identity of <span className="text-white font-medium">"I am a conscious creator in action."</span>
              </p>
              {!hasPosted && (
                <p className="text-center mt-2">
                  <button
                    type="button"
                    onClick={scrollToStep1}
                    className="text-[#39FF14] font-medium focus:outline-none focus:ring-2 focus:ring-[#39FF14]/50 focus:ring-offset-2 focus:ring-offset-black rounded"
                  >
                    Make your first one now.
                  </button>
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Scroll to top */}
        {!hasPosted && (
          <div className="text-center pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={scrollToStep1}
            >
              <ArrowRight className="w-4 h-4 mr-2 -rotate-90" />
              Create Post
            </Button>
          </div>
        )}

      </div>

      <IntensiveStepCompleteModal
        isOpen={isOpen}
        onClose={closeModal}
        stepId={stepId || 'first_vibe_post'}
      />
    </Container>
  )
}
