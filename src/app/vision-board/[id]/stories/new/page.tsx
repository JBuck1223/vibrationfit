'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ChevronLeft,
  Sparkles,
  FileText,
  Mic,
  Wand2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { 
  Container, 
  Stack, 
  Card, 
  Button, 
  Spinner, 
  PageHero,
  Text,
  Heading,
  Input,
  VIVALoadingOverlay
} from '@/lib/design-system/components'
import { RecordingTextarea } from '@/components/RecordingTextarea'

type StoryMode = 'viva' | 'write'

interface VisionBoardItem {
  id: string
  name: string
  description: string | null
  image_url: string | null
  categories: string[] | null
}

export default function NewVisionBoardStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [itemId, setItemId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [item, setItem] = useState<VisionBoardItem | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Mode toggle
  const [mode, setMode] = useState<StoryMode>('viva')
  
  // Form state
  const [storyTitle, setStoryTitle] = useState('')
  const [storyContent, setStoryContent] = useState('')
  const [generating, setGenerating] = useState(false)
  const [enhancing, setEnhancing] = useState(false)
  const [vivaProgress, setVivaProgress] = useState(0)

  useEffect(() => {
    ;(async () => {
      const p = await params
      setItemId(p.id)
    })()
  }, [params])

  // Check URL for initial mode
  useEffect(() => {
    const modeParam = searchParams.get('mode')
    if (modeParam === 'write' || modeParam === 'viva') {
      setMode(modeParam)
    }
  }, [searchParams])

  useEffect(() => {
    if (!itemId) return
    loadItem()
  }, [itemId])

  useEffect(() => {
    if (generating) {
      const interval = setInterval(() => {
        setVivaProgress(prev => Math.min(prev + 0.5, 95))
      }, 500)
      return () => clearInterval(interval)
    } else {
      setVivaProgress(0)
    }
  }, [generating])

  async function loadItem() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data: itemData, error: itemError } = await supabase
      .from('vision_board_items')
      .select('id, name, description, image_url, categories')
      .eq('id', itemId)
      .eq('user_id', user.id)
      .single()

    if (itemError) {
      setError('Vision board item not found')
      setLoading(false)
      return
    }

    setItem(itemData)
    setStoryTitle(itemData.name)
    // Pre-populate content with description for write mode
    if (itemData.description) {
      setStoryContent(itemData.description)
    }
    setLoading(false)
  }

  async function handleGenerateStory() {
    if (!item || generating) return

    setGenerating(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create a story about this vision board item
      const prompt = `Write an immersive, first-person story about living the reality of "${item.name}".
      
${item.description ? `Description: ${item.description}` : ''}

The story should:
- Be written in first person, present tense
- Describe a vivid day or moment where this vision is fully realized
- Include sensory details (what you see, hear, feel, smell, taste)
- Convey the emotions and gratitude of having achieved this
- Be 300-500 words
- Be written as if it's already happening NOW

Write the story directly without any preamble or explanation.`

      // Call VIVA to generate the story
      const response = await fetch('/api/viva/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          stream: false
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate story')
      }

      const data = await response.json()
      const generatedContent = data.content || data.message || ''

      // Create the story in the database
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          entity_type: 'vision_board_item',
          entity_id: itemId,
          title: storyTitle || `Story: ${item.name}`,
          content: generatedContent,
          source: 'ai_generated',
          status: 'draft',
          word_count: generatedContent.trim().split(/\s+/).filter(Boolean).length,
          metadata: {
            vision_board_item_name: item.name,
            vision_board_item_description: item.description
          }
        })
        .select()
        .single()

      if (storyError) throw storyError

      // Redirect to the story detail page
      router.push(`/vision-board/${itemId}/stories/${storyData.id}`)

    } catch (err) {
      console.error('Error generating story:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate story')
    } finally {
      setGenerating(false)
    }
  }

  async function handleEnhanceWithViva() {
    if (!storyContent.trim() || enhancing) return

    setEnhancing(true)
    setError(null)

    try {
      const prompt = `You are enhancing a user's raw notes/thoughts about their vision into a polished, immersive story.

Their vision board item: "${item?.name}"
${item?.description ? `Description: ${item.description}` : ''}

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

  async function handleCreateBlankStory() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          entity_type: 'vision_board_item',
          entity_id: itemId,
          title: storyTitle || `Story: ${item?.name || 'Untitled'}`,
          content: storyContent || '',
          source: storyContent ? 'ai_assisted' : 'user_written',
          status: 'draft',
          word_count: storyContent.trim().split(/\s+/).filter(Boolean).length
        })
        .select()
        .single()

      if (storyError) throw storyError

      router.push(`/vision-board/${itemId}/stories/${storyData.id}`)

    } catch (err) {
      console.error('Error creating story:', err)
      setError(err instanceof Error ? err.message : 'Failed to create story')
    }
  }

  if (loading) {
    return (
      <Container size="xl" className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  if (error && !item) {
    return (
      <Container size="xl">
        <Card className="text-center p-4 md:p-6 lg:p-8">
          <Text className="text-red-400 mb-4">{error}</Text>
          <Button asChild variant="outline">
            <Link href="/vision-board">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Vision Board
            </Link>
          </Button>
        </Card>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Hero */}
        <PageHero
          eyebrow="VISION BOARD"
          title="Create a Story"
          subtitle={`Bring "${item?.name}" to life through story and audio`}
        >
          <div className="flex justify-center">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/vision-board/${itemId}/stories`}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Stories
              </Link>
            </Button>
          </div>
        </PageHero>

        {/* Mode Toggle */}
        <div className="flex justify-center">
          <div className="inline-flex bg-neutral-800 rounded-full p-1">
            <button
              onClick={() => setMode('viva')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                mode === 'viva'
                  ? 'bg-purple-500 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              VIVA Story
            </button>
            <button
              onClick={() => setMode('write')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                mode === 'write'
                  ? 'bg-teal-500 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Mic className="w-4 h-4" />
              Write Your Own
            </button>
          </div>
        </div>

        {/* Item Preview */}
        {item?.image_url && (
          <Card className="p-4 md:p-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-neutral-800 flex-shrink-0">
                <img 
                  src={item.image_url} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Text className="text-white font-medium truncate">{item.name}</Text>
                {item.description && (
                  <Text size="sm" className="text-neutral-400 line-clamp-2">{item.description}</Text>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* VIVA Generate Mode */}
        {mode === 'viva' && (
          <Card className="p-4 md:p-6 lg:p-8 relative overflow-hidden">
            <VIVALoadingOverlay
              isVisible={generating}
              messages={[
                "VIVA is crafting your vision story...",
                "Imagining you living this reality...",
                "Adding sensory details and emotions...",
                "Creating an immersive first-person narrative...",
                "Putting the finishing touches on your story..."
              ]}
              cycleDuration={8000}
              estimatedTime="This usually takes 15-30 seconds"
              estimatedDuration={25000}
              progress={vivaProgress}
            />

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <Heading level={3} className="text-white mb-2">Let VIVA Write Your Story</Heading>
              <Text className="text-neutral-400 mb-6 max-w-md mx-auto">
                VIVA will create an immersive first-person story about living the reality of your vision.
              </Text>
              
              <div className="max-w-md mx-auto mb-6">
                <Input
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  placeholder="Story title"
                  className="text-center"
                />
              </div>

              <Button
                onClick={handleGenerateStory}
                variant="primary"
                size="lg"
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Writing Story...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Story with VIVA
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Write Your Own Mode */}
        {mode === 'write' && (
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
              
              {/* Recording Textarea with transcription */}
              <RecordingTextarea
                value={storyContent}
                onChange={setStoryContent}
                placeholder="Start writing your story, or click the mic to record and transcribe..."
                rows={6}
                recordingPurpose="quick"
                storageFolder="visionBoard"
                category="story"
              />

              {/* Word count */}
              {storyContent && (
                <Text size="xs" className="text-neutral-500">
                  {storyContent.trim().split(/\s+/).filter(Boolean).length} words
                </Text>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Enhance with VIVA */}
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

                {/* Create Story */}
                <Button
                  onClick={handleCreateBlankStory}
                  variant="primary"
                  disabled={!storyTitle.trim() || !storyContent.trim()}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Create Story
                </Button>
              </div>

              {/* Helper text */}
              <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                <Text size="xs" className="text-neutral-400">
                  <strong className="text-teal-400">Tip:</strong> Click the mic button to record your thoughts, 
                  then use "Enhance with VIVA" to transform your raw ideas into a polished, immersive story.
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
