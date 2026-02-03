'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ChevronLeft,
  Sparkles,
  FileText,
  Mic,
  Wand2,
  ArrowRight
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

interface VisionData {
  id: string
  title?: string
  household_id?: string | null
}

export default function NewLifeVisionStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  
  const [visionId, setVisionId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [vision, setVision] = useState<VisionData | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [storyTitle, setStoryTitle] = useState('')
  const [storyContent, setStoryContent] = useState('')
  const [generating, setGenerating] = useState(false)
  const [enhancing, setEnhancing] = useState(false)
  const [vivaProgress, setVivaProgress] = useState(0)

  useEffect(() => {
    ;(async () => {
      const p = await params
      setVisionId(p.id)
    })()
  }, [params])

  useEffect(() => {
    if (!visionId) return
    loadVision()
  }, [visionId])

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

  async function loadVision() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data: visionData, error: visionError } = await supabase
      .from('vision_versions')
      .select('id, title, household_id')
      .eq('id', visionId)
      .eq('user_id', user.id)
      .single()

    if (visionError) {
      setError('Vision not found')
      setLoading(false)
      return
    }

    setVision(visionData)
    setStoryTitle('Custom Story')
    setLoading(false)
  }

  async function handleEnhanceWithViva() {
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

  async function handleCreateStory() {
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

      router.push(`/life-vision/${visionId}/stories/${storyData.id}`)

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

  if (error && !vision) {
    return (
      <Container size="xl">
        <Card className="text-center p-4 md:p-6 lg:p-8">
          <Text className="text-red-400 mb-4">{error}</Text>
          <Button asChild variant="outline">
            <Link href="/life-vision">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Visions
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
          eyebrow="FOCUS STORIES"
          title="Create a Story"
          subtitle="Write or record your own story about your life vision"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/life-vision/${visionId}/stories`}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Stories
              </Link>
            </Button>
          </div>
        </PageHero>

        {/* Focus Story Option */}
        <Card className="p-4 md:p-6 lg:p-8 bg-purple-500/5 border-purple-500/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <Text className="text-white font-medium">Want VIVA to create a Focus Story?</Text>
              <Text size="sm" className="text-neutral-400">
                Select your life areas and let VIVA weave them into a day-in-the-life narrative.
              </Text>
            </div>
            <Button asChild variant="primary" size="sm">
              <Link href={`/life-vision/${visionId}/focus`}>
                Create Focus Story
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </Card>

        {/* Write Your Own */}
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
              storageFolder="lifeVision"
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
                onClick={handleCreateStory}
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
