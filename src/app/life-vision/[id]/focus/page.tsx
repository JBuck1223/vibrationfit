'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Sparkles, 
  Play, 
  RefreshCw, 
  ChevronLeft, 
  Check,
  X,
  Volume2,
  ChevronDown,
  ChevronUp,
  Edit3
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { 
  Button, 
  Card, 
  Spinner,
  Container,
  Stack,
  Badge,
  PageHero,
  Text,
  Heading,
  AudioPlayer,
  CategoryGrid,
  AutoResizeTextarea,
  VIVALoadingOverlay
} from '@/lib/design-system/components'
import { 
  VISION_CATEGORIES, 
  LIFE_CATEGORY_KEYS,
  type LifeCategoryKey 
} from '@/lib/design-system/vision-categories'

type StoryStatus = 'draft' | 'generating' | 'completed' | 'failed'

interface CategoryFocusData {
  key: LifeCategoryKey
  visionText: string
  focusNotes: string
  isExpanded: boolean
}

interface StoryData {
  id: string
  user_id: string
  entity_type: string
  entity_id: string
  content: string | null
  word_count: number | null
  audio_set_id: string | null
  status: StoryStatus
  error_message: string | null
  generation_count: number
  metadata: {
    selected_categories?: LifeCategoryKey[]
    category_data?: Record<string, { visionText: string; focusNotes: string }>
    selected_highlights?: any[]
  }
}

interface AudioTrack {
  id: string
  audio_url: string
  duration_seconds: number | null
}

// Get life categories only (no forward/conclusion)
const LIFE_CATEGORIES = VISION_CATEGORIES.filter(
  c => LIFE_CATEGORY_KEYS.includes(c.key as LifeCategoryKey)
)

export default function FocusPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  const storyRef = useRef<HTMLDivElement>(null)
  
  const [loading, setLoading] = useState(true)
  const [visionId, setVisionId] = useState<string | null>(null)
  const [vision, setVision] = useState<any>(null)
  const [story, setStory] = useState<StoryData | null>(null)
  
  // Category selection and data
  const [selectedCategories, setSelectedCategories] = useState<LifeCategoryKey[]>([])
  const [categoryData, setCategoryData] = useState<CategoryFocusData[]>([])
  
  // Generation state
  const [generating, setGenerating] = useState(false)
  const [generatingStory, setGeneratingStory] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [audioTrack, setAudioTrack] = useState<AudioTrack | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [vivaProgress, setVivaProgress] = useState(0)

  // Load initial data
  useEffect(() => {
    let isMounted = true
    
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        const resolvedParams = await params
        if (!isMounted) return
        
        setVisionId(resolvedParams.id)
        
        // Load vision
        const { data: visionData, error: visionError } = await supabase
          .from('vision_versions')
          .select('*')
          .eq('id', resolvedParams.id)
          .eq('user_id', user.id)
          .single()

        if (visionError || !visionData) {
          setError('Vision not found')
          setLoading(false)
          return
        }
        
        setVision(visionData)

        // Check for existing story
        const { data: storyData } = await supabase
          .from('stories')
          .select('*')
          .eq('entity_type', 'life_vision')
          .eq('entity_id', resolvedParams.id)
          .eq('user_id', user.id)
          .maybeSingle()

        if (storyData) {
          setStory(storyData)
          // Restore selected categories from metadata
          const metadata = storyData.metadata || {}
          if (metadata.selected_categories && Array.isArray(metadata.selected_categories)) {
            setSelectedCategories(metadata.selected_categories)
          } else if (metadata.selected_highlights && Array.isArray(metadata.selected_highlights)) {
            // Backward compatibility: extract categories from old highlights format
            const cats = [...new Set(metadata.selected_highlights.map((h: any) => h.category))] as LifeCategoryKey[]
            setSelectedCategories(cats)
          }
          
          // Load audio if completed
          if (storyData.audio_set_id && storyData.status === 'completed') {
            const { data: tracks } = await supabase
              .from('audio_tracks')
              .select('id, audio_url, duration_seconds')
              .eq('audio_set_id', storyData.audio_set_id)
              .eq('section_key', 'focus_story')
              .eq('status', 'completed')
              .maybeSingle()
            
            if (tracks) {
              setAudioTrack(tracks)
            }
            
            // Set the story content if available
            if (storyData.content) {
              setStreamingText(storyData.content)
            }
          }
        }

      } catch (err) {
        console.error('Error loading focus data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadData()
    
    return () => {
      isMounted = false
    }
  }, [params, router, supabase])

  // Update category data when selection or vision changes
  useEffect(() => {
    if (!vision) return
    
    setCategoryData(selectedCategories.map(key => {
      const existing = categoryData.find(c => c.key === key)
      return {
        key,
        visionText: existing?.visionText ?? (vision[key] || ''),
        focusNotes: existing?.focusNotes ?? '',
        isExpanded: existing?.isExpanded ?? true
      }
    }))
  }, [selectedCategories, vision])

  // Progress animation during generation
  useEffect(() => {
    if (generatingStory) {
      const interval = setInterval(() => {
        setVivaProgress(prev => Math.min(prev + 0.5, 95))
      }, 500)
      return () => clearInterval(interval)
    } else {
      setVivaProgress(0)
    }
  }, [generatingStory])

  // Handle category toggle
  const handleCategoryToggle = (key: string) => {
    const categoryKey = key as LifeCategoryKey
    setSelectedCategories(prev => 
      prev.includes(categoryKey)
        ? prev.filter(k => k !== categoryKey)
        : [...prev, categoryKey]
    )
  }

  // Update category vision text
  const updateVisionText = (key: LifeCategoryKey, text: string) => {
    setCategoryData(prev => prev.map(c => 
      c.key === key ? { ...c, visionText: text } : c
    ))
  }

  // Update category focus notes
  const updateFocusNotes = (key: LifeCategoryKey, notes: string) => {
    setCategoryData(prev => prev.map(c => 
      c.key === key ? { ...c, focusNotes: notes } : c
    ))
  }

  // Toggle category expansion
  const toggleExpanded = (key: LifeCategoryKey) => {
    setCategoryData(prev => prev.map(c => 
      c.key === key ? { ...c, isExpanded: !c.isExpanded } : c
    ))
  }

  // Generate story and audio
  const handleGenerate = async () => {
    if (selectedCategories.length === 0) return
    
    setGenerating(true)
    setGeneratingStory(true)
    setStreamingText('')
    setError(null)
    
    try {
      // Build the content payload
      const contentPayload = categoryData.reduce((acc, cat) => {
        acc[cat.key] = {
          visionText: cat.visionText,
          focusNotes: cat.focusNotes
        }
        return acc
      }, {} as Record<string, { visionText: string; focusNotes: string }>)

      // Call the generate API with streaming
      const response = await fetch('/api/viva/focus/generate-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          visionId,
          selectedCategories,
          categoryData: contentPayload
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate focus story')
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value, { stream: true })
          fullText += chunk
          setStreamingText(fullText)
        }
      }

      setGeneratingStory(false)
      setVivaProgress(100)

      // Scroll to story
      setTimeout(() => {
        storyRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)

      // Now generate audio
      const audioResponse = await fetch('/api/viva/focus/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          visionId,
          storyContent: fullText
        })
      })

      if (audioResponse.ok) {
        const audioData = await audioResponse.json()
        if (audioData.audioUrl) {
          setAudioTrack({
            id: audioData.audioSetId,
            audio_url: audioData.audioUrl,
            duration_seconds: audioData.duration
          })
        }
      }

    } catch (err) {
      console.error('Error generating focus:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate focus story')
    } finally {
      setGenerating(false)
      setGeneratingStory(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <Container size="xl" className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  // Error state (fatal)
  if (error && !vision) {
    return (
      <Container size="xl">
        <Card className="text-center p-4 md:p-6 lg:p-8">
          <div className="text-red-400 mb-4">
            <X className="w-16 h-16 mx-auto" />
          </div>
          <Heading level={2} className="text-white mb-4">Error</Heading>
          <Text className="text-neutral-400 mb-6">{error}</Text>
          <Button asChild variant="outline">
            <Link href={`/life-vision/${visionId}`}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Vision
            </Link>
          </Button>
        </Card>
      </Container>
    )
  }

  const hasGeneratedStory = streamingText.length > 0
  const isCompleted = hasGeneratedStory && audioTrack

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Header */}
        <PageHero
          eyebrow="FOCUS STORY"
          title="Your Day in the Life"
          subtitle="Select the life areas you're most excited about, then let VIVA weave them into an immersive 5-7 minute audio journey through your ideal day."
        >
          <Button asChild variant="ghost" size="sm">
            <Link href={`/life-vision/${visionId}`}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Vision
            </Link>
          </Button>
        </PageHero>

        {/* Step 1: Category Selection */}
        <Card className="p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Heading level={3} className="text-white mb-1">1. Choose Your Focus Areas</Heading>
              <Text size="sm" className="text-neutral-400">
                Select the life areas you want featured in your Focus story
              </Text>
            </div>
            <Badge variant="info">
              {selectedCategories.length} selected
            </Badge>
          </div>
          
          <CategoryGrid
            categories={LIFE_CATEGORIES}
            selectedCategories={selectedCategories}
            onCategoryClick={handleCategoryToggle}
            layout="14-column"
            mode="selection"
            variant="outlined"
            withCard={false}
          />
        </Card>

        {/* Step 2: Category Content (only show if categories selected) */}
        {selectedCategories.length > 0 && (
          <Card className="p-4 md:p-6 lg:p-8">
            <div className="mb-6">
              <Heading level={3} className="text-white mb-1">2. Review & Add Focus Notes</Heading>
              <Text size="sm" className="text-neutral-400">
                Your vision text is pre-filled. Add optional notes to highlight specific details you want emphasized.
              </Text>
            </div>

            <Stack gap="md">
              {categoryData.map(cat => {
                const category = LIFE_CATEGORIES.find(c => c.key === cat.key)
                if (!category) return null
                const Icon = category.icon

                return (
                  <div 
                    key={cat.key}
                    className="border border-neutral-700 rounded-xl overflow-hidden"
                  >
                    {/* Category Header */}
                    <button
                      onClick={() => toggleExpanded(cat.key)}
                      className="w-full flex items-center justify-between p-4 bg-neutral-800/50 hover:bg-neutral-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-neutral-700 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <Text className="text-white font-medium">{category.label}</Text>
                          {cat.focusNotes && (
                            <Text size="xs" className="text-purple-400">Has focus notes</Text>
                          )}
                        </div>
                      </div>
                      {cat.isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-neutral-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-neutral-400" />
                      )}
                    </button>

                    {/* Category Content */}
                    {cat.isExpanded && (
                      <div className="p-4 space-y-4 bg-neutral-900/50">
                        {/* Vision Text */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Text size="sm" className="text-neutral-400 font-medium">Vision Text</Text>
                            <Edit3 className="w-3 h-3 text-neutral-500" />
                          </div>
                          <AutoResizeTextarea
                            value={cat.visionText}
                            onChange={(value) => updateVisionText(cat.key, value)}
                            className="w-full min-h-[100px] text-sm"
                            placeholder={`Your ${category.label.toLowerCase()} vision...`}
                          />
                        </div>

                        {/* Focus Notes */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Text size="sm" className="text-purple-400 font-medium">Key Details to Focus On</Text>
                            <Text size="xs" className="text-neutral-500">(optional)</Text>
                          </div>
                          <AutoResizeTextarea
                            value={cat.focusNotes}
                            onChange={(value) => updateFocusNotes(cat.key, value)}
                            className="w-full min-h-[60px] text-sm border-purple-500/30 focus:border-purple-500"
                            placeholder="Any specific moments, feelings, or details you want highlighted..."
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </Stack>
          </Card>
        )}

        {/* Step 3: Generate Button */}
        {selectedCategories.length > 0 && (
          <Card className="p-4 md:p-6 lg:p-8 relative overflow-hidden">
            {/* VIVA Loading Overlay */}
            <VIVALoadingOverlay
              isVisible={generatingStory}
              messages={[
                "VIVA is crafting your day-in-the-life story...",
                "Weaving together your selected life areas...",
                "Creating an immersive morning-to-evening narrative...",
                "Adding sensory details and emotional depth...",
                "Putting the finishing touches on your Focus story..."
              ]}
              cycleDuration={8000}
              estimatedTime="This usually takes 30-60 seconds"
              estimatedDuration={45000}
              progress={vivaProgress}
            />

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <Heading level={3} className="text-white mb-2">3. Generate Your Focus Story</Heading>
              <Text className="text-neutral-400 mb-6 max-w-md mx-auto">
                VIVA will weave your {selectedCategories.length} selected areas into an immersive 
                day-in-the-life narrative with audio.
              </Text>
              <Button
                onClick={handleGenerate}
                variant="primary"
                size="lg"
                disabled={generating || selectedCategories.length === 0}
              >
                {generating ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    {generatingStory ? 'Writing Story...' : 'Creating Audio...'}
                  </>
                ) : hasGeneratedStory ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Regenerate Story
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Generate Focus Story
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Step 4: Story Display (streaming or completed) */}
        {hasGeneratedStory && (
          <Card className="p-4 md:p-6 lg:p-8" ref={storyRef}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Volume2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <Heading level={3} className="text-white">Your Focus Story</Heading>
                <Text size="sm" className="text-neutral-400">
                  {streamingText.split(/\s+/).length} words
                  {audioTrack?.duration_seconds && ` • ${Math.round(audioTrack.duration_seconds / 60)} min`}
                </Text>
              </div>
            </div>

            {/* Audio Player */}
            {audioTrack && (
              <div className="mb-6">
                <AudioPlayer
                  src={audioTrack.audio_url}
                  title="Focus Story"
                  autoPlay={false}
                />
              </div>
            )}

            {/* Story Text */}
            <div className="p-4 md:p-6 bg-neutral-900/50 rounded-xl border border-neutral-800">
              <Text className="text-neutral-200 whitespace-pre-wrap leading-relaxed">
                {streamingText}
                {generatingStory && (
                  <span className="inline-block w-2 h-5 bg-purple-500 animate-pulse ml-1" />
                )}
              </Text>
            </div>
          </Card>
        )}

        {/* Error display */}
        {error && (
          <Card className="p-4 bg-red-500/10 border-red-500/30">
            <Text size="sm" className="text-red-400">{error}</Text>
          </Card>
        )}
      </Stack>
    </Container>
  )
}
