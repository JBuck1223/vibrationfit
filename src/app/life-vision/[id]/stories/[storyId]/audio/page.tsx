'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Volume2, 
  Mic, 
  Wand2, 
  ListMusic,
  Clock,
  ArrowRight,
  ChevronLeft,
  Eye
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
  TrackingMilestoneCard
} from '@/lib/design-system/components'
import type { Story } from '@/lib/stories'

export default function StoryAudioHubPage({ 
  params 
}: { 
  params: Promise<{ id: string; storyId: string }> 
}) {
  const router = useRouter()
  const supabase = createClient()
  
  const [visionId, setVisionId] = useState<string>('')
  const [storyId, setStoryId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [story, setStory] = useState<Story | null>(null)
  const [stats, setStats] = useState({
    totalSets: 0,
    completedTracks: 0,
    hasRecording: false
  })

  useEffect(() => {
    ;(async () => {
      const p = await params
      setVisionId(p.id)
      setStoryId(p.storyId)
    })()
  }, [params])

  useEffect(() => {
    if (!storyId) return
    loadData()
  }, [storyId])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Load story
    const { data: storyData, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .eq('user_id', user.id)
      .single()

    if (storyError || !storyData) {
      console.error('Error loading story:', storyError)
      setLoading(false)
      return
    }

    setStory(storyData)

    // Load audio stats for this story
    if (storyData.audio_set_id) {
      const { data: tracks } = await supabase
        .from('audio_tracks')
        .select('id')
        .eq('audio_set_id', storyData.audio_set_id)
        .eq('status', 'completed')

      setStats({
        totalSets: 1,
        completedTracks: tracks?.length || 0,
        hasRecording: !!storyData.user_audio_url
      })
    } else {
      setStats({
        totalSets: 0,
        completedTracks: 0,
        hasRecording: !!storyData.user_audio_url
      })
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <Container size="xl" className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size="lg" />
      </Container>
    )
  }

  if (!story) {
    return (
      <Container size="xl">
        <Card className="text-center p-4 md:p-6 lg:p-8">
          <Text className="text-red-400 mb-4">Story not found</Text>
          <Button asChild variant="outline">
            <Link href={`/life-vision/${visionId}/stories`}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Stories
            </Link>
          </Button>
        </Card>
      </Container>
    )
  }

  const hasAudio = stats.totalSets > 0 || stats.hasRecording

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Hero Header */}
        <PageHero
          eyebrow="FOCUS STORY"
          title="Audio Studio"
          subtitle="Transform your story into a powerful audio experience"
        >
          {/* Action Buttons */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto">
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href={`/life-vision/${visionId}/stories/${storyId}/audio/generate`} className="flex items-center justify-center gap-2">
                <Wand2 className="w-4 h-4" />
                <span>Generate</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href={`/life-vision/${visionId}/stories/${storyId}/audio/record`} className="flex items-center justify-center gap-2">
                <Mic className="w-4 h-4" />
                <span>Record</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href={`/life-vision/${visionId}/stories/${storyId}`} className="flex items-center justify-center gap-2">
                <Eye className="w-4 h-4" />
                <span>View Story</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href={`/life-vision/${visionId}/stories`} className="flex items-center justify-center gap-2">
                <ChevronLeft className="w-4 h-4" />
                <span>All Stories</span>
              </Link>
            </Button>
          </div>
        </PageHero>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <TrackingMilestoneCard
            label="AI Audio"
            value={stats.totalSets > 0 ? 'Yes' : 'No'}
            theme="primary"
          />
          <TrackingMilestoneCard
            label="Voice Recording"
            value={stats.hasRecording ? 'Yes' : 'No'}
            theme="secondary"
          />
          <TrackingMilestoneCard
            label="Word Count"
            value={story.word_count || 0}
            theme="accent"
          />
        </div>

        {/* Main Navigation Cards */}
        <Card className="p-4 md:p-6 lg:p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Audio Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* VIVA Voice Generation */}
            <Link href={`/life-vision/${visionId}/stories/${storyId}/audio/generate`}>
              <Card variant="elevated" hover className="cursor-pointer h-full p-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Wand2 className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Generate Audio</h3>
                <p className="text-sm text-neutral-300">
                  Choose from professional AI voices to narrate your focus story.
                </p>
              </Card>
            </Link>

            {/* Personal Recording */}
            <Link href={`/life-vision/${visionId}/stories/${storyId}/audio/record`}>
              <Card variant="elevated" hover className="cursor-pointer h-full p-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Mic className="w-6 h-6 text-teal-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Record Voice</h3>
                <p className="text-sm text-neutral-300">
                  Record your story in your own voice for a deeply personal experience.
                </p>
              </Card>
            </Link>
          </div>
        </Card>

        {/* Quick Start Guide */}
        {!hasAudio && (
          <Card variant="elevated" className="p-4 md:p-6 lg:p-8 bg-primary-500/5 border-primary-500/30">
            <h3 className="text-xl font-semibold text-white mb-4">Getting Started with Audio</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="text-white font-medium">Choose Your Method</p>
                  <p className="text-sm text-neutral-300">Generate AI audio or record in your own voice</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="text-white font-medium">Create Your Audio</p>
                  <p className="text-sm text-neutral-300">Follow the simple steps to create your story audio</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="text-white font-medium">Listen Daily</p>
                  <p className="text-sm text-neutral-300">Play your story to immerse yourself in your vision</p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Button variant="primary" asChild>
                <Link href={`/life-vision/${visionId}/stories/${storyId}/audio/generate`}>
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </Card>
        )}
      </Stack>
    </Container>
  )
}
