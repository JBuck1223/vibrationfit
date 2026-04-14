'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Volume2,
  Mic,
  Wand2,
  ArrowRight,
  ChevronLeft,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  Container,
  Stack,
  Card,
  Button,
  Spinner,
  Text,
  TrackingMilestoneCard,
} from '@/lib/design-system/components'
import type { Story } from '@/lib/stories'

export default function StoryAudioHubPage({
  params,
}: {
  params: Promise<{ storyId: string }>
}) {
  const router = useRouter()
  const supabase = createClient()

  const [storyId, setStoryId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [story, setStory] = useState<Story | null>(null)
  const [stats, setStats] = useState({
    totalSets: 0,
    completedTracks: 0,
    hasRecording: false,
  })

  useEffect(() => {
    ;(async () => {
      const p = await params
      setStoryId(p.storyId)
    })()
  }, [params])

  useEffect(() => {
    if (!storyId) return
    loadData()
  }, [storyId])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: storyData, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .eq('user_id', user.id)
      .single()

    if (storyError || !storyData) {
      setLoading(false)
      return
    }

    setStory(storyData)

    if (storyData.audio_set_id) {
      const { data: tracks } = await supabase
        .from('audio_tracks')
        .select('id')
        .eq('audio_set_id', storyData.audio_set_id)
        .eq('status', 'completed')

      setStats({
        totalSets: 1,
        completedTracks: tracks?.length || 0,
        hasRecording: !!storyData.user_audio_url,
      })
    } else {
      setStats({
        totalSets: 0,
        completedTracks: 0,
        hasRecording: !!storyData.user_audio_url,
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
      <Container size="xl" className="py-6">
        <Card className="text-center p-4 md:p-6 lg:p-8">
          <Text className="text-red-400 mb-4">Story not found</Text>
          <Button asChild variant="outline">
            <Link href="/story">
              <ChevronLeft className="w-4 h-4 mr-2" />
              All Stories
            </Link>
          </Button>
        </Card>
      </Container>
    )
  }

  const hasAudio = stats.totalSets > 0 || stats.hasRecording

  return (
    <Container size="xl" className="py-6">
      <Stack gap="lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-white">{story?.title || 'Story Audio'}</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/story/${storyId}/audio/generate`} className="flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5" />
                Generate
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/story/${storyId}/audio/record`} className="flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5" />
                Record
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <TrackingMilestoneCard label="AI Audio" value={stats.totalSets > 0 ? 'Yes' : 'No'} theme="primary" />
          <TrackingMilestoneCard label="Voice Recording" value={stats.hasRecording ? 'Yes' : 'No'} theme="secondary" />
          <TrackingMilestoneCard label="Word Count" value={story.word_count || 0} theme="accent" />
        </div>

        {/* Audio Options */}
        <Card className="p-4 md:p-6 lg:p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Audio Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href={`/story/${storyId}/audio/generate`}>
              <Card variant="elevated" hover className="cursor-pointer h-full p-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Wand2 className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Generate Audio</h3>
                <p className="text-sm text-neutral-300">
                  Choose from professional AI voices to narrate your story.
                </p>
              </Card>
            </Link>
            <Link href={`/story/${storyId}/audio/record`}>
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

        {/* Getting Started */}
        {!hasAudio && (
          <Card variant="elevated" className="p-4 md:p-6 lg:p-8 bg-primary-500/5 border-primary-500/30">
            <h3 className="text-xl font-semibold text-white mb-4">Getting Started with Audio</h3>
            <div className="space-y-3">
              {[
                { step: 1, title: 'Choose Your Method', desc: 'Generate AI audio or record in your own voice' },
                { step: 2, title: 'Create Your Audio', desc: 'Follow the simple steps to create your story audio' },
                { step: 3, title: 'Listen Daily', desc: 'Play your story to immerse yourself in your vision' },
              ].map(item => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                    {item.step}
                  </div>
                  <div>
                    <p className="text-white font-medium">{item.title}</p>
                    <p className="text-sm text-neutral-300">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Button variant="primary" asChild>
                <Link href={`/story/${storyId}/audio/generate`}>
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
