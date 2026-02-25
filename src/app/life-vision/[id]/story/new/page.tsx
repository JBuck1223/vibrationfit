'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Sparkles, 
  Play, 
  RefreshCw, 
  ChevronLeft, 
  X,
  ChevronDown,
  ChevronUp,
  Edit3,
  ArrowRight,
  FileText,
  Mic,
  Wand2
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
  Input,
  Toggle,
  CategoryGrid,
  AutoResizeTextarea,
  VIVALoadingOverlay
} from '@/lib/design-system/components'
import { RecordingTextarea } from '@/components/RecordingTextarea'
import { 
  VISION_CATEGORIES, 
  LIFE_CATEGORY_KEYS,
  type LifeCategoryKey 
} from '@/lib/design-system/vision-categories'

type StoryStatus = 'draft' | 'generating' | 'completed' | 'failed'
type CreateMode = 'viva' | 'manual'

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

const LIFE_CATEGORIES = VISION_CATEGORIES.filter(
  c => LIFE_CATEGORY_KEYS.includes(c.key as LifeCategoryKey)
)

export default function NewStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  const storyRef = useRef<HTMLDivElement>(null)
  
  const [loading, setLoading] = useState(true)
  const [visionId, setVisionId] = useState<string | null>(null)
  const [vision, setVision] = useState<any>(null)
  const [story, setStory] = useState<StoryData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Mode toggle
  const [createMode, setCreateMode] = useState<CreateMode>('viva')

  // VIVA Focus Story state
  const [selectedCategories, setSelectedCategories] = useState<LifeCategoryKey[]>([])
  const [categoryData, setCategoryData] = useState<CategoryFocusData[]>([])
  const [generating, setGenerating] = useState(false)
  const [generatingStory, setGeneratingStory] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [vivaProgress, setVivaProgress] = useState(0)

  // Manual Write state
  const [storyTitle, setStoryTitle] = useState('Custom Story')
  const [storyContent, setStoryContent] = useState('')
  const [enhancing, setEnhancing] = useState(false)

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

        const { data: storyData } = await supabase
          .from('stories')
          .select('*')
          .eq('entity_type', 'life_vision')
          .eq('entity_id', resolvedParams.id)
          .eq('user_id', user.id)
          .maybeSingle()

        if (storyData) {
          setStory(storyData)
          const metadata = storyData.metadata || {}
          if (metadata.selected_categories && Array.isArray(metadata.selected_categories)) {
            setSelectedCategories(metadata.selected_categories)
          } else if (metadata.selected_highlights && Array.isArray(metadata.selected_highlights)) {
            const cats = [...new Set(metadata.selected_highlights.map((h: any) => h.category))] as LifeCategoryKey[]
            setSelectedCategories(cats)
          }
          
          if (storyData.content) {
            setStreamingText(storyData.content)
          }
        }

      } catch (err) {
        console.error('Error loading data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadData()
    return () => { isMounted = false }
  }, [params, router, supabase])

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

  // --- VIVA Focus Story handlers ---

  const handleCategoryToggle = (key: string) => {
    const categoryKey = key as LifeCategoryKey
    setSelectedCategories(prev => 
      prev.includes(categoryKey)
        ? prev.filter(k => k !== categoryKey)
        : [...prev, categoryKey]
    )
  }

  const updateVisionText = (key: LifeCategoryKey, text: string) => {
    setCategoryData(prev => prev.map(c => 
      c.key === key ? { ...c, visionText: text } : c
    ))
  }

  const updateFocusNotes = (key: LifeCategoryKey, notes: string) => {
    setCategoryData(prev => prev.map(c => 
      c.key === key ? { ...c, focusNotes: notes } : c
    ))
  }

  const toggleExpanded = (key: LifeCategoryKey) => {
    setCategoryData(prev => prev.map(c => 
      c.key === key ? { ...c, isExpanded: !c.isExpanded } : c
    ))
  }

  const handleGenerate = async () => {
    if (selectedCategories.length === 0) return
    
    setGenerating(true)
    setGeneratingStory(true)
    setStreamingText('')
    setError(null)
    
    try {
      const contentPayload = categoryData.reduce((acc, cat) => {
        acc[cat.key] = {
          visionText: cat.visionText,
          focusNotes: cat.focusNotes
        }
        return acc
      }, {} as Record<string, { visionText: string; focusNotes: string }>)

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

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: storyData } = await supabase
          .from('stories')
          .select('id')
          .eq('entity_type', 'life_vision')
          .eq('entity_id', visionId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (storyData) {
          setTimeout(() => {
            router.push(`/life-vision/${visionId}/story/${storyData.id}`)
          }, 1500)
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

  // --- Manual Write handlers ---

  const handleEnhanceWithViva = async () => {
    if (!storyContent.trim() || enhancing) return

    setEnhancing(true)
    setError(null)

    try {
      const prompt = `You are enhancing a user's raw notes/thoughts about their life vision into a polished, immersive story.

Their raw input:
"""
${storyContent}
"""

Transform this into an immersive, first-person story that:
- Keeps the essence of what they wrote
- Is written in first person, present tense
- Adds sensory details (what you see, hear, feel)
- Conveys emotions and gratitude
- Flows naturally as a narrative
- Is 300-500 words

Write the enhanced story directly without any preamble, explanation, or quotes.`

      const response = await fetch('/api/viva/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          stream: false
        })
      })

      if (!response.ok) {
        throw new Error('Failed to enhance story')
      }

      const data = await response.json()
      const enhancedContent = data.content || data.message || ''

      if (enhancedContent) {
        setStoryContent(enhancedContent)
      }

    } catch (err) {
      console.error('Error enhancing story:', err)
      setError(err instanceof Error ? err.message : 'Failed to enhance story')
    } finally {
      setEnhancing(false)
    }
  }

  const handleCreateStory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          entity_type: 'life_vision',
          entity_id: visionId,
          title: storyTitle || 'Custom Story',
          content: storyContent || '',
          source: storyContent ? 'ai_assisted' : 'user_written',
          status: 'draft',
          word_count: storyContent.trim().split(/\s+/).filter(Boolean).length
        })
        .select()
        .single()

      if (storyError) throw storyError

      router.push(`/life-vision/${visionId}/story/${storyData.id}`)

    } catch (err) {
      console.error('Error creating story:', err)
      setError(err instanceof Error ? err.message : 'Failed to create story')
    }
  }

  // --- Render ---

  if (loading) {
    return (
      <Container size="xl" className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

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

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHero
          eyebrow="STORY"
          title="Create a Story"
          subtitle="Let VIVA craft a focus story from your vision, or write your own."
        >
          <Button asChild variant="ghost" size="sm">
            <Link href={`/life-vision/${visionId}/story`}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Stories
            </Link>
          </Button>
        </PageHero>

        {/* Mode Toggle */}
        <div className="flex justify-center">
          <Toggle
            value={createMode}
            onChange={setCreateMode}
            options={[
              { value: 'viva', label: 'VIVA Focus Story' },
              { value: 'manual', label: 'Write My Own' }
            ]}
          />
        </div>

        {/* ========== VIVA FOCUS STORY MODE ========== */}
        {createMode === 'viva' && (
          <>
            {/* Category Selection */}
            <Card className="p-4 md:p-6 lg:p-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Heading level={3} className="text-white mb-1">1. Choose Your Focus Areas</Heading>
                  <Text size="sm" className="text-neutral-400">
                    Select the life areas you want featured in your story
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
                layout="12-column"
                mode="selection"
                variant="outlined"
                withCard={false}
              />
            </Card>

            {/* Category Content */}
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

                        {cat.isExpanded && (
                          <div className="p-4 space-y-4 bg-neutral-900/50">
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

            {/* Generate Button */}
            {selectedCategories.length > 0 && (
              <Card className="p-4 md:p-6 lg:p-8 relative overflow-hidden">
                <VIVALoadingOverlay
                  isVisible={generatingStory}
                  messages={[
                    "VIVA is crafting your day-in-the-life story...",
                    "Weaving together your selected life areas...",
                    "Creating an immersive morning-to-evening narrative...",
                    "Adding sensory details and emotional depth...",
                    "Putting the finishing touches on your story..."
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
                  <Heading level={3} className="text-white mb-2">3. Generate Your Story</Heading>
                  <Text className="text-neutral-400 mb-6 max-w-md mx-auto">
                    VIVA will weave your {selectedCategories.length} selected areas into an immersive 
                    day-in-the-life narrative. You can add audio after reviewing your story.
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
                        Writing Story...
                      </>
                    ) : hasGeneratedStory ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2" />
                        Create New Story
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" />
                        Generate Story
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            )}

            {/* Story Display (streaming) */}
            {hasGeneratedStory && (
              <Card className="p-4 md:p-6 lg:p-8" ref={storyRef}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <Heading level={3} className="text-white">Your Story</Heading>
                      <Text size="sm" className="text-neutral-400">
                        {streamingText.split(/\s+/).length} words
                      </Text>
                    </div>
                  </div>
                  {!generatingStory && story && (
                    <Button asChild variant="primary" size="sm">
                      <Link href={`/life-vision/${visionId}/story/${story.id}`}>
                        Edit & Add Audio
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  )}
                </div>

                {!generatingStory && (
                  <div className="mb-4 p-3 bg-primary-500/10 border border-primary-500/30 rounded-lg flex items-center gap-3">
                    <Spinner size="sm" />
                    <Text size="sm" className="text-primary-400">
                      Redirecting to your story where you can edit and add audio...
                    </Text>
                  </div>
                )}

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
          </>
        )}

        {/* ========== WRITE MY OWN MODE ========== */}
        {createMode === 'manual' && (
          <Card className="p-4 md:p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center">
                <Mic className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <Heading level={4} className="text-white">Write or Record Your Own</Heading>
                <Text size="sm" className="text-neutral-400">Type, dictate, or let VIVA enhance your words</Text>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                value={storyTitle}
                onChange={(e) => setStoryTitle(e.target.value)}
                placeholder="Story title"
              />
              
              <RecordingTextarea
                value={storyContent}
                onChange={setStoryContent}
                placeholder="Start writing your story, or click the mic to record and transcribe..."
                rows={6}
                recordingPurpose="quick"
                storageFolder="lifeVision"
                category="story"
              />

              {storyContent && (
                <Text size="xs" className="text-neutral-500">
                  {storyContent.trim().split(/\s+/).filter(Boolean).length} words
                </Text>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                {storyContent.trim().length > 20 && (
                  <Button
                    onClick={handleEnhanceWithViva}
                    variant="secondary"
                    disabled={enhancing || !storyContent.trim()}
                  >
                    {enhancing ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Enhancing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Enhance with VIVA
                      </>
                    )}
                  </Button>
                )}

                <Button
                  onClick={handleCreateStory}
                  variant="primary"
                  disabled={!storyTitle.trim() || !storyContent.trim()}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Create Story
                </Button>
              </div>

              <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                <Text size="xs" className="text-neutral-400">
                  <strong className="text-teal-400">Tip:</strong> Click the mic button to record your thoughts, 
                  then use &quot;Enhance with VIVA&quot; to transform your raw ideas into a polished, immersive story.
                </Text>
              </div>
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
