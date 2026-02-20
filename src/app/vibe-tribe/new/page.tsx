'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Card,
  Button,
  Spinner,
  Textarea,
  CategoryCard,
  PageHero,
} from '@/lib/design-system/components'
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
  Filter,
  MessageCircle,
  CheckCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { VibeTag, VIBE_TAG_CONFIG, VibePost, VIBE_TAGS } from '@/lib/vibe-tribe/types'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { FileUpload } from '@/components/FileUpload'
import { UploadProgress } from '@/components/UploadProgress'
import { uploadMultipleUserFiles, getUploadErrorMessage } from '@/lib/storage/s3-storage-presigned'

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

export default function VibeTribeNewPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [hasPosted, setHasPosted] = useState(false)
  
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
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }
      
      setUser(user)

      // Check if user has already posted
      const { data: posts } = await supabase
        .from('vibe_posts')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .limit(1)
      
      if (posts && posts.length > 0) {
        setHasPosted(true)
        // Already posted, redirect to main feed
        router.push('/vibe-tribe')
        return
      }

      setLoading(false)
    }
    
    checkAuth()
  }, [router])

  const canSubmit = selectedTag && (content.trim() || files.length > 0)

  const scrollToStep1 = () => {
    // Find the Step 1 card element
    const step1Card = document.getElementById('step-1-card')
    if (step1Card) {
      // Find the scrollable parent container (main element from GlobalLayout)
      const scrollableContainer = document.querySelector('main.flex-1.flex.flex-col.overflow-y-auto')
      if (scrollableContainer) {
        // Calculate the position relative to the scrollable container
        const containerRect = scrollableContainer.getBoundingClientRect()
        const cardRect = step1Card.getBoundingClientRect()
        const scrollTop = scrollableContainer.scrollTop
        const targetPosition = scrollTop + cardRect.top - containerRect.top - 20 // 20px offset from top
        scrollableContainer.scrollTo({ top: targetPosition, behavior: 'smooth' })
      } else {
        // Fallback to window scroll
        step1Card.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else {
      // Fallback to top if card not found
      const scrollableContainer = document.querySelector('main.flex-1.flex.flex-col.overflow-y-auto')
      if (scrollableContainer) {
        scrollableContainer.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
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
        // Success! Redirect to main feed
        router.push('/vibe-tribe')
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-full bg-black pb-8">
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

      <Container size="md">
        <div className="space-y-8 py-8">
          
          {/* Hero Section */}
          <PageHero
            title="Welcome to Vibe Tribe"
            subtitle="Start Here"
          />

          {/* Intro Card */}
          <Card className="p-6 md:p-8 bg-neutral-900/50 border-neutral-800">
            <p className="text-neutral-300 leading-relaxed">
              You made it inside. This is the room for people who are done "trying to manifest" and are willing to run the reps.
            </p>
            <p className="text-neutral-300 leading-relaxed mt-4">
              This space has one job: <span className="text-[#39FF14] font-medium">Help you live your Life Vision</span> by staying in Creations, Activations, Connections, and Sessions together.
            </p>
            <p className="text-neutral-400 mt-4 text-sm">
              Use this post as your starting line.
            </p>
          </Card>

          {/* Step 1: Post Your First Share */}
          <div className="space-y-4" id="step-1-card">
            <Card className="p-6 bg-neutral-900/50 border-neutral-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-[#39FF14] flex items-center justify-center text-black font-bold text-sm">
                  1
                </div>
                <h2 className="text-xl font-semibold text-white">Post Your First Share</h2>
              </div>
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
                  className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  {showCategories ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  Life Categories (pick 1-3 that fit)
                  {selectedCategories.length > 0 && (
                    <span className="bg-[#39FF14]/20 text-[#39FF14] px-2 py-0.5 rounded-full text-xs">
                      {selectedCategories.length} selected
                    </span>
                  )}
                </button>
                
                {showCategories && (
                  <div className="mt-3 grid grid-cols-4 md:grid-cols-6 gap-2">
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
                  {/* Image upload icon positioned at bottom right of textarea */}
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

          {/* Step 2: Use Tags Like a Pro */}
          <div className="space-y-4">
            <Card className="p-6 bg-neutral-900/50 border-neutral-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-white font-bold text-sm">
                  2
                </div>
                <h2 className="text-xl font-semibold text-white">Use Tags Like a Pro</h2>
              </div>

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

          {/* Step 3: Connect */}
          <div className="space-y-4">
            <Card className="p-6 bg-neutral-900/50 border-neutral-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-white font-bold text-sm">
                  3
                </div>
                <h2 className="text-xl font-semibold text-white">Connect (2-minute practice)</h2>
              </div>
              <p className="text-neutral-300 mb-4">After your first post:</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Filter className="w-3 h-3 text-neutral-400" />
                  </div>
                  <p className="text-neutral-300">Open the feed and filter by your top Life Category</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Heart className="w-3 h-3 text-neutral-400" />
                  </div>
                  <p className="text-neutral-300">Find 2-3 posts and drop a heart</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MessageCircle className="w-3 h-3 text-neutral-400" />
                  </div>
                  <p className="text-neutral-300">Leave 1 sentence of support, reflection, or celebration</p>
                </div>
              </div>
              <p className="text-neutral-500 text-sm mt-4 italic">
                This is how we turn "content" into a field that actually holds your vision with you.
              </p>
            </Card>
          </div>

          {/* How to Use Going Forward */}
          <div className="space-y-4">
            <Card className="p-6 bg-neutral-900/50 border-neutral-800">
              <h2 className="text-xl font-semibold text-white mb-6">How to Use Vibe Tribe Going Forward</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Trophy className="w-5 h-5 text-[#39FF14] flex-shrink-0 mt-0.5" />
                  <p className="text-neutral-300">
                    <span className="text-[#39FF14] font-medium">Post Wins</span> to train your brain to see evidence
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-[#00FFFF] flex-shrink-0 mt-0.5" />
                  <p className="text-neutral-300">
                    <span className="text-[#00FFFF] font-medium">Post Wobbles</span> when you're in contrast and want support
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-[#BF00FF] flex-shrink-0 mt-0.5" />
                  <p className="text-neutral-300">
                    <span className="text-[#BF00FF] font-medium">Post Vision</span> when your clarity evolves
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-[#FFFF00] flex-shrink-0 mt-0.5" />
                  <p className="text-neutral-300">
                    <span className="text-[#FFFF00] font-medium">Post Collaboration</span> to share what's working and invite others to try it, adapt it, or build on it
                  </p>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-neutral-800">
                <p className="text-neutral-400 text-center">
                  Every tagged post is a rep for the identity of <span className="text-white font-medium">"I am a conscious creator in action."</span>
                </p>
                <p className="text-[#39FF14] text-center font-medium mt-2">
                  Make your first one now.
                </p>
              </div>
            </Card>
          </div>

          {/* Scroll to top reminder */}
          <div className="text-center pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={scrollToStep1}
            >
              <ArrowRight className="w-4 h-4 mr-2 -rotate-90" />
              Back to Step 1
            </Button>
          </div>

        </div>
      </Container>
    </div>
  )
}
