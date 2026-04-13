'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus,
  Volume2,
  Mic,
  FileText,
  Sparkles,
  Image,
  PenLine,
  Play,
  BookOpen,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  Card,
  Button,
  Spinner,
  Text,
  Badge,
  AudioPlayer,
} from '@/lib/design-system/components'
import type { Story } from '@/lib/stories/types'

const ENTITY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  life_vision: { label: 'Life Vision', icon: Sparkles, color: 'text-purple-400 bg-purple-500/20' },
  vision_board_item: { label: 'Vision Board', icon: Image, color: 'text-cyan-400 bg-cyan-500/20' },
  journal_entry: { label: 'Journal', icon: PenLine, color: 'text-teal-400 bg-teal-500/20' },
  custom: { label: 'Custom', icon: FileText, color: 'text-yellow-400 bg-yellow-500/20' },
}

interface StoryWithAudio extends Story {
  audioUrl?: string | null
}

export default function AudioStoriesPage() {
  const router = useRouter()
  const supabase = createClient()

  const [stories, setStories] = useState<StoryWithAudio[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStories()
  }, [])

  async function loadStories() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: allStories, error } = await supabase
      .from('stories')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error || !allStories) {
      setLoading(false)
      return
    }

    const withAudio: StoryWithAudio[] = []

    for (const story of allStories) {
      let audioUrl: string | null = null

      if (story.audio_set_id) {
        const { data: track } = await supabase
          .from('audio_tracks')
          .select('audio_url')
          .eq('audio_set_id', story.audio_set_id)
          .eq('status', 'completed')
          .maybeSingle()
        audioUrl = track?.audio_url || null
      }

      withAudio.push({ ...story, audioUrl })
    }

    setStories(withAudio)
    setLoading(false)
  }

  const storiesWithAudio = stories.filter(s => s.audioUrl || s.user_audio_url)
  const storiesWithoutAudio = stories.filter(s => !s.audioUrl && !s.user_audio_url)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="px-4 md:px-6 py-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Focus Stories</h2>
        <Text className="text-neutral-400 mb-4">
          Your immersive day-in-the-life narratives with audio
        </Text>
        <Button asChild variant="primary" size="sm">
          <Link href="/story/new">
            <Plus className="w-4 h-4 mr-2" />
            Create Story
          </Link>
        </Button>
      </div>

      {stories.length === 0 ? (
        <Card className="p-8 md:p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-neutral-500" />
          </div>
          <Text className="text-neutral-400 mb-6">
            No stories yet. Create your first immersive narrative to listen to.
          </Text>
          <Button asChild variant="primary">
            <Link href="/story/new">
              <Plus className="w-4 h-4 mr-2" />
              Create Story
            </Link>
          </Button>
        </Card>
      ) : (
        <>
          {/* Stories with Audio */}
          {storiesWithAudio.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-primary-500" />
                <h3 className="text-lg font-semibold text-white">Ready to Listen</h3>
                <Badge variant="success">{storiesWithAudio.length}</Badge>
              </div>
              <div className="space-y-3">
                {storiesWithAudio.map(story => {
                  const meta = ENTITY_META[story.entity_type] || ENTITY_META.custom
                  const MetaIcon = meta.icon
                  const audioUrl = story.audioUrl || story.user_audio_url
                  const audioType = story.audioUrl ? 'AI' : 'Recording'

                  return (
                    <Card key={story.id} className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                          <MetaIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Text className="text-white font-medium truncate">{story.title || 'Untitled Story'}</Text>
                          <Text size="xs" className="text-neutral-500">
                            {meta.label} &middot; {story.word_count || 0} words &middot; {audioType}
                          </Text>
                        </div>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/story/${story.id}`}>
                            <FileText className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                      {audioUrl && (
                        <AudioPlayer
                          track={{
                            id: `story-${story.id}`,
                            title: story.title || 'Story Audio',
                            artist: story.audioUrl ? 'VIVA' : 'Your Voice',
                            duration: story.user_audio_duration_seconds || 0,
                            url: audioUrl,
                          }}
                          autoPlay={false}
                        />
                      )}
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Stories without Audio */}
          {storiesWithoutAudio.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-neutral-500" />
                <h3 className="text-lg font-semibold text-white">Needs Audio</h3>
                <Badge variant="secondary">{storiesWithoutAudio.length}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {storiesWithoutAudio.map(story => {
                  const meta = ENTITY_META[story.entity_type] || ENTITY_META.custom
                  const MetaIcon = meta.icon

                  return (
                    <Link key={story.id} href={`/story/${story.id}/audio`} className="block">
                      <Card variant="outlined" className="p-4 hover:border-neutral-600 transition-all hover:-translate-y-0.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                            <MetaIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Text className="text-white font-medium truncate">{story.title || 'Untitled Story'}</Text>
                            <Text size="xs" className="text-neutral-500">
                              {meta.label} &middot; {story.word_count || 0} words
                            </Text>
                          </div>
                          <Play className="w-4 h-4 text-neutral-500" />
                        </div>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
