'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Plus, 
  FileText, 
  Sparkles, 
  ChevronLeft,
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
  Text
} from '@/lib/design-system/components'
import { StoriesList } from '@/lib/stories'

interface VisionData {
  id: string
  title?: string
  household_id?: string | null
}

export default function StoriesListPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [visionId, setVisionId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [vision, setVision] = useState<VisionData | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  async function loadVision() {
    const supabase = createClient()
    
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
    setLoading(false)
  }

  if (loading) {
    return (
      <Container size="xl" className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  if (error || !vision) {
    return (
      <Container size="xl">
        <Card className="text-center p-4 md:p-6 lg:p-8">
          <Text className="text-red-400 mb-4">{error || 'Vision not found'}</Text>
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
          title="Your Stories"
          subtitle="Create immersive narratives from your life vision. Each story can have its own audio experience."
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/life-vision/${visionId}`}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Vision
              </Link>
            </Button>
            <Button asChild variant="primary" size="sm">
              <Link href={`/life-vision/${visionId}/story/new`}>
                <Sparkles className="w-4 h-4 mr-2" />
                Create Focus Story
              </Link>
            </Button>
          </div>
        </PageHero>

        {/* Stories List */}
        <Card className="p-4 md:p-6 lg:p-8">
          <StoriesList
            entityType="life_vision"
            entityId={visionId}
            createUrl={`/life-vision/${visionId}/story/new`}
            storyUrlPrefix={`/life-vision/${visionId}/story`}
            showCreateButton={true}
            showDeleteButton={true}
            emptyStateMessage="No stories yet. Create your first Focus Story to experience your vision as an immersive day-in-the-life narrative."
          />
        </Card>

        {/* Quick Actions */}
        <Card className="p-4 md:p-6 lg:p-8">
          <h3 className="text-lg font-semibold text-white mb-4">Create a Story</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href={`/life-vision/${visionId}/story/new`}>
              <Card variant="elevated" hover className="p-4 cursor-pointer h-full">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium mb-1">Focus Story</h4>
                    <Text size="sm" className="text-neutral-400">
                      VIVA creates an immersive day-in-the-life narrative from your selected vision categories.
                    </Text>
                  </div>
                  <ArrowRight className="w-5 h-5 text-neutral-500" />
                </div>
              </Card>
            </Link>

            <Link href={`/life-vision/${visionId}/story/new`}>
              <Card variant="elevated" hover className="p-4 cursor-pointer h-full">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-teal-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium mb-1">Write Your Own</h4>
                    <Text size="sm" className="text-neutral-400">
                      Record, dictate, or write your story. Use VIVA to enhance your words.
                    </Text>
                  </div>
                  <ArrowRight className="w-5 h-5 text-neutral-500" />
                </div>
              </Card>
            </Link>
          </div>
        </Card>
      </Stack>
    </Container>
  )
}
